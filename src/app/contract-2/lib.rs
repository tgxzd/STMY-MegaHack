use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::anchor::{commit, delegate, ephemeral};
use ephemeral_rollups_sdk::cpi::DelegateConfig;
use ephemeral_rollups_sdk::ephem::{commit_accounts, commit_and_undelegate_accounts};
declare_id!("CJ2k7Z7dQZDKmNyiBHqK6zBLCRqcyqA5xHcYUohZgVt4");

#[ephemeral]
#[program]
pub mod contract_7 {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, machine_id: String) -> Result<()> {
        let sensor_data = &mut ctx.accounts.sensor_data;
        sensor_data.readings = Vec::new();
        sensor_data.image_data = Vec::new();
        sensor_data.machine_id = machine_id;
        sensor_data.total_readings = 0;
        sensor_data.is_on = false;
        msg!("Sensor Data Account initialized for machine: {}", sensor_data.machine_id);
        Ok(())
    }

    pub fn turn_on(ctx: Context<TogglePower>) -> Result<()> {
        let sensor_data = &mut ctx.accounts.sensor_data;
        
        if sensor_data.is_on {
            return Err(error!(ErrorCode::MachineAlreadyOn));
        }

        sensor_data.is_on = true;
        msg!("Machine {} turned ON", sensor_data.machine_id);
        Ok(())
    }

    pub fn turn_off(ctx: Context<TogglePower>) -> Result<()> {
        let sensor_data = &mut ctx.accounts.sensor_data;
        
        if !sensor_data.is_on {
            return Err(error!(ErrorCode::MachineAlreadyOff));
        }

        sensor_data.is_on = false;
        msg!("Machine {} turned OFF", sensor_data.machine_id);
        Ok(())
    }

    /// Delegate the account to the delegation program
    pub fn delegate(ctx: Context<DelegateInput>) -> Result<()> {
        ctx.accounts.delegate_pda(
            &ctx.accounts.payer,
            &[b"machine", ctx.accounts.sensor_data.machine_id.as_bytes()],  
            DelegateConfig::default(),
        )?;
        Ok(())
    }

    pub fn undelegate(ctx: Context<UndelegateAccounts>) -> Result<()> {
        commit_and_undelegate_accounts(
            &ctx.accounts.payer,
            vec![&ctx.accounts.pda.to_account_info()],
            &ctx.accounts.magic_context,
            &ctx.accounts.magic_program,
        )?;
        Ok(())
    }

    pub fn add_data(
        ctx: Context<AddData>, 
        temperature_c: f32,
        humidity: f32,
    ) -> Result<()> {
        let sensor_data = &mut ctx.accounts.sensor_data;

        // Validate machine is turned on
        if !sensor_data.is_on {
            return Err(error!(ErrorCode::MachineNotOn));
        }

        // Create new reading
        let new_reading = SensorReading {
            temperature_c,
            humidity,
            timestamp: Clock::get()?.unix_timestamp,
        };

        // Add the reading to the vector
        sensor_data.readings.push(new_reading);
        sensor_data.total_readings += 1;

        msg!("New Sensor Reading added!");
        msg!("Machine ID: {}", sensor_data.machine_id);
        msg!("Temperature: {} °C", temperature_c);
        msg!("Humidity: {}%", humidity);
        msg!("Total readings: {}", sensor_data.total_readings);
        
        Ok(())
    }

    pub fn add_image(
        ctx: Context<AddData>,
        image_uri: String,
    ) -> Result<()> {
        let sensor_data = &mut ctx.accounts.sensor_data;

        // Validate machine is turned on
        if !sensor_data.is_on {
            return Err(error!(ErrorCode::MachineNotOn));
        }

        // Validate input lengths
        if image_uri.len() > SensorData::MAX_URI_LENGTH {
            return Err(error!(ErrorCode::UriTooLong));
        }

        // Create new image data
        let new_image = ImageData {
            image_uri: image_uri.clone(),
            timestamp: Clock::get()?.unix_timestamp,
        };

        // Add the image data to the vector
        sensor_data.image_data.push(new_image);

        msg!("New Image Data added!");
        msg!("Machine ID: {}", sensor_data.machine_id);
        msg!("Image URI: {}", image_uri);
        
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(machine_id: String)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + SensorData::MAX_SIZE,
        seeds = [b"machine", machine_id.as_bytes()],
        bump
    )]
    pub sensor_data: Account<'info, SensorData>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddData<'info> {
    #[account(
        mut,
        seeds = [b"machine", sensor_data.machine_id.as_bytes()],
        bump
    )]
    pub sensor_data: Account<'info, SensorData>,
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct TogglePower<'info> {
    #[account(
        mut,
        seeds = [b"machine", sensor_data.machine_id.as_bytes()],
        bump
    )]
    pub sensor_data: Account<'info, SensorData>,
    pub user: Signer<'info>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct SensorReading {
    pub temperature_c: f32,
    pub humidity: f32,
    pub timestamp: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct ImageData {
    pub image_uri: String,
    pub timestamp: i64,
}

#[account]
#[derive(Default)]
pub struct SensorData {
    pub readings: Vec<SensorReading>,
    pub image_data: Vec<ImageData>,
    pub machine_id: String,
    pub total_readings: u64,
    pub is_on: bool,
}

impl SensorData {
    pub const MAX_URI_LENGTH: usize = 100;
    pub const MAX_MACHINE_ID_LENGTH: usize = 50;
    pub const MAX_READINGS: usize = 50;
    pub const MAX_IMAGES: usize = 40;
    
    // Calculate total space needed:
    // 8 bytes (discriminator) +
    // (4 + MAX_MACHINE_ID_LENGTH) bytes (String) +
    // 8 bytes (total_readings) +
    // 1 byte (is_on boolean) +
    // Vec<SensorReading> space:
    //   - 4 bytes (vec len) +
    //   - MAX_READINGS * (
    //     4 bytes (f32) + 
    //     4 bytes (f32) + 
    //     8 bytes (i64)
    //   ) +
    // Vec<ImageData> space:
    //   - 4 bytes (vec len) +
    //   - MAX_IMAGES * (
    //     (4 + MAX_URI_LENGTH) bytes (String) +
    //     8 bytes (i64)
    //   )
    pub const MAX_SIZE: usize = 8 + (4 + SensorData::MAX_MACHINE_ID_LENGTH) + 8 + 1 +
        4 + (SensorData::MAX_READINGS * (4 + 4 + 8)) +
        4 + (SensorData::MAX_IMAGES * ((4 + SensorData::MAX_URI_LENGTH) + 8));
}

#[delegate]
#[derive(Accounts)]
pub struct DelegateInput<'info> {
    pub payer: Signer<'info>,
    /// CHECK The pda to delegate
    #[account(mut, del)]
    pub pda: AccountInfo<'info>,
    pub sensor_data: Account<'info, SensorData>,
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

#[error_code]
pub enum ErrorCode {
    #[msg("Image URI is too long")]
    UriTooLong,
    #[msg("Machine ID is too long")]
    MachineIdTooLong,
    #[msg("Machine is already turned on")]
    MachineAlreadyOn,
    #[msg("Machine is already turned off")]
    MachineAlreadyOff,
    #[msg("Machine must be turned on to perform this action")]
    MachineNotOn,
}
