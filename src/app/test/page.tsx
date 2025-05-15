'use client';
import { useEffect, useState } from 'react';
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import idl from '@/contract/idl.json';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PROGRAM_ID = new PublicKey("CWDF2qKJp68SfMV9iqo8Ao1SiEWV1a3CXLLQbmaMPouo");
const AGROX_PDA_SEED = "";

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

  const getProgram = () => {
    if (!wallet) return null;
    
    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      { commitment: 'processed' }
    );
    
    const program = new Program(idl, provider);
    return program;
  };

  useEffect(() => {
    checkIfInitialized();
    getMachineData();
    find_cluster_pda();
    if (wallet) {
      fetchAllMachines();
    }
  }, [wallet, connection]);

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
        const cluster = await connection.getAccountInfo(clusterPda);
        setIsInitialized(!!cluster);
      } catch {
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
      const [systemStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from(AGROX_PDA_SEED)],
        PROGRAM_ID
      );

      // Call the initialize instruction
      const tx = await program.methods
        .initialize()
        .accounts({
          systemState: systemStatePda,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      toast.success("Contract initialized successfully");
      console.log("Transaction signature:", tx);
      
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
      const tx = await program.methods
        .registerMachine(machineId)
        .accounts({
          cluster: clusterPda,
          machine: machinePda,
          user: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
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

      // Get raw account data first
      const accountInfo = await connection.getAccountInfo(clusterPda);
      
      if (accountInfo) {
        try {
          // @ts-expect-error - Bypass TypeScript checks since account structure comes from IDL
          const clusterAccount = await program.account.cluster.fetch(clusterPda);
          console.log("Cluster account (Deserialized):", clusterAccount);
        } catch {
          console.log("Failed to deserialize using Anchor, raw data:", accountInfo.data);
          
          // For debugging: try to manually decode account data
          if (accountInfo?.data) {
            // Log the raw buffer for analysis
            console.log("Raw Buffer:", Buffer.from(accountInfo.data));
            
            // Log first 8 bytes (discriminator)
            console.log("Discriminator:", Buffer.from(accountInfo.data.slice(0, 8)));
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
        .rpc();
      
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
        .rpc();
      
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
      )}

      {/* Add the machines list card */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Registered Machines</CardTitle>
              <CardDescription>All machines registered to the AgroX system</CardDescription>
            </div>
            <Button 
              onClick={fetchAllMachines} 
              disabled={isLoadingMachines || !wallet}
            >
              {isLoadingMachines ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {registeredMachines.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Machine ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Count</TableHead>
                  <TableHead>Image Count</TableHead>
                  <TableHead>Rewards</TableHead>
                  <TableHead>Last Update</TableHead>
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
                    <TableCell>{machine.dataCount}</TableCell>
                    <TableCell>{machine.imageCount}</TableCell>
                    <TableCell>{machine.rewardsEarned}</TableCell>
                    <TableCell>
                      {machine.lastDataTimestamp > 0 
                        ? new Date(machine.lastDataTimestamp * 1000).toLocaleString() 
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      {machine.isActive ? (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => stopMachine(machine.machineId, machine.publicKey)}
                          disabled={isProcessing[machine.machineId]}
                        >
                          {isProcessing[machine.machineId] ? "Processing..." : "Stop"}
                        </Button>
                      ) : (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => startMachine(machine.machineId, machine.publicKey)}
                          disabled={isProcessing[machine.machineId]}
                        >
                          {isProcessing[machine.machineId] ? "Processing..." : "Start"}
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
    </div>
  );
};

export default TestPage;
