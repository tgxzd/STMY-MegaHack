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

const PROGRAM_ID = new PublicKey("5VRxLsJqbr4s2zUtkrsVejNjH5Et9fLwkMRQDY1BoxXD");
const AGROX_PDA_SEED = "agrox";

const TestPage = () => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [isInitializing, setIsInitializing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [machineId, setMachineId] = useState("");

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
  }, [wallet, connection]);

  const checkIfInitialized = async () => {
    try {
      if (!wallet) return;
      
      const program = getProgram();
      if (!program) return;

      const [systemStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from(AGROX_PDA_SEED)],
        PROGRAM_ID
      );

      // Try to fetch the system state account
      try {
        const systemState = await connection.getAccountInfo(systemStatePda);
        setIsInitialized(!!systemState);
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
      const [systemStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from(AGROX_PDA_SEED)],
        PROGRAM_ID
      );

      const [machinePda] = PublicKey.findProgramAddressSync(
        [Buffer.from(AGROX_PDA_SEED), Buffer.from(machineId)],
        PROGRAM_ID
      );

      // Call the register_machine instruction
      const tx = await program.methods
        .registerMachine(machineId)
        .accounts({
          systemState: systemStatePda,
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
    </div>
  );
};

export default TestPage;
