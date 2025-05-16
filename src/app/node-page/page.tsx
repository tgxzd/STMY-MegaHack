'use client';

import { useState, useEffect } from 'react';
import AddNodeForm from '@/components/AddNodeForm';
import { Node } from '@/data/nodes';
import Link from 'next/link';
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import idl from '@/contract/idl.json';
import { toast } from "sonner";

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

export default function NodePage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [registeredMachines, setRegisteredMachines] = useState<MachineAccount[]>([]);
  const [isLoadingMachines, setIsLoadingMachines] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isProcessing, setIsProcessing] = useState<{[key: string]: boolean}>({});

  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  useEffect(() => {
    if (wallet) {
      fetchAllMachines();
    } else {
      // If not connected, show empty state
      setNodes([]);
    }
  }, [wallet, connection]);

  const getProgram = () => {
    if (!wallet) return null;
    
    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      { commitment: 'processed' }
    );
    
    const program = new Program(idl as anchor.Idl, provider);
    return program;
  };

  const fetchAllMachines = async () => {
    try {
      setIsLoadingMachines(true);
      const program = getProgram();
      if (!program || !wallet) {
        console.log("Wallet not connected");
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
      
      // Create Node objects from machine accounts
      const machineNodes = machineAccounts.map((machine: MachineAccount) => ({
        nodeID: machine.machineId,
        nodeName: machine.machineId,
        status: machine.isActive ? 'active' : 'inactive',
        uptime: Math.floor((Date.now() / 1000 - machine.lastDataTimestamp) / 3600), // Calculate real uptime in hours
        usage: machine.dataCount + machine.imageCount,
        reward: machine.rewardsEarned,
        activationDate: machine.lastDataTimestamp > 0 
          ? new Date(machine.lastDataTimestamp * 1000).toISOString().split('T')[0] 
          : 'Not activated',
        totalDataTransmitted: `${machine.dataCount * 5}MB`
      }));
      
      // Replace mock data with real data from blockchain
      setNodes(machineNodes);
      setRegisteredMachines(machineAccounts);
    } catch (error) {
      console.error("Error fetching machines:", error);
      toast?.error?.(`Failed to fetch machines: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingMachines(false);
    }
  };

  const handleAddNode = async (nodeName: string) => {
    try {
      setIsRegistering(true);
      
      const program = getProgram();
      
      if (!program || !wallet) {
        toast?.error?.("Wallet not connected");
        return;
      }

      // Find the PDAs
      const [clusterPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("cluster")],
        PROGRAM_ID
      );

      // According to IDL, machine PDA uses "agrox" prefix, not "machine"
      const [machinePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("agrox"), Buffer.from(nodeName)],
        PROGRAM_ID
      );

      console.log("Machine PDA being used:", machinePda.toBase58());
      console.log("Registering machine with ID:", nodeName);

      // Call the register_machine instruction
      const tx = await program.methods
        .registerMachine(nodeName)
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
      
      toast?.success?.(`Machine ${nodeName} registered successfully`);
      console.log("Transaction signature:", tx);
      
      // Add the new node to the UI immediately
      const newNode: Node = {
        nodeID: nodeName,
        nodeName: nodeName,
        status: 'active',
        uptime: 0,
        usage: 0,
        reward: 0,
        activationDate: new Date().toISOString().split('T')[0],
        totalDataTransmitted: "0MB"
      };
      
      setNodes([...nodes, newNode]);
      
      // Refresh the machines list
      await fetchAllMachines();
    } catch (error) {
      console.error("Error registering machine:", error);
      toast?.error?.(`Failed to register machine: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleStartMachine = async (nodeId: string) => {
    try {
      setIsProcessing({...isProcessing, [nodeId]: true});
      
      const program = getProgram();
      if (!program || !wallet) {
        toast?.error?.("Wallet not connected");
        return;
      }

      // Find the machine account
      const machineAccount = registeredMachines.find(m => m.machineId === nodeId);
      if (!machineAccount) {
        toast?.error?.(`Machine ${nodeId} not found`);
        return;
      }

      // Call the start_machine instruction
      const tx = await program.methods
        .startMachine()
        .accounts({
          machine: machineAccount.publicKey,
          user: wallet.publicKey,
        })
        .rpc();
      
      toast?.success?.(`Machine ${nodeId} started successfully`);
      console.log("Transaction signature:", tx);
      
      // Update machine status in UI
      setNodes(currentNodes => 
        currentNodes.map(node => 
          node.nodeID === nodeId 
            ? {...node, status: 'active'} 
            : node
        )
      );
      
      // Refresh machines list
      await fetchAllMachines();
    } catch (error) {
      console.error("Error starting machine:", error);
      toast?.error?.(`Failed to start machine: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing({...isProcessing, [nodeId]: false});
    }
  };

  const handleStopMachine = async (nodeId: string) => {
    try {
      setIsProcessing({...isProcessing, [nodeId]: true});
      
      const program = getProgram();
      if (!program || !wallet) {
        toast?.error?.("Wallet not connected");
        return;
      }

      // Find the machine account
      const machineAccount = registeredMachines.find(m => m.machineId === nodeId);
      if (!machineAccount) {
        toast?.error?.(`Machine ${nodeId} not found`);
        return;
      }

      // Call the stop_machine instruction
      const tx = await program.methods
        .stopMachine()
        .accounts({
          machine: machineAccount.publicKey,
          user: wallet.publicKey,
        })
        .rpc();
      
      toast?.success?.(`Machine ${nodeId} stopped successfully`);
      console.log("Transaction signature:", tx);
      
      // Update machine status in UI
      setNodes(currentNodes => 
        currentNodes.map(node => 
          node.nodeID === nodeId 
            ? {...node, status: 'inactive'} 
            : node
        )
      );
      
      // Refresh machines list
      await fetchAllMachines();
    } catch (error) {
      console.error("Error stopping machine:", error);
      toast?.error?.(`Failed to stop machine: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing({...isProcessing, [nodeId]: false});
    }
  };

  const handleClaimRewards = async (nodeId: string) => {
    try {
      setIsProcessing({...isProcessing, [nodeId]: true});
      
      const program = getProgram();
      if (!program || !wallet) {
        toast?.error?.("Wallet not connected");
        return;
      }

      // Find the machine account
      const machineAccount = registeredMachines.find(m => m.machineId === nodeId);
      if (!machineAccount) {
        toast?.error?.(`Machine ${nodeId} not found`);
        return;
      }

      // Call the claim_rewards instruction
      const tx = await program.methods
        .claimRewards()
        .accounts({
          machine: machineAccount.publicKey,
          user: wallet.publicKey,
        })
        .rpc();
      
      toast?.success?.(`Rewards claimed successfully for machine ${nodeId}`);
      console.log("Transaction signature:", tx);
      
      // Update rewards in UI
      setNodes(currentNodes => 
        currentNodes.map(node => 
          node.nodeID === nodeId 
            ? {...node, reward: 0} 
            : node
        )
      );
      
      // Refresh machines list
      await fetchAllMachines();
    } catch (error) {
      console.error("Error claiming rewards:", error);
      toast?.error?.(`Failed to claim rewards: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing({...isProcessing, [nodeId]: false});
    }
  };

  const simulateDataUpload = async (nodeId: string) => {
    try {
      setIsProcessing({...isProcessing, [nodeId]: true});
      
      const program = getProgram();
      if (!program || !wallet) {
        toast?.error?.("Wallet not connected");
        return;
      }

      // Find the machine account
      const machineAccount = registeredMachines.find(m => m.machineId === nodeId);
      if (!machineAccount) {
        toast?.error?.(`Machine ${nodeId} not found`);
        return;
      }
      
      // Find a random plant to upload data to
      // In a real scenario, you would select a specific plant
      // @ts-expect-error - Handling dynamic account type from IDL
      const allPlants = await program.account.plantData.all();
      if (allPlants.length === 0) {
        toast?.error?.("No plants available for data upload");
        return;
      }
      
      const randomPlant = allPlants[Math.floor(Math.random() * allPlants.length)];
      
      // Generate random temperature and humidity data
      const temperature = Math.random() * 30 + 10; // 10-40°C
      const humidity = Math.random() * 60 + 30; // 30-90%
      
      // Create a new data account
      const dataAccount = anchor.web3.Keypair.generate();
      
      // Find the machine auth PDA
      const [authPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("machine-auth"), Buffer.from(nodeId)],
        PROGRAM_ID
      );
      
      // Find the cluster PDA
      const [clusterPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("cluster")],
        PROGRAM_ID
      );
      
      // Call the upload_data instruction
      const tx = await program.methods
        .uploadData(temperature, humidity, null)
        .accounts({
          cluster: clusterPda,
          machine: machineAccount.publicKey,
          plant: randomPlant.publicKey,
          data: dataAccount.publicKey,
          authPda: authPda,
          payer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([dataAccount])
        .rpc();
      
      toast?.success?.(`Sensor data uploaded from machine ${nodeId}`);
      console.log("Transaction signature:", tx);
      
      // Refresh the machines list to update the data counts
      await fetchAllMachines();
    } catch (error) {
      console.error("Error uploading data:", error);
      toast?.error?.(`Failed to upload data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing({...isProcessing, [nodeId]: false});
    }
  };

  return (
    <main className="min-h-screen pt-16 md:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8 mt-25">
          <h1 className="text-2xl font-bold text-white">My Nodes</h1>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md"
            disabled={isRegistering || !wallet}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            {isRegistering ? 'Adding...' : 'Add Node'}
          </button>
        </div>
        
        {!wallet && (
          <div className="bg-black/80 backdrop-blur-md rounded-xl border border-white/10 p-8 text-center mb-6">
            <p className="text-white/70 mb-4">Connect your wallet to view and manage your nodes</p>
          </div>
        )}
        
        {/* Node table */}
        <div className="bg-black/80 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-xl">
          {/* Table header */}
          <div className="grid grid-cols-7 bg-black/90 px-6 py-4 border-b border-white/10">
            <div className="font-medium text-white/90 text-sm">Node Name</div>
            <div className="font-medium text-white/90 text-sm text-center">Status</div>
            <div className="font-medium text-white/90 text-sm text-center">Last Active</div>
            <div className="font-medium text-white/90 text-sm text-center">Data Points</div>
            <div className="font-medium text-white/90 text-sm text-center">Images</div>
            <div className="font-medium text-white/90 text-sm text-center">Rewards</div>
            <div className="font-medium text-white/90 text-sm text-center">Actions</div>
          </div>
          
          {/* Table body */}
          <div className="divide-y divide-white/5">
            {isLoadingMachines ? (
              <div className="px-6 py-12 text-center">
                <p className="text-white/50">Loading nodes...</p>
              </div>
            ) : nodes.map((node) => (
              <div 
                key={node.nodeID}
                className="grid grid-cols-7 px-6 py-4 hover:bg-black/50 transition-colors"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-white">{node.nodeName}</span>
                  <span className="text-xs text-white/50">ID: {node.nodeID}</span>
                </div>
                
                <div className="flex justify-center items-center">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    node.status === 'connected' || node.status === 'active'
                      ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400' 
                      : 'bg-red-500/30 text-red-300 border border-red-400'
                  }`}>
                    <span className={`w-2 h-2 rounded-full mr-1.5 ${
                      node.status === 'connected' || node.status === 'active' ? 'bg-emerald-300' : 'bg-red-300'
                    }`}></span>
                    {node.status === 'connected' ? 'active' : 
                     node.status === 'disconnected' ? 'inactive' : 
                     node.status}
                  </span>
                </div>
                
                <div className="text-center flex flex-col justify-center items-center">
                  <span className="text-white font-medium">{node.activationDate}</span>
                </div>
                
                <div className="flex items-center justify-center">
                  <span className="text-white font-medium">
                    {registeredMachines.find(m => m.machineId === node.nodeID)?.dataCount || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-center">
                  <span className="text-white font-medium">
                    {registeredMachines.find(m => m.machineId === node.nodeID)?.imageCount || 0}
                  </span>
                </div>
                
                <div className="text-center flex items-center justify-center">
                  <span className="text-white font-medium">{node.reward}</span>
                  <span className="text-white/50 text-sm ml-1">Pts</span>
                </div>
                
                <div className="flex items-center justify-center space-x-2">
                  <Link 
                    href={`/node-page/${node.nodeID}`}
                    className="p-1.5 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30 hover:bg-blue-500/30 transition-all"
                    title="View Details"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </Link>
                  
                  {node.status !== 'active' ? (
                    <button
                      onClick={() => handleStartMachine(node.nodeID)}
                      disabled={isProcessing[node.nodeID]}
                      className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30 hover:bg-emerald-500/30 transition-all"
                      title="Start Node"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStopMachine(node.nodeID)}
                      disabled={isProcessing[node.nodeID]}
                      className="p-1.5 bg-red-500/20 text-red-400 rounded border border-red-500/30 hover:bg-red-500/30 transition-all"
                      title="Stop Node"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                      </svg>
                    </button>
                  )}
                  
                  {node.status === 'active' && (
                    <button
                      onClick={() => simulateDataUpload(node.nodeID)}
                      disabled={isProcessing[node.nodeID]}
                      className="p-1.5 bg-purple-500/20 text-purple-400 rounded border border-purple-500/30 hover:bg-purple-500/30 transition-all"
                      title="Simulate Data Upload"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </button>
                  )}
                  
                  {node.reward > 0 && (
                    <button
                      onClick={() => handleClaimRewards(node.nodeID)}
                      disabled={isProcessing[node.nodeID]}
                      className="p-1.5 bg-yellow-500/20 text-yellow-400 rounded border border-yellow-500/30 hover:bg-yellow-500/30 transition-all"
                      title="Claim Rewards"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {nodes.length === 0 && !isLoadingMachines && (
              <div className="px-6 py-12 text-center">
                <p className="text-white/50">No nodes available. Add your first node to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddNodeForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddNode}
      />
    </main>
  );
}
