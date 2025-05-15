"use client";

import React, { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import idl from '@/contract/idl.json';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';

// Define the program ID from the contract
const programId = new PublicKey('AAPzpAmDnGAhd2RvDUCMisVjJ2ydTKeNfZXmoz5e4pp9');
const AGROX_PDA_SEED = Buffer.from('agrox');

// Define types
interface SystemState {
  publicKey: PublicKey;
  authority: PublicKey;
  machineCount: number;
  totalDataUploads: number;
  dataRequestCount: number;
  plantCount: number;
  machines: [string, PublicKey][];
  plants: [string, PublicKey][];
}

interface MachineAccount {
  machineId: string;
  owner: PublicKey;
  isActive: boolean;
  dataCount: number;
  imageCount: number;
  rewardsEarned: number;
  lastDataTimestamp: number;
  lastImageTimestamp: number;
  dataUsedCount: number;
  authBump: number;
}

interface DataEntry {
  publicKey: PublicKey;
  account: {
    temperature: number;
    humidity: number;
    timestamp: number;
    machine: PublicKey;
    plant: PublicKey;
    imageUrl: string | null;
    usedCount: number;
  };
}

const Test = () => {
  const { publicKey, signTransaction, connected } = useWallet();
  const [systemState, setSystemState] = useState<SystemState | null>(null);
  const [machineId, setMachineId] = useState('');
  const [plantName, setPlantName] = useState('');
  const [temperature, setTemperature] = useState('25.0');
  const [humidity, setHumidity] = useState('60.0');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<string | null>(null);
  const [selectedData, setSelectedData] = useState<string | null>(null);
  const [machines, setMachines] = useState<[string, PublicKey][]>([]);
  const [plants, setPlants] = useState<[string, PublicKey][]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [dataEntries, setDataEntries] = useState<DataEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const getProvider = useCallback(() => {
    if (!publicKey || !signTransaction) {
      return null;
    }
    
    // Create a connection to the Solana devnet
    const connection = new Connection(
      process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed'
    );
    
    // Create the provider
    const provider = new anchor.AnchorProvider(
      connection, 
      { publicKey, signTransaction } as anchor.Wallet, 
      { commitment: 'confirmed' }
    );
    
    return provider;
  }, [publicKey, signTransaction]);

  const getProgram = useCallback(() => {
    const provider = getProvider();
    if (!provider) return null;
    
    // Create the program interface using the IDL
    const program = new anchor.Program(idl as anchor.Idl, provider);
    return program;
  }, [getProvider]);
  
  const fetchSystemState = useCallback(async () => {
    try {
      const program = getProgram();
      if (!program) return;
      
      // Fetch all system state accounts
      // @ts-expect-error - Suppressing TypeScript error for account access
      const systemStates = await program.account.system_state.all();
      if (systemStates && systemStates.length > 0) {
        setSystemState({
          publicKey: systemStates[0].publicKey,
          ...systemStates[0].account
        });
        
        // Extract machines and plants
        const machinesList = systemStates[0].account.machines || [];
        const plantsList = systemStates[0].account.plants || [];
        
        setMachines(machinesList);
        setPlants(plantsList);
      }
    } catch (error) {
      console.error("Error fetching system state:", error);
      toast.error("Failed to fetch system state");
    }
  }, [getProgram]);

  useEffect(() => {
    if (connected) {
      fetchSystemState();
    }
  }, [connected, fetchSystemState]);

  // Delegate function
  const delegateAccount = async () => {
    try {
      setLoading(true);
      const program = getProgram();
      if (!program || !publicKey) return;
      
      // Find the PDA for the delegation
      const [pda] = PublicKey.findProgramAddressSync(
        [AGROX_PDA_SEED],
        programId
      );
      
      // Call the delegate function
      await program.methods
        .delegate()
        .accounts({
          payer: publicKey,
          pda: pda,
        })
        .rpc();
      
      toast.success("Account delegated successfully");
    } catch (error) {
      console.error("Error delegating account:", error);
      toast.error("Failed to delegate account");
    } finally {
      setLoading(false);
    }
  };

  // Undelegate function
  const undelegateAccount = async () => {
    try {
      setLoading(true);
      const program = getProgram();
      if (!program || !publicKey) return;
      
      // Find the PDA for the undelegation
      const [pda] = PublicKey.findProgramAddressSync(
        [AGROX_PDA_SEED],
        programId
      );
      
      // Call the undelegate function
      await program.methods
        .undelegate()
        .accounts({
          payer: publicKey,
          pda: pda,
          // These are placeholder values that would need to be replaced with actual addresses
          magicContext: new PublicKey("11111111111111111111111111111111"),
          magicProgram: new PublicKey("11111111111111111111111111111111"),
        })
        .rpc();
      
      toast.success("Account undelegated successfully");
    } catch (error) {
      console.error("Error undelegating account:", error);
      toast.error("Failed to undelegate account");
    } finally {
      setLoading(false);
    }
  };

  // Register Machine function
  const registerMachine = async () => {
    try {
      setLoading(true);
      if (!machineId.trim()) {
        toast.error("Machine ID is required");
        return;
      }
      
      const program = getProgram();
      if (!program || !publicKey || !systemState) return;
      
      // Create a new account for the machine
      const machineAccount = anchor.web3.Keypair.generate();
      
      // Call the register_machine function
      await program.methods
        .registerMachine(machineId)
        .accounts({
          systemState: systemState.publicKey,
          machine: machineAccount.publicKey,
          user: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([machineAccount])
        .rpc();
      
      toast.success(`Machine ${machineId} registered successfully`);
      
      // Refresh data
      fetchSystemState();
      setMachineId('');
    } catch (error) {
      console.error("Error registering machine:", error);
      toast.error("Failed to register machine");
    } finally {
      setLoading(false);
    }
  };

  // Create Plant function
  const createPlant = async () => {
    try {
      setLoading(true);
      if (!plantName.trim()) {
        toast.error("Plant name is required");
        return;
      }
      
      const program = getProgram();
      if (!program || !publicKey || !systemState) return;
      
      // Create a new account for the plant
      const plantAccount = anchor.web3.Keypair.generate();
      
      // Call the create_plant function
      await program.methods
        .createPlant(plantName)
        .accounts({
          systemState: systemState.publicKey,
          plant: plantAccount.publicKey,
          user: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([plantAccount])
        .rpc();
      
      toast.success(`Plant ${plantName} created successfully`);
      
      // Refresh data
      fetchSystemState();
      setPlantName('');
    } catch (error) {
      console.error("Error creating plant:", error);
      toast.error("Failed to create plant");
    } finally {
      setLoading(false);
    }
  };

  // Start Machine function
  const startMachine = async () => {
    try {
      setLoading(true);
      if (!selectedMachine) {
        toast.error("Please select a machine first");
        return;
      }
      
      const program = getProgram();
      if (!program || !publicKey) return;
      
      // Call the start_machine function
      await program.methods
        .startMachine()
        .accounts({
          machine: new PublicKey(selectedMachine),
          user: publicKey,
        })
        .rpc();
      
      toast.success("Machine started successfully");
      
      // Refresh data
      fetchSystemState();
    } catch (error) {
      console.error("Error starting machine:", error);
      toast.error("Failed to start machine");
    } finally {
      setLoading(false);
    }
  };

  // Stop Machine function
  const stopMachine = async () => {
    try {
      setLoading(true);
      if (!selectedMachine) {
        toast.error("Please select a machine first");
        return;
      }
      
      const program = getProgram();
      if (!program || !publicKey) return;
      
      // Call the stop_machine function
      await program.methods
        .stopMachine()
        .accounts({
          machine: new PublicKey(selectedMachine),
          user: publicKey,
        })
        .rpc();
      
      toast.success("Machine stopped successfully");
      
      // Refresh data
      fetchSystemState();
    } catch (error) {
      console.error("Error stopping machine:", error);
      toast.error("Failed to stop machine");
    } finally {
      setLoading(false);
    }
  };

  // Upload Data function
  const uploadData = async () => {
    try {
      setLoading(true);
      if (!selectedMachine || !selectedPlant) {
        toast.error("Please select both machine and plant");
        return;
      }
      
      const program = getProgram();
      if (!program || !publicKey || !systemState) return;
      
      // Create a new account for the data
      const dataAccount = anchor.web3.Keypair.generate();
      
      // Get the machine account to get the auth_bump
      // @ts-expect-error - Suppressing TypeScript error for account access
      const machineAccount = await program.account.machine.fetch(new PublicKey(selectedMachine)) as MachineAccount;
      
      // Find the machine auth PDA
      const [authPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("machine-auth"),
          Buffer.from(machineAccount.machineId)
        ],
        programId
      );
      
      // Call the upload_data function
      await program.methods
        .uploadData(
          parseFloat(temperature),
          parseFloat(humidity),
          imageUrl ? imageUrl : null
        )
        .accounts({
          systemState: systemState.publicKey,
          machine: new PublicKey(selectedMachine),
          plant: new PublicKey(selectedPlant),
          data: dataAccount.publicKey,
          authPda: authPda,
          payer: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([dataAccount])
        .rpc();
      
      toast.success("Data uploaded successfully");
      
      // Refresh data
      fetchSystemState();
      setTemperature('25.0');
      setHumidity('60.0');
      setImageUrl('');
    } catch (error) {
      console.error("Error uploading data:", error);
      toast.error("Failed to upload data");
    } finally {
      setLoading(false);
    }
  };

  // Use Data function
  const useData = async () => {
    try {
      setLoading(true);
      if (!selectedData) {
        toast.error("Please select data to use");
        return;
      }
      
      const program = getProgram();
      if (!program || !publicKey || !selectedMachine || !systemState) return;
      
      // Call the use_data function
      await program.methods
        .useData()
        .accounts({
          systemState: systemState.publicKey,
          machine: new PublicKey(selectedMachine),
          data: new PublicKey(selectedData),
          user: publicKey,
        })
        .rpc();
      
      toast.success("Data used successfully");
      
      // Refresh data
      fetchSystemState();
    } catch (error) {
      console.error("Error using data:", error);
      toast.error("Failed to use data");
    } finally {
      setLoading(false);
    }
  };

  // Claim Rewards function
  const claimRewards = async () => {
    try {
      setLoading(true);
      if (!selectedMachine) {
        toast.error("Please select a machine");
        return;
      }
      
      const program = getProgram();
      if (!program || !publicKey) return;
      
      // Call the claim_rewards function
      await program.methods
        .claimRewards()
        .accounts({
          machine: new PublicKey(selectedMachine),
          user: publicKey,
        })
        .rpc();
      
      toast.success("Rewards claimed successfully");
      
      // Refresh data
      fetchSystemState();
    } catch (error) {
      console.error("Error claiming rewards:", error);
      toast.error("Failed to claim rewards");
    } finally {
      setLoading(false);
    }
  };

  // Generate Machine Auth function
  const generateMachineAuth = async () => {
    try {
      setLoading(true);
      if (!selectedMachine) {
        toast.error("Please select a machine");
        return;
      }
      
      const program = getProgram();
      if (!program || !publicKey) return;
      
      // Get the machine account to get the machine ID
      // @ts-expect-error - Suppressing TypeScript error for account access
      const machineAccount = await program.account.machine.fetch(new PublicKey(selectedMachine)) as MachineAccount;
      
      // Find the machine auth PDA
      const [authPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("machine-auth"),
          Buffer.from(machineAccount.machineId)
        ],
        programId
      );
      
      // Call the generate_machine_auth function
      await program.methods
        .generateMachineAuth(machineAccount.machineId)
        .accounts({
          machine: new PublicKey(selectedMachine),
          user: publicKey,
          authPda: authPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      toast.success("Machine auth generated successfully");
      
      // Refresh data
      fetchSystemState();
    } catch (error) {
      console.error("Error generating machine auth:", error);
      toast.error("Failed to generate machine auth");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">AgroX Contract Test Panel</h1>
      
      {!connected && (
        <div className="bg-yellow-100 p-4 rounded-lg mb-6">
          <p className="text-yellow-700">Please connect your wallet to use the test panel.</p>
        </div>
      )}
      
      <Tabs defaultValue="machines" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="machines">Machines</TabsTrigger>
          <TabsTrigger value="plants">Plants</TabsTrigger>
          <TabsTrigger value="data">Data Operations</TabsTrigger>
          <TabsTrigger value="auth">Auth & Delegation</TabsTrigger>
        </TabsList>
        
        {/* Machines Tab */}
        <TabsContent value="machines">
          <Card>
            <CardHeader>
              <CardTitle>Machine Operations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label htmlFor="machineId">Register New Machine</Label>
                <div className="flex gap-2">
                  <Input 
                    id="machineId" 
                    placeholder="Machine ID" 
                    value={machineId} 
                    onChange={(e) => setMachineId(e.target.value)} 
                    disabled={!connected || loading}
                  />
                  <Button onClick={registerMachine} disabled={!connected || loading}>
                    Register
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <Label>Control Machine</Label>
                <div className="flex gap-2">
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={selectedMachine || ""}
                    onChange={(e) => setSelectedMachine(e.target.value)}
                    disabled={!connected || loading}
                  >
                    <option value="">Select Machine</option>
                    {machines.map(([id, pubkey], index) => (
                      <option key={index} value={pubkey.toString()}>
                        {id}
                      </option>
                    ))}
                  </select>
                  <Button onClick={startMachine} disabled={!connected || !selectedMachine || loading}>
                    Start
                  </Button>
                  <Button onClick={stopMachine} disabled={!connected || !selectedMachine || loading}>
                    Stop
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <Label>Claim Rewards</Label>
                <Button 
                  onClick={claimRewards} 
                  disabled={!connected || !selectedMachine || loading}
                  className="w-full"
                >
                  Claim Rewards for Selected Machine
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Plants Tab */}
        <TabsContent value="plants">
          <Card>
            <CardHeader>
              <CardTitle>Plant Operations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label htmlFor="plantName">Create New Plant</Label>
                <div className="flex gap-2">
                  <Input 
                    id="plantName" 
                    placeholder="Plant Name" 
                    value={plantName} 
                    onChange={(e) => setPlantName(e.target.value)} 
                    disabled={!connected || loading}
                  />
                  <Button onClick={createPlant} disabled={!connected || loading}>
                    Create
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <Label>Existing Plants</Label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={selectedPlant || ""}
                  onChange={(e) => setSelectedPlant(e.target.value)}
                  disabled={!connected || loading}
                >
                  <option value="">Select Plant</option>
                  {plants.map(([name, pubkey], index) => (
                    <option key={index} value={pubkey.toString()}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Data Operations Tab */}
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data Operations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Upload Data</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="temp">Temperature (°C)</Label>
                    <Input 
                      id="temp" 
                      type="number" 
                      step="0.1"
                      placeholder="Temperature" 
                      value={temperature} 
                      onChange={(e) => setTemperature(e.target.value)} 
                      disabled={!connected || loading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="humidity">Humidity (%)</Label>
                    <Input 
                      id="humidity" 
                      type="number"
                      step="0.1"
                      placeholder="Humidity" 
                      value={humidity} 
                      onChange={(e) => setHumidity(e.target.value)} 
                      disabled={!connected || loading}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                  <Input 
                    id="imageUrl" 
                    placeholder="Image URL" 
                    value={imageUrl} 
                    onChange={(e) => setImageUrl(e.target.value)} 
                    disabled={!connected || loading}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={uploadData} 
                    disabled={!connected || !selectedMachine || !selectedPlant || loading}
                    className="w-full"
                  >
                    Upload Data
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <Label>Use Data</Label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={selectedData || ""}
                  onChange={(e) => setSelectedData(e.target.value)}
                  disabled={!connected || loading}
                >
                  <option value="">Select Data Entry</option>
                  {dataEntries.map((data, index) => (
                    <option key={index} value={data.publicKey.toString()}>
                      Data #{index + 1} - Temp: {data.account.temperature}°C, Humidity: {data.account.humidity}%
                    </option>
                  ))}
                </select>
                <Button 
                  onClick={useData} 
                  disabled={!connected || !selectedData || loading}
                  className="w-full"
                >
                  Use Selected Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Auth & Delegation Tab */}
        <TabsContent value="auth">
          <Card>
            <CardHeader>
              <CardTitle>Authentication & Delegation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Machine Authentication</Label>
                <Button 
                  onClick={generateMachineAuth} 
                  disabled={!connected || !selectedMachine || loading}
                  className="w-full"
                >
                  Generate Machine Auth
                </Button>
              </div>
              
              <div className="space-y-4">
                <Label>Account Delegation</Label>
                <div className="flex gap-2">
                  <Button 
                    onClick={delegateAccount} 
                    disabled={!connected || loading}
                    className="w-full"
                  >
                    Delegate
                  </Button>
                  <Button 
                    onClick={undelegateAccount} 
                    disabled={!connected || loading}
                    className="w-full"
                  >
                    Undelegate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Test
