'use client';
import { useEffect, useState } from 'react';
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import idl from '@/contract/idl.json';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as borsh from "@coral-xyz/borsh";

const PROGRAM_ID = new PublicKey("5AcbpD3VGWLsLVrVpXZsDUvitNdbCCGL82B27MYsPsuG");

// Define the type for machine accounts based on the IDL
type MachineAccount = {
  owner: PublicKey;
  machineId: string;
  isActive: boolean;
  dataCount: number;
  imageCount: number;
  rewardsEarned: number;
  lastDataTimestamp: number;
  lastImageTimestamp: number;
  dataUsedCount: number;
  authBump: number;
  bump: number;
  publicKey: PublicKey;
};

// Define the type for plant accounts
type PlantAccount = {
  creator: PublicKey;
  plantName: string;
  dataCount: number;
  imageCount: number;
  creationTimestamp: number;
  lastUpdateTimestamp: number;
  bump: number;
  publicKey: PublicKey;
};

const programIdl = idl as anchor.Idl;

// Log the IDL instructions to see what's available
console.log("IDL Instructions:", programIdl.instructions?.map(i => i.name));

// Define a borsh schema for the cluster account
// This is a best guess based on common Anchor account patterns
const clusterSchema = borsh.struct([
  // First 8 bytes are the account discriminator
  borsh.array(borsh.u8(), 8, "discriminator"),
  // Common fields that might be in a cluster account
  borsh.publicKey("authority"),
  borsh.u64("totalMachines"),
  borsh.u64("totalPlants"),
  borsh.u8("bump")
]);

// Helper function to deserialize cluster account data
const deserializeClusterAccount = (data: Buffer) => {
  try {
    // Skip the account discriminator (first 8 bytes) as we already know what account type we're working with
    const decoded = clusterSchema.decode(data);
    return {
      discriminator: Array.from(decoded.discriminator),
      authority: decoded.authority,
      totalMachines: decoded.totalMachines.toString(),
      totalPlants: decoded.totalPlants.toString(),
      bump: decoded.bump
    };
  } catch (error) {
    console.error("Failed to deserialize cluster account with borsh:", error);
    // Fallback: just log the raw discriminator
    if (data && data.length >= 8) {
      return {
        discriminator: Array.from(data.slice(0, 8)),
        rawData: Array.from(data)
      };
    }
    return null;
  }
};

const TestPage = () => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [machineId, setMachineId] = useState("AgroX-0");
  const [registeredMachines, setRegisteredMachines] = useState<MachineAccount[]>([]);
  const [isLoadingMachines, setIsLoadingMachines] = useState(false);
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  
  // Upload data state
  const [uploadDataOpen, setUploadDataOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<string>("");
  const [selectedPlant, setSelectedPlant] = useState<string>("");
  const [plantName, setPlantName] = useState<string>("");
  const [temperature, setTemperature] = useState<string>("25.0");
  const [humidity, setHumidity] = useState<string>("60.0");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isUploadingData, setIsUploadingData] = useState(false);
  const [isCreatingPlant, setIsCreatingPlant] = useState(false);
  const [plants, setPlants] = useState<PlantAccount[]>([]);
  const [isLoadingPlants, setIsLoadingPlants] = useState(false);
  const [createPlantOpen, setCreatePlantOpen] = useState(false);

  const getProgram = () => {
    if (!wallet) return null;
    
    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      { commitment: 'processed' }
    );
    
    const program = new Program(programIdl, provider); // This is correct already please don't change it
    return program;
  };

  useEffect(() => {
    checkIfInitialized();
    getMachineData();
    find_cluster_pda();
    if (wallet) {
      fetchAllMachines();
      fetchAllPlants();
    }
  }, [wallet, connection]);

  useEffect(() => {
    console.log("Current registered machines:", registeredMachines);
  }, [registeredMachines]);

  const checkIfInitialized = async () => {
    try {
      if (!wallet) return;
      
      const program = getProgram();
      if (!program) return;

      const [clusterPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("cluster")],
        PROGRAM_ID
      );

      // Try to fetch the system state account
      try {
        const clusterInfo = await connection.getAccountInfo(clusterPda);
        // console.log("Checking initialization: Cluster account exists:", !!clusterInfo);
        
        if (clusterInfo) {
          // console.log("Cluster account data length:", clusterInfo.data.length);
          try {
            // Try to deserialize using borsh instead of Anchor
            const clusterData = deserializeClusterAccount(clusterInfo.data);
            // console.log("Deserialized cluster account using borsh:", clusterData);
          } catch (err) {
            console.error("Failed to deserialize cluster account:", err);
          }
        }
        
        setIsInitialized(!!clusterInfo);
      } catch (err) {
        console.error("Error checking cluster account:", err);
        setIsInitialized(false);
      }
    } catch (error) {
      console.error("Error checking initialization:", error);
      // If there's an error fetching the account, assume it's not initialized
      setIsInitialized(false);
    }
  };

  const initializeContract = async () => {
    try {
      setIsInitializing(true);
      const program = getProgram();
      
      if (!program || !wallet) {
        toast.error("Wallet not connected");
        return;
      }

      // Find the PDA for the system state
      const [clusterPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("cluster")],
        PROGRAM_ID
      );

      // Check if the account already exists
      const accountInfo = await connection.getAccountInfo(clusterPda);
      if (accountInfo) {
        console.log("System state account already exists");
        console.log("Account data length:", accountInfo.data.length);
        
        // Try to deserialize with borsh
        try {
          const decodedData = deserializeClusterAccount(accountInfo.data);
          console.log("Cluster account (Deserialized with borsh):", decodedData);
          setIsInitialized(true);
          toast.success("Contract is already initialized");
          return;
        } catch (err) {
          console.error("Failed to deserialize cluster account with borsh:", err);
          // Try with Anchor as fallback
          try {
            
            // Get the raw account data
            const accountInfo = await connection.getAccountInfo(clusterPda);
            if (!accountInfo) {
              console.log("Cluster account doesn't exist");
              return;
            }
            
            // Deserialize with borsh instead of using Anchor fetch
            const clusterAccount = deserializeClusterAccount(accountInfo.data);
            console.log("Cluster account (Deserialized with borsh):", clusterAccount);
            setIsInitialized(true);
            toast.success("Contract is already initialized");
            return;
          } catch (anchorErr) {
            console.error("Failed to deserialize with Anchor:", anchorErr);
            console.log("This might indicate the account structure has changed");
          }
        }
      }

      // Call the initialize instruction
      console.log("Calling initialize instruction");
      const tx = await program.methods
        .initialize()
        .accounts({
          cluster: clusterPda,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc({
          skipPreflight: true,
          commitment: 'confirmed',
          maxRetries: 3
        });
      
      toast.success("Contract initialized successfully");
      console.log("Transaction signature:", tx);
      
      // Verify the account was created
      const verifyAccountInfo = await connection.getAccountInfo(clusterPda);
      if (verifyAccountInfo) {
        console.log("Verified: System state account created");
        console.log("Account data length:", verifyAccountInfo.data.length);
        
        // Try to deserialize the newly created account with borsh
        try {
          const decodedData = deserializeClusterAccount(verifyAccountInfo.data);
          console.log("Newly created cluster account (borsh):", decodedData);
        } catch (err) {
          console.warn("Warning: Could not deserialize newly created account:", err);
        }
      }
      
      // Update the initialization status
      setIsInitialized(true);
    } catch (error) {
      console.error("Error initializing contract:", error);
      toast.error(`Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsInitializing(false);
    }
  };

  const registerMachine = async () => {
    if (!machineId.trim()) {
      toast.error("Machine ID is required");
      return;
    }

    try {
      setIsRegistering(true);
      const program = getProgram();
      
      if (!program || !wallet) {
        toast.error("Wallet not connected");
        return;
      }

      // Find the PDAs
      const [clusterPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("cluster")],
        PROGRAM_ID
      );

      // According to IDL, machine PDA uses "agrox" prefix, not "machine"
      const [machinePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("agrox"), Buffer.from(machineId)],
        PROGRAM_ID
      );

      console.log("Machine PDA being used:", machinePda.toBase58());

      // Call the register_machine instruction
      console.log("Available program methods for register:", Object.keys(program.methods));
      const tx = await program.methods
        .registerMachine(machineId)
        .accounts({
          cluster: clusterPda,
          machine: machinePda,
          user: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc({
          skipPreflight: true,
          commitment: 'confirmed',
          maxRetries: 3
        });
      
      toast.success(`Machine ${machineId} registered successfully`);
      console.log("Transaction signature:", tx);
      setMachineId("");
    } catch (error) {
      console.error("Error registering machine:", error);
      toast.error(`Failed to register machine: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRegistering(false);
    }
  };

  const getMachineData = async () => {
    try {
      const program = getProgram();
      if (!program || !wallet) {
        toast.error("Wallet not connected");
        return;
      }
      
      const[machinePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("agrox"), Buffer.from(machineId)],
        PROGRAM_ID
      );

      console.log("Machine PDA:", machinePda.toBase58());
      
      // Try to fetch machine account data
      try {
        // @ts-expect-error - Bypass TypeScript checks since account structure comes from IDL
        const machineAccount = await program.account.machine.fetch(machinePda);
        console.log("Machine data:", machineAccount);
      } catch (error) {
        console.log("Machine account may not exist yet:", error);
      }
      
    } catch (error) {
      console.error("Error fetching machine data:", error);
      toast.error(`Failed to fetch machine data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const find_cluster_pda = async () => {
    try {
      const program = getProgram();
      if (!program || !wallet) {
        toast.error("Wallet not connected");
        return;
      }

      const[clusterPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("cluster")],
        PROGRAM_ID
      );
      console.log("Cluster PDA:", clusterPda.toBase58());

      // Get raw account data first
      const accountInfo = await connection.getAccountInfo(clusterPda);
      console.log("Account info (raw):", accountInfo);
      
      if (accountInfo) {
        try {
          // First try Anchor deserialization
          console.log("Deserializing cluster account using Anchor");
          // @ts-expect-error - Bypass TypeScript checks since account structure comes from IDL
          const clusterAccount = await program.account.cluster.fetch(clusterPda);
          console.log("Cluster account (Deserialized with Anchor):", clusterAccount);
        } catch {
          console.log("Failed to deserialize using Anchor, trying borsh");
          
          // For debugging: try to decode with borsh
          if (accountInfo?.data) {
            const decodedData = deserializeClusterAccount(accountInfo.data);
            console.log("Cluster account (Deserialized with borsh):", decodedData);
            
            // For debugging: also log raw data
            // console.log("Raw Buffer:", Buffer.from(accountInfo.data));
            // console.log("Discriminator:", Buffer.from(accountInfo.data.slice(0, 8)));
          }
        }
      } else {
        console.log("Cluster account doesn't exist");
      }
      
      console.log("Cluster PDA:", clusterPda.toBase58());
      
    } catch (error) {
      console.error("Error finding cluster state:", error);
      toast.error(`Failed to find cluster state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Function to fetch all machine accounts
  const fetchAllMachines = async () => {
    try {
      setIsLoadingMachines(true);
      const program = getProgram();
      if (!program || !wallet) {
        toast.error("Wallet not connected");
        return;
      }

      // @ts-expect-error - Bypass TypeScript checks since account structure comes from IDL
      const allMachines = await program.account.machine.all();
      console.log("All machines:", allMachines);
      
      // Define the expected structure for the account
      type MachineAccountRaw = {
        owner: PublicKey;
        machineId: string;
        isActive: boolean;
        dataCount: { toNumber: () => number };
        imageCount: { toNumber: () => number };
        rewardsEarned: { toNumber: () => number };
        lastDataTimestamp: { toNumber: () => number };
        lastImageTimestamp: { toNumber: () => number };
        dataUsedCount: { toNumber: () => number };
        authBump: number;
        bump: number;
      };
      
      // Transform data to match our expected format
      const machineAccounts = allMachines.map((item: { account: MachineAccountRaw; publicKey: PublicKey }) => {
        const account = item.account;
        return {
          owner: account.owner,
          machineId: account.machineId,
          isActive: account.isActive,
          dataCount: account.dataCount.toNumber(),
          imageCount: account.imageCount.toNumber(),
          rewardsEarned: account.rewardsEarned.toNumber(),
          lastDataTimestamp: account.lastDataTimestamp.toNumber(),
          lastImageTimestamp: account.lastImageTimestamp.toNumber(),
          dataUsedCount: account.dataUsedCount.toNumber(),
          authBump: account.authBump,
          bump: account.bump,
          publicKey: item.publicKey,
        };
      });
      
      setRegisteredMachines(machineAccounts);
    } catch (error) {
      console.error("Error fetching machines:", error);
      toast.error(`Failed to fetch machines: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingMachines(false);
    }
  };

  const startMachine = async (machineId: string, publicKey: PublicKey) => {
    try {
      // Update processing state
      setIsProcessing(prev => ({ ...prev, [machineId]: true }));
      
      const program = getProgram();
      if (!program || !wallet) {
        toast.error("Wallet not connected");
        return;
      }

      // Call the start_machine instruction
      const tx = await program.methods
        .startMachine()
        .accounts({
          machine: publicKey,
          user: wallet.publicKey,
        })
        .rpc({
          skipPreflight: true,
          commitment: 'confirmed',
          maxRetries: 3
        });
      
      toast.success(`Machine ${machineId} started successfully`);
      console.log("Transaction signature:", tx);
      
      // Refresh the machine list
      fetchAllMachines();
    } catch (error) {
      console.error(`Error starting machine ${machineId}:`, error);
      toast.error(`Failed to start machine: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Clear processing state
      setIsProcessing(prev => ({ ...prev, [machineId]: false }));
    }
  };

  const stopMachine = async (machineId: string, publicKey: PublicKey) => {
    try {
      // Update processing state
      setIsProcessing(prev => ({ ...prev, [machineId]: true }));
      
      const program = getProgram();
      if (!program || !wallet) {
        toast.error("Wallet not connected");
        return;
      }

      // Call the stop_machine instruction
      const tx = await program.methods
        .stopMachine()
        .accounts({
          machine: publicKey,
          user: wallet.publicKey,
        })
        .rpc({
          skipPreflight: true,
          commitment: 'confirmed',
          maxRetries: 3
        });
      
      toast.success(`Machine ${machineId} stopped successfully`);
      console.log("Transaction signature:", tx);
      
      // Refresh the machine list
      fetchAllMachines();
    } catch (error) {
      console.error(`Error stopping machine ${machineId}:`, error);
      toast.error(`Failed to stop machine: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Clear processing state
      setIsProcessing(prev => ({ ...prev, [machineId]: false }));
    }
  };

  // Function to fetch all plants
  const fetchAllPlants = async () => {
    try {
      setIsLoadingPlants(true);
      const program = getProgram();
      if (!program || !wallet) {
        toast.error("Wallet not connected");
        return;
      }

      // @ts-expect-error - Bypass TypeScript checks since account structure comes from IDL
      const allPlants = await program.account.plantData.all();
      console.log("All plants:", allPlants);
      
      // Define the expected structure for the plant account
      type PlantAccountRaw = {
        creator: PublicKey;
        plantName: string;
        dataCount: { toNumber: () => number };
        imageCount: { toNumber: () => number };
        creationTimestamp: { toNumber: () => number };
        lastUpdateTimestamp: { toNumber: () => number };
        bump: number;
      };
      
      // Transform data to match our expected format
      const plantAccounts = allPlants.map((item: { account: PlantAccountRaw; publicKey: PublicKey }) => {
        const account = item.account;
        return {
          creator: account.creator,
          plantName: account.plantName,
          dataCount: account.dataCount.toNumber(),
          imageCount: account.imageCount.toNumber(),
          creationTimestamp: account.creationTimestamp.toNumber(),
          lastUpdateTimestamp: account.lastUpdateTimestamp.toNumber(),
          bump: account.bump,
          publicKey: item.publicKey,
        };
      });
      
      setPlants(plantAccounts);
    } catch (error) {
      console.error("Error fetching plants:", error);
      toast.error(`Failed to fetch plants: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingPlants(false);
    }
  };

  // Function to create a new plant
  const createPlant = async () => {
    if (!plantName.trim()) {
      toast.error("Plant name is required");
      return;
    }

    // Check if a plant with this name already exists
    if (plants.some(p => p.plantName === plantName)) {
      toast.error(`A plant named "${plantName}" already exists`);
      return;
    }

    try {
      setIsCreatingPlant(true);
      const program = getProgram();
      
      if (!program || !wallet?.publicKey) {
        toast.error("Wallet not connected");
        return;
      }

      // Find the PDAs
      const [clusterPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("cluster")],
        PROGRAM_ID
      );

      const [plantPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("agrox"), Buffer.from(plantName)],
        PROGRAM_ID
      );

      console.log("Creating plant with name:", plantName);
      console.log("Plant PDA:", plantPda.toString());
      console.log("Cluster PDA:", clusterPda.toString());
      console.log("User wallet:", wallet.publicKey.toString());
      
      // Create instruction with explicit program ID to ensure it's correctly identified
      const ix = await program.methods
        .createPlant(plantName)
        .accounts({
          cluster: clusterPda,
          plant: plantPda,
          user: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
        
      // Create transaction manually for better control
      const latestBlockhash = await connection.getLatestBlockhash('confirmed');
      const transaction = new Transaction({
        feePayer: wallet.publicKey,
        ...latestBlockhash,
      });
      
      transaction.add(ix);
      
      // Sign and send the transaction
      if (!program.provider) {
        throw new Error("Provider is undefined");
      }
      
      const provider = program.provider as anchor.AnchorProvider;
      const signature = await provider.sendAndConfirm(transaction, [], {
        skipPreflight: true,
        commitment: 'confirmed',
        maxRetries: 3,
      });
      
      toast.success(`Plant ${plantName} created successfully`);
      console.log("Transaction signature:", signature);
      setPlantName("");
      setCreatePlantOpen(false);
      
      // Refresh the plant list
      await fetchAllPlants();
    } catch (error) {
      console.error("Error creating plant:", error);
      
      // More detailed error handling
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log("Full error object:", error);
      
      if (errorMessage.includes("AccountDidNotSerialize")) {
        toast.error("Account serialization error. Cluster might not be initialized.");
      } else if (errorMessage.includes("Unknown action")) {
        toast.error("Transaction action error. This could be a duplicate or malformed transaction.");
      } else if (errorMessage.includes("0x1771")) {
        toast.error("Anchor program error: MachineIdAlreadyExists");
      } else if (errorMessage.includes("0x1772")) {
        toast.error("Anchor program error: Unauthorized");
      } else if (errorMessage.includes("0x1773")) {
        toast.error("Anchor program error: MachineNotActive");
      } else if (errorMessage.includes("0x1774")) {
        toast.error("Anchor program error: NoRewardsAvailable");
      } else if (errorMessage.includes("0x1775")) {
        toast.error("Anchor program error: UnregisteredPlant");
      } else if (errorMessage.includes("0x1776")) {
        toast.error("Anchor program error: InvalidDataEntryIndex");
      } else {
        toast.error(`Failed to create plant: ${errorMessage.substring(0, 100)}...`);
      }
    } finally {
      setIsCreatingPlant(false);
    }
};

  // Function to upload data
  const uploadData = async () => {
    if (!selectedMachine || !selectedPlant) {
      toast.error("Please select both a machine and a plant");
      return;
    }

    if (!temperature.trim() || !humidity.trim()) {
      toast.error("Temperature and humidity are required");
      return;
    }

    try {
      setIsUploadingData(true);
      const program = getProgram();
      
      if (!program || !wallet) {
        toast.error("Wallet not connected");
        return;
      }

      // Find the machine and plant from selections
      const machine = registeredMachines.find(m => m.machineId === selectedMachine);
      const plant = plants.find(p => p.plantName === selectedPlant);

      if (!machine || !plant) {
        toast.error("Selected machine or plant not found");
        return;
      }

      // Find the cluster PDA
      const [clusterPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("cluster")],
        PROGRAM_ID
      );

      // Find the data PDA
      const [dataPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("agrox"), machine.publicKey.toBuffer(), plant.publicKey.toBuffer()],
        PROGRAM_ID
      );

      // Find the auth PDA
      const [authPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("machine-auth"), Buffer.from(machine.machineId)],
        PROGRAM_ID
      );

      // Parse temperature and humidity as floats
      const tempValue = parseFloat(temperature);
      const humidityValue = parseFloat(humidity);

      // Call the upload_data instruction
      const tx = await program.methods
        .uploadData(tempValue, humidityValue, imageUrl.trim() ? imageUrl : null)
        .accounts({
          cluster: clusterPda,
          machine: machine.publicKey,
          plant: plant.publicKey,
          data: dataPda,
          authPda: authPda,
          payer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc({
          skipPreflight: true,
          commitment: 'confirmed',
          maxRetries: 3
        });
      
      toast.success(`Data uploaded successfully for ${machine.machineId} and ${plant.plantName}`);
      console.log("Transaction signature:", tx);
      
      // Reset form and close dialog
      setTemperature("25.0");
      setHumidity("60.0");
      setImageUrl("");
      setUploadDataOpen(false);
      
      // Refresh data
      await fetchAllMachines();
      await fetchAllPlants();
    } catch (error) {
      console.error("Error uploading data:", error);
      toast.error(`Failed to upload data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploadingData(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>AgroX Contract Initialization</CardTitle>
          <CardDescription>Initialize the AgroX contract on Solana</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={initializeContract} 
            disabled={isInitializing || !wallet || isInitialized}
          >
            {isInitializing ? "Initializing..." : isInitialized ? "Contract Initialized" : "Initialize Contract"}
          </Button>
        </CardContent>
      </Card>

      {isInitialized && (
        <>
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Register Machine</CardTitle>
              <CardDescription>Register a new IoT machine to the AgroX system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Enter machine ID"
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  disabled={isRegistering || !wallet}
                />
                <Button 
                  onClick={registerMachine} 
                  disabled={isRegistering || !wallet || !machineId.trim()}
                >
                  {isRegistering ? "Registering..." : "Register Machine"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Data Management</h2>
            
            <div className="flex gap-2">
              <Dialog open={createPlantOpen} onOpenChange={setCreatePlantOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">Create Plant</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create a New Plant</DialogTitle>
                    <DialogDescription>
                      Enter a unique name for your plant
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="plant-name" className="text-right">
                        Plant Name
                      </Label>
                      <Input
                        id="plant-name"
                        placeholder="Enter plant name"
                        className="col-span-3"
                        value={plantName}
                        onChange={(e) => setPlantName(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={createPlant}
                      disabled={isCreatingPlant || !plantName.trim()}
                    >
                      {isCreatingPlant ? "Creating..." : "Create Plant"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={uploadDataOpen} onOpenChange={(open) => {
                setUploadDataOpen(open);
                if (open) {
                  // When dialog opens, refresh the machine and plant lists
                  fetchAllMachines();
                  fetchAllPlants();
                  console.log("Dialog opened with machines:", registeredMachines);
                }
              }}>
                <DialogTrigger asChild>
                  <Button>Upload Data</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Upload Sensor Data</DialogTitle>
                    <DialogDescription>
                      Record temperature, humidity, and optional image data for a plant
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="machine" className="text-right">
                        Machine
                      </Label>
                      <div className="col-span-3 space-y-1">
                        {registeredMachines.length === 0 ? (
                          <div className="text-sm text-muted-foreground">No machines available. Please register a machine first.</div>
                        ) : !registeredMachines.some(m => m.isActive) ? (
                          <div className="text-sm text-muted-foreground">No active machines. Please start a machine first.</div>
                        ) : null}
                        <Select
                          value={selectedMachine}
                          onValueChange={setSelectedMachine}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a machine" />
                          </SelectTrigger>
                          <SelectContent>
                            {registeredMachines.map((machine, idx) => (
                              <SelectItem 
                                key={idx} 
                                value={machine.machineId}
                                disabled={!machine.isActive}
                              >
                                {machine.machineId} {!machine.isActive && "(Inactive)"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="plant" className="text-right">
                        Plant
                      </Label>
                      <div className="col-span-3 space-y-1">
                        {plants.length === 0 && (
                          <div className="text-sm text-muted-foreground">No plants available. Please create a plant first.</div>
                        )}
                        <Select
                          value={selectedPlant}
                          onValueChange={setSelectedPlant}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a plant" />
                          </SelectTrigger>
                          <SelectContent>
                            {plants.map((plant, idx) => (
                              <SelectItem key={idx} value={plant.plantName}>
                                {plant.plantName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="temperature" className="text-right">
                        Temperature
                      </Label>
                      <Input
                        id="temperature"
                        placeholder="Enter temperature in °C"
                        className="col-span-3"
                        type="number"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="humidity" className="text-right">
                        Humidity
                      </Label>
                      <Input
                        id="humidity"
                        placeholder="Enter humidity in %"
                        className="col-span-3"
                        type="number"
                        step="0.1"
                        value={humidity}
                        onChange={(e) => setHumidity(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="image-url" className="text-right">
                        Image URL
                      </Label>
                      <Input
                        id="image-url"
                        placeholder="Optional image URL"
                        className="col-span-3"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={uploadData}
                      disabled={
                        isUploadingData ||
                        !selectedMachine ||
                        !selectedPlant ||
                        !temperature ||
                        !humidity ||
                        registeredMachines.length === 0 ||
                        plants.length === 0
                      }
                    >
                      {isUploadingData ? "Uploading..." : "Upload Data"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Button variant="outline" onClick={fetchAllMachines} disabled={isLoadingMachines}>
                {isLoadingMachines ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Registered Machines</CardTitle>
                <CardDescription>All machines registered to the AgroX system</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {registeredMachines.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Machine ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registeredMachines.map((machine, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{machine.machineId}</TableCell>
                          <TableCell>
                            <Badge variant={machine.isActive ? "default" : "destructive"}>
                              {machine.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>{machine.dataCount} entries</TableCell>
                          <TableCell>
                            {machine.isActive ? (
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => stopMachine(machine.machineId, machine.publicKey)}
                                disabled={isProcessing[machine.machineId]}
                              >
                                {isProcessing[machine.machineId] ? "..." : "Stop"}
                              </Button>
                            ) : (
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => startMachine(machine.machineId, machine.publicKey)}
                                disabled={isProcessing[machine.machineId]}
                              >
                                {isProcessing[machine.machineId] ? "..." : "Start"}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4">
                    {isLoadingMachines ? "Loading machines..." : "No machines registered yet"}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plant Registry</CardTitle>
                <CardDescription>Plants available for data collection</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {plants.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plant Name</TableHead>
                        <TableHead>Data Count</TableHead>
                        <TableHead>Last Update</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plants.map((plant, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{plant.plantName}</TableCell>
                          <TableCell>{plant.dataCount} entries</TableCell>
                          <TableCell>
                            {plant.lastUpdateTimestamp > 0 
                              ? new Date(plant.lastUpdateTimestamp * 1000).toLocaleString() 
                              : "Never"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4">
                    {isLoadingPlants ? "Loading plants..." : "No plants registered yet"}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" size="sm" onClick={fetchAllPlants}>
                  Refresh Plants
                </Button>
              </CardFooter>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default TestPage;
