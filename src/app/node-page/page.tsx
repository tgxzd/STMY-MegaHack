'use client';

import { useState, useEffect } from 'react';
import AddNodeForm from '@/components/AddNodeForm';
import { Node, nodesData } from '@/data/nodes';
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [machineId, setMachineId] = useState("");
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [registeredMachines, setRegisteredMachines] = useState<MachineAccount[]>([]);
  const [isLoadingMachines, setIsLoadingMachines] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  useEffect(() => {
    // Load initial node data
    setNodes(nodesData);
    
    if (wallet) {
      fetchAllMachines();
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
      const machineNodes = machineAccounts.map(machine => ({
        nodeID: machine.machineId,
        nodeName: machine.machineId,
        status: machine.isActive ? 'active' : 'inactive',
        uptime: Math.floor(Math.random() * 24), // Random uptime for demo
        usage: machine.dataCount + machine.imageCount,
        reward: machine.rewardsEarned,
        activationDate: new Date(machine.lastDataTimestamp * 1000).toISOString().split('T')[0],
        totalDataTransmitted: `${machine.dataCount * 5}MB`
      }));
      
      // Merge with any existing mock nodes
      setNodes([...nodesData, ...machineNodes]);
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
      setMachineId(nodeName);
      
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
      
      // Fallback to local node addition if blockchain registration fails
      const newNode: Node = {
        nodeID: `NODE-${String(nodes.length + 1).padStart(3, '0')}`,
        nodeName: nodeName,
        status: 'active',
        uptime: 0,
        usage: 0,
        reward: 0,
        activationDate: new Date().toISOString().split('T')[0],
        totalDataTransmitted: "0MB"
      };
      setNodes([...nodes, newNode]);
    } finally {
      setIsRegistering(false);
      setMachineId("");
    }
  };

  return (
    <main className="min-h-screen pt-16 md:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8 mt-25">
          
          <button 
            onClick={() => setIsFormOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md"
            disabled={isRegistering}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            {isRegistering ? 'Adding...' : 'Add Node'}
          </button>
        </div>
        
        {/* Node table */}
        <div className="bg-black/80 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-xl">
          {/* Table header */}
          <div className="grid grid-cols-5 bg-black/90 px-6 py-4 border-b border-white/10">
            <div className="font-medium text-white/90 text-sm">Node Name</div>
            <div className="font-medium text-white/90 text-sm text-center">Status</div>
            <div className="font-medium text-white/90 text-sm text-center">Today&apos;s Uptime</div>
            <div className="font-medium text-white/90 text-sm text-center">Today&apos;s Usage</div>
            <div className="font-medium text-white/90 text-sm text-center">Today&apos;s Rewards</div>
          </div>
          
          {/* Table body */}
          <div className="divide-y divide-white/5">
            {isLoadingMachines ? (
              <div className="px-6 py-12 text-center">
                <p className="text-white/50">Loading nodes...</p>
              </div>
            ) : nodes.map((node) => (
              <Link 
                href={`/node-page/${node.nodeID}`}
                key={node.nodeID}
                className="grid grid-cols-5 px-6 py-4 hover:bg-black/50 transition-colors block cursor-pointer"
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
                  <span className="text-white font-medium">{node.uptime}</span>
                  <span className="text-xs text-white/50">hours</span>
                </div>
                
                <div className="flex items-center justify-center">
                  <span className="text-white font-medium">{node.usage}</span>
                </div>
                
                <div className="text-center flex items-center justify-center">
                  <span className="text-white font-medium">{node.reward}</span>
                  <span className="text-white/50 text-sm ml-1">Pts</span>
                </div>
              </Link>
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
