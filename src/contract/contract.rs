use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::{commit, delegate, ephemeral};
use ephemeral_rollups_sdk::cpi::DelegateConfig;
use ephemeral_rollups_sdk::ephem::{commit_accounts, commit_and_undelegate_accounts};
declare_id!("4oweKJAgekQk5WoixX6Uagk8SNTbpPZb6QhmYd9Vv6nW");


#[ephemeral]
#[program]
pub mod agrox_contract {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let cluster = &mut ctx.accounts.cluster;
        cluster.authority = ctx.accounts.authority.key();
        cluster.machine_count = 0;
        cluster.total_data_uploads = 0;
        cluster.data_request_count = 0;
        cluster.plant_count = 0;
        cluster.machines = Vec::new();
        cluster.plants = Vec::new();
        cluster.bump = ctx.bumps.cluster;

        msg!("AgroX system initialized by: {}", cluster.authority);
        Ok(())
    }

    /// Delegate the account to the delegation program
    pub fn delegate(ctx: Context<DelegateInput>) -> Result<()> {
        ctx.accounts.delegate_pda(
            &ctx.accounts.payer,
            &[b"cluster"],
            DelegateConfig::default(),
        )?;
        Ok(())
    }

    /// Undelegate the account from the delegation program
    pub fn undelegate(ctx: Context<UndelegateAccounts>) -> Result<()> {
        commit_and_undelegate_accounts(
            &ctx.accounts.payer,
            vec![&ctx.accounts.pda.to_account_info()],
            &ctx.accounts.magic_context,
            &ctx.accounts.magic_program,
        )?;
        Ok(())
    }

    pub fn register_machine(ctx: Context<RegisterMachine>, machine_id: String) -> Result<()> {
        // Validate machine ID isn't already used
        let machines = &ctx.accounts.cluster.machines;
        require!(!machines.iter().any(|(id, _)| id == &machine_id), ErrorCode::MachineIdAlreadyExists);

        // Create and initialize the machine account
        let machine = &mut ctx.accounts.machine;
        machine.owner = ctx.accounts.user.key();
        machine.machine_id = machine_id.clone();
        machine.is_active = false;
        machine.data_count = 0;
        machine.image_count = 0;
        machine.rewards_earned = 0;
        machine.last_data_timestamp = 0;
        machine.last_image_timestamp = 0;
        machine.data_used_count = 0;
        machine.plants = Vec::new();
        machine.plant_count = 0;
        machine.bump = ctx.bumps.machine;

        // Add machine to cluster
        let cluster = &mut ctx.accounts.cluster;
        cluster.machines.push((machine_id.clone(), ctx.accounts.machine.key()));
        cluster.machine_count += 1;

        msg!("Machine registered: {}", machine_id);
        Ok(())
    }

    pub fn create_plant(ctx: Context<CreatePlant>, plant_name: String) -> Result<()> {
        // Create and initialize the plant account
        let plant = &mut ctx.accounts.plant;
        plant.creator = ctx.accounts.user.key();
        plant.plant_name = plant_name.clone();
        plant.data_count = 0;
        plant.image_count = 0;
        plant.creation_timestamp = Clock::get()?.unix_timestamp;
        plant.last_update_timestamp = 0;
        plant.machine = ctx.accounts.machine.key();
        plant.bump = ctx.bumps.plant;

        // Add plant to cluster
        let cluster = &mut ctx.accounts.cluster;
        cluster.plants.push((plant_name.clone(), ctx.accounts.plant.key()));
        cluster.plant_count += 1;

        // Add plant to the machine
        let machine = &mut ctx.accounts.machine;
        machine.plants.push((plant_name.clone(), ctx.accounts.plant.key()));
        machine.plant_count += 1;

        msg!("Plant created: {} for machine: {}", plant_name, machine.machine_id);
        Ok(())
    }

    pub fn start_machine(ctx: Context<ControlMachine>) -> Result<()> {
        let machine = &mut ctx.accounts.machine;
        
        // Only the machine owner can start it
        require!(machine.owner == ctx.accounts.user.key(), ErrorCode::Unauthorized);
        
        // Set machine as active
        machine.is_active = true;
        
        msg!("Machine started: {}", machine.machine_id);
        Ok(())
    }

    pub fn stop_machine(ctx: Context<ControlMachine>) -> Result<()> {
        let machine = &mut ctx.accounts.machine;
        
        // Only the machine owner can stop it
        require!(machine.owner == ctx.accounts.user.key(), ErrorCode::Unauthorized);
        
        // Set machine as inactive
        machine.is_active = false;
        
        msg!("Machine stopped: {}", machine.machine_id);
        Ok(())
    }

    pub fn upload_data(
        ctx: Context<UploadData>,
        temperature: f64,
        humidity: f64,
        image_url: Option<String>,
    ) -> Result<()> {
        let machine = &mut ctx.accounts.machine;
        let cluster = &mut ctx.accounts.cluster;
        let plant = &mut ctx.accounts.plant;
        let data = &mut ctx.accounts.data;
        let clock = Clock::get()?;
        
        // Verify the plant belongs to the machine
        require!(
            plant.machine == machine.key(),
            ErrorCode::PlantNotLinkedToMachine
        );
        
        // Initialize data account properties if it's a new account
        if data.data_entries.is_empty() && data.machine.eq(&Pubkey::default()) {
            data.machine = machine.key();
            data.plant = plant.key();
            data.data_entries = Vec::new();
        }
        
        // Create new data entry
        let new_entry = DataEntry {
            timestamp: clock.unix_timestamp,
            temperature,
            humidity,
            image_url: image_url.clone(),
            used_count: 0,
        };
        
        // Add the entry to the data vector
        data.data_entries.push(new_entry);
        
        // Update machine, plant and cluster
        machine.data_count += 1;
        machine.last_data_timestamp = clock.unix_timestamp;
        plant.data_count += 1;
        plant.last_update_timestamp = clock.unix_timestamp;
        cluster.total_data_uploads += 1;
        
        // Check if this upload includes an image
        if image_url.is_some() {
            machine.image_count += 1;
            plant.image_count += 1;
            machine.last_image_timestamp = clock.unix_timestamp;
            
            // Additional reward for including an image
            machine.rewards_earned += 10; // 10 tokens per image
        }
        
        // Base reward for sensor data
        machine.rewards_earned += 1; // 1 token per data upload
        
        msg!("Data uploaded from machine: {} for plant: {}", machine.machine_id, plant.plant_name);
        Ok(())
    }

    pub fn use_data(ctx: Context<UseData>, entry_index: u64) -> Result<()> {
        let data = &mut ctx.accounts.data;
        let machine = &mut ctx.accounts.machine;
        let user = &ctx.accounts.user;
        let cluster = &mut ctx.accounts.cluster;
        let entry_index = entry_index as usize;
        
        // Ensure the entry index is valid
        require!(entry_index < data.data_entries.len(), ErrorCode::InvalidDataEntryIndex);
        
        // Update usage count for the specific entry
        data.data_entries[entry_index].used_count += 1;
        machine.data_used_count += 1;
        cluster.data_request_count += 1;
        
        // Calculate and apply rewards to machine owner
        let reward_amount = 2; // 2 tokens per data usage
        machine.rewards_earned += reward_amount;
        
        msg!("Data entry {} used by: {}", entry_index, user.key());
        Ok(())
    }

    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        let machine = &mut ctx.accounts.machine;
        
        // Only owner can claim rewards
        require!(machine.owner == ctx.accounts.user.key(), ErrorCode::Unauthorized);
        
        // Check there are rewards to claim
        let rewards = machine.rewards_earned;
        require!(rewards > 0, ErrorCode::NoRewardsAvailable);
        
        // Reset rewards in the machine account
        machine.rewards_earned = 0;
        
        // In a real implementation, you would transfer tokens here
        // For now we just log the claim
        msg!("Rewards claimed: {} tokens for machine: {}", rewards, machine.machine_id);
        
        Ok(())
    }
}


#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = Cluster::SPACE,
        seeds = [b"cluster"],
        bump
    )]
    pub cluster: Account<'info, Cluster>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(machine_id: String)]
pub struct RegisterMachine<'info> {
    #[account(
        mut,
        realloc = Cluster::BASE_SPACE + (Cluster::MACHINE_ENTRY_SIZE * (cluster.machines.len() + 1)),
        realloc::payer = user,
        realloc::zero = false,
    )]
    pub cluster: Account<'info, Cluster>,
    
    #[account(
        init,
        payer = user,
        space = Machine::SPACE,
        seeds = [b"machine", machine_id.as_bytes()],
        bump
    )]
    pub machine: Account<'info, Machine>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(plant_name: String)]
pub struct CreatePlant<'info> {
    #[account(mut)]
    pub cluster: Account<'info, Cluster>,
    
    #[account(
        init,
        payer = user,
        space = PlantData::SPACE,
        seeds = [b"plant", plant_name.as_bytes()],
        bump
    )]
    pub plant: Account<'info, PlantData>,
    
    #[account(
        mut,
        constraint = machine.owner == user.key() @ ErrorCode::Unauthorized
    )]
    pub machine: Account<'info, Machine>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ControlMachine<'info> {
    #[account(mut)]
    pub machine: Account<'info, Machine>,
    
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct UploadData<'info> {
    #[account(mut)]
    pub cluster: Account<'info, Cluster>,
    
    #[account(
        mut,
        constraint = machine.is_active @ ErrorCode::MachineNotActive,
    )]
    pub machine: Account<'info, Machine>,

    #[account(
        mut,
        constraint = plant.machine == machine.key() @ ErrorCode::PlantNotLinkedToMachine,
    )]
    pub plant: Account<'info, PlantData>,
    
    #[account(
        init_if_needed,
        payer = payer,
        space = IoTData::space(1),
        seeds = [b"data", machine.machine_id.as_bytes(), plant.plant_name.as_bytes()],
        bump
    )]
    pub data: Account<'info, IoTData>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UseData<'info> {
    #[account(mut)]
    pub cluster: Account<'info, Cluster>,
    
    #[account(mut)]
    pub machine: Account<'info, Machine>,
    
    #[account(mut)]
    pub data: Account<'info, IoTData>,
    
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(mut)]
    pub machine: Account<'info, Machine>,
    
    pub user: Signer<'info>,
}

#[account]
pub struct Cluster {
    pub authority: Pubkey,
    pub machine_count: u64,
    pub total_data_uploads: u64,
    pub data_request_count: u64,
    pub plant_count: u64,
    pub machines: Vec<(String, Pubkey)>,
    pub plants: Vec<(String, Pubkey)>,
    pub bump: u8,
}

impl Cluster {
    pub const SPACE: usize = Self::BASE_SPACE; // Initially no machines or plants
    
    pub const BASE_SPACE: usize = 8 + // discriminator
                            32 + // authority
                            8 + // machine_count
                            8 + // total_data_uploads
                            8 + // data_request_count
                            8 + // plant_count
                            4 + // machines vec length
                            4 + // plants vec length
                            1; // bump
                            
    pub const MACHINE_ENTRY_SIZE: usize = 36 + // machine_id (max 32 chars + 4 bytes for length)
                                        32; // pubkey
                                        
    pub const PLANT_ENTRY_SIZE: usize = 36 + // plant_name (max 32 chars + 4 bytes for length)
                                      32; // pubkey
}

#[account]
pub struct Machine {
    pub owner: Pubkey,
    pub machine_id: String,
    pub is_active: bool,
    pub data_count: u64,
    pub image_count: u64,
    pub rewards_earned: u64,
    pub last_data_timestamp: i64,
    pub last_image_timestamp: i64,
    pub data_used_count: u64,
    pub plants: Vec<(String, Pubkey)>,
    pub plant_count: u64,
    pub bump: u8,
}

impl Machine {
    pub const SPACE: usize = 8 + // discriminator
                            32 + // owner
                            36 + // machine_id (max 32 chars + 4 bytes for length)
                            1 + // is_active
                            8 + // data_count
                            8 + // image_count
                            8 + // rewards_earned
                            8 + // last_data_timestamp
                            8 + // last_image_timestamp
                            8 + // data_used_count
                            4 + // plants vec length
                            8 + // plant_count
                            1; // bump
}

#[account]
pub struct PlantData {
    pub creator: Pubkey,
    pub plant_name: String,
    pub data_count: u64,
    pub image_count: u64,
    pub creation_timestamp: i64,
    pub last_update_timestamp: i64,
    pub machine: Pubkey,
    pub bump: u8,
}

impl PlantData {
    pub const SPACE: usize = 8 + // discriminator
                            32 + // creator
                            36 + // plant_name (max 32 chars + 4 bytes for length)
                            8 + // data_count
                            8 + // image_count
                            8 + // creation_timestamp
                            8 + // last_update_timestamp
                            32 + // machine
                            1; // bump
}

#[account]
pub struct IoTData {
    pub machine: Pubkey,
    pub plant: Pubkey,
    pub data_entries: Vec<DataEntry>,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct DataEntry {
    pub timestamp: i64,
    pub temperature: f64,
    pub humidity: f64,
    pub image_url: Option<String>,
    pub used_count: u64,
}

impl IoTData {
    pub const BASE_SPACE: usize = 8 + // discriminator
                             32 + // machine
                             32 + // plant
                             4 + // vec length (u32)
                             1; // bump
                             
    pub const ENTRY_SPACE: usize = 8 + // timestamp
                               8 + // temperature
                               8 + // humidity
                               (1 + 100) + // Option<String>
                               8; // used_count
                               
    pub fn space(max_entries: usize) -> usize {
        Self::BASE_SPACE + (Self::ENTRY_SPACE * max_entries)
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("Machine ID already exists")]
    MachineIdAlreadyExists,
    #[msg("Unauthorized operation")]
    Unauthorized,
    #[msg("Machine is not active")]
    MachineNotActive,
    #[msg("No rewards available to claim")]
    NoRewardsAvailable,
    #[msg("Unregistered plant")]
    UnregisteredPlant,
    #[msg("Invalid data entry index")]
    InvalidDataEntryIndex,
    #[msg("Plant not linked to the specified machine")]
    PlantNotLinkedToMachine,
}

#[delegate]
#[derive(Accounts)]
pub struct DelegateInput<'info> {
    pub payer: Signer<'info>,
    /// CHECK The pda to delegate
    #[account(mut, del)]
    pub pda: AccountInfo<'info>,
}

#[commit]
#[derive(Accounts)]
pub struct UndelegateAccounts<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: The PDA to undelegate
    #[account(mut)]
    pub pda: AccountInfo<'info>,
}