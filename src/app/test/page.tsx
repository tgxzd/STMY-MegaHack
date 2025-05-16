'use client';
import { useState } from 'react';
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import idl from '@/contract/idl.json';

const TestPage = () => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("initialize");

  // Get provider and program
  const getProvider = () => {
    if (!wallet) {
      throw new Error("Wallet not connected");
    }
    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      { commitment: "processed" }
    );
    return provider;
  };

  const getProgram = () => {
    const provider = getProvider();
    const program = new Program(idl as anchor.Idl, provider);
    return program;
  };

  // Initialize the contract
  const initialize = async () => {
    try {
      setLoading(true);
      setMessage("Initializing...");
      
      const program = getProgram();
      const provider = getProvider();
      
      // Updated PDA seed
      const [clusterPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("cluster")],
        program.programId
      );
      
      const tx = await program.methods
        .initialize()
        .accounts({
          cluster: clusterPDA,
          authority: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId
        })
        .rpc();
      
      setMessage(`Successfully initialized! TX: ${tx}`);
    } catch (error: unknown) {
      console.error("Error initializing:", error);
      setMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  // Delegate the account to delegation program
  const delegateAccount = async () => {
    try {
      setLoading(true);
      setMessage("Delegating account...");
      
      const program = getProgram();
      const provider = getProvider();
      
      // Get cluster PDA
      const [clusterPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("cluster")],
        program.programId
      );
      
      const tx = await program.methods
        .delegate()
        .accounts({
          payer: provider.wallet.publicKey,
          pda: clusterPDA
        })
        .rpc();
      
      setMessage(`Successfully delegated! TX: ${tx}`);
    } catch (error: unknown) {
      console.error("Error delegating:", error);
      setMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  // Undelegate the account from delegation program
  const undelegateAccount = async () => {
    try {
      setLoading(true);
      setMessage("Undelegating account...");
      
      const program = getProgram();
      const provider = getProvider();
      
      // Get cluster PDA
      const [clusterPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("cluster")],
        program.programId
      );
      
      // Note: The magic_context and magic_program accounts would need to be properly defined
      // based on the actual delegate program infrastructure
      const tx = await program.methods
        .undelegate()
        .accounts({
          payer: provider.wallet.publicKey,
          pda: clusterPDA,
          magicContext: new PublicKey("MagicContext1111111111111111111111111111111"),
          magicProgram: new PublicKey("Magic11111111111111111111111111111111111111"),
        })
        .rpc();
      
      setMessage(`Successfully undelegated! TX: ${tx}`);
    } catch (error: unknown) {
      console.error("Error undelegating:", error);
      setMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  // Register a new machine
  const registerMachine = async (machineId: string) => {
    try {
      setLoading(true);
      setMessage(`Registering machine ${machineId}...`);
      
      const program = getProgram();
      const provider = getProvider();
      
      // Get cluster PDA
      const [clusterPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("cluster")],
        program.programId
      );
      
      // Machine PDA with correct seed
      const [machinePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("machine"), Buffer.from(machineId)],
        program.programId
      );
      
      const tx = await program.methods
        .registerMachine(machineId)
        .accounts({
          cluster: clusterPDA,
          machine: machinePDA,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId
        })
        .rpc();
      
      setMessage(`Machine registered successfully! TX: ${tx}`);
    } catch (error: unknown) {
      console.error("Error registering machine:", error);
      setMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  // Create a new plant
  const createPlant = async (machineId: string, plantName: string) => {
    try {
      setLoading(true);
      setMessage(`Creating plant ${plantName} for machine ${machineId}...`);
      
      const program = getProgram();
      const provider = getProvider();
      
      // Get cluster PDA
      const [clusterPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("cluster")],
        program.programId
      );
      
      // Machine PDA
      const [machinePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("machine"), Buffer.from(machineId)],
        program.programId
      );
      
      // Plant PDA with updated seed - now using plant name instead of machine id
      const [plantPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("plant"), Buffer.from(plantName)],
        program.programId
      );
      
      const tx = await program.methods
        .createPlant(plantName)
        .accounts({
          cluster: clusterPDA,
          plant: plantPDA,
          machine: machinePDA,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId
        })
        .rpc();
      
      setMessage(`Plant created successfully! TX: ${tx}`);
    } catch (error: unknown) {
      console.error("Error creating plant:", error);
      setMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  // Start a machine
  const startMachine = async (machineId: string) => {
    try {
      setLoading(true);
      setMessage(`Starting machine ${machineId}...`);
      
      const program = getProgram();
      const provider = getProvider();
      
      // Machine PDA
      const [machinePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("machine"), Buffer.from(machineId)],
        program.programId
      );
      
      const tx = await program.methods
        .startMachine()
        .accounts({
          machine: machinePDA,
          user: provider.wallet.publicKey
        })
        .rpc();
      
      setMessage(`Machine started successfully! TX: ${tx}`);
    } catch (error: unknown) {
      console.error("Error starting machine:", error);
      setMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  // Stop a machine
  const stopMachine = async (machineId: string) => {
    try {
      setLoading(true);
      setMessage(`Stopping machine ${machineId}...`);
      
      const program = getProgram();
      const provider = getProvider();
      
      // Machine PDA
      const [machinePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("machine"), Buffer.from(machineId)],
        program.programId
      );
      
      const tx = await program.methods
        .stopMachine()
        .accounts({
          machine: machinePDA,
          user: provider.wallet.publicKey
        })
        .rpc();
      
      setMessage(`Machine stopped successfully! TX: ${tx}`);
    } catch (error: unknown) {
      console.error("Error stopping machine:", error);
      setMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  // Upload data from a machine
  const uploadData = async (
    machineId: string, 
    plantName: string, 
    temperature: number, 
    humidity: number, 
    imageUrl?: string
  ) => {
    try {
      setLoading(true);
      setMessage(`Uploading data for machine ${machineId}...`);
      
      const program = getProgram();
      const provider = getProvider();
      
      // Get cluster PDA
      const [clusterPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("cluster")],
        program.programId
      );
      
      // Machine PDA
      const [machinePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("machine"), Buffer.from(machineId)],
        program.programId
      );
      
      // Plant PDA with updated seed
      const [plantPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("plant"), Buffer.from(plantName)],
        program.programId
      );
      
      // Data PDA with correct seeds - machine ID and plant name
      const [dataPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("data"), Buffer.from(machineId), Buffer.from(plantName)],
        program.programId
      );
      
      const tx = await program.methods
        .uploadData(temperature, humidity, imageUrl || null)
        .accounts({
          cluster: clusterPDA,
          machine: machinePDA,
          plant: plantPDA,
          data: dataPDA,
          payer: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId
        })
        .rpc();
      
      setMessage(`Data uploaded successfully! TX: ${tx}`);
    } catch (error: unknown) {
      console.error("Error uploading data:", error);
      setMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  // Use data from a specific entry
  const handleDataUsage = async (machineId: string, plantName: string, entryIndex: number) => {
    try {
      setLoading(true);
      setMessage(`Using data entry ${entryIndex} from machine ${machineId}...`);
      
      const program = getProgram();
      const provider = getProvider();
      
      // Get cluster PDA
      const [clusterPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("cluster")],
        program.programId
      );
      
      // Machine PDA
      const [machinePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("machine"), Buffer.from(machineId)],
        program.programId
      );
      
      // Data PDA with correct seeds
      const [dataPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("data"), Buffer.from(machineId), Buffer.from(plantName)],
        program.programId
      );
      
      const tx = await program.methods
        .useData(new anchor.BN(entryIndex))
        .accounts({
          cluster: clusterPDA,
          machine: machinePDA,
          data: dataPDA,
          user: provider.wallet.publicKey
        })
        .rpc();
      
      setMessage(`Data used successfully! TX: ${tx}`);
    } catch (error: unknown) {
      console.error("Error using data:", error);
      setMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  // Claim rewards for a machine
  const claimRewards = async (machineId: string) => {
    try {
      setLoading(true);
      setMessage(`Claiming rewards for machine ${machineId}...`);
      
      const program = getProgram();
      const provider = getProvider();
      
      // Machine PDA
      const [machinePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("machine"), Buffer.from(machineId)],
        program.programId
      );
      
      const tx = await program.methods
        .claimRewards()
        .accounts({
          machine: machinePDA,
          user: provider.wallet.publicKey
        })
        .rpc();
      
      setMessage(`Rewards claimed successfully! TX: ${tx}`);
    } catch (error: unknown) {
      console.error("Error claiming rewards:", error);
      setMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  // Tab Content Components
  const InitializationTab = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Initialization</h2>
      <p className="text-gray-600">Initialize the AgroX contract with a new cluster.</p>
      <button 
        onClick={initialize} 
        className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-3 rounded-md shadow-md hover:shadow-lg transition-all duration-200 font-medium"
        disabled={loading}
      >
        Initialize Contract
      </button>
    </div>
  );

  const DelegationTab = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Account Delegation</h2>
      <p className="text-gray-600">Manage account delegation to the delegation program.</p>
      <div className="flex gap-4">
        <button 
          onClick={delegateAccount} 
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-md shadow-md transition-colors duration-200"
          disabled={loading}
        >
          Delegate
        </button>
        <button 
          onClick={undelegateAccount} 
          className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-md shadow-md transition-colors duration-200"
          disabled={loading}
        >
          Undelegate
        </button>
      </div>
    </div>
  );

  const MachineTab = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Machine Management</h2>
      <p className="text-gray-600">Register and control your IoT machines.</p>
      <div className="space-y-3">
        <div className="relative">
          <label htmlFor="machineId" className="block text-sm font-medium text-gray-700 mb-1">Machine ID</label>
          <input 
            type="text" 
            id="machineId" 
            placeholder="Enter machine identifier" 
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
          />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <button 
            onClick={() => registerMachine((document.getElementById('machineId') as HTMLInputElement).value)} 
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            disabled={loading}
          >
            Register
          </button>
          <button 
            onClick={() => startMachine((document.getElementById('machineId') as HTMLInputElement).value)} 
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            disabled={loading}
          >
            Start
          </button>
          <button 
            onClick={() => stopMachine((document.getElementById('machineId') as HTMLInputElement).value)} 
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            disabled={loading}
          >
            Stop
          </button>
        </div>
      </div>
    </div>
  );

  const PlantTab = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Plant Management</h2>
      <p className="text-gray-600">Create and manage plants for your machines.</p>
      <div className="space-y-3">
        <div className="relative">
          <label htmlFor="plantMachineId" className="block text-sm font-medium text-gray-700 mb-1">Machine ID</label>
          <input 
            type="text" 
            id="plantMachineId" 
            placeholder="Enter machine identifier" 
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
          />
        </div>
        <div className="relative">
          <label htmlFor="plantName" className="block text-sm font-medium text-gray-700 mb-1">Plant Name</label>
          <input 
            type="text" 
            id="plantName" 
            placeholder="Enter plant name" 
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
          />
        </div>
        <button 
          onClick={() => createPlant(
            (document.getElementById('plantMachineId') as HTMLInputElement).value,
            (document.getElementById('plantName') as HTMLInputElement).value
          )} 
          className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
          disabled={loading}
        >
          Create Plant
        </button>
      </div>
    </div>
  );

  const DataUploadTab = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Data Upload</h2>
      <p className="text-gray-600">Upload sensor data and images from your machines.</p>
      <div className="space-y-3">
        <div className="relative">
          <label htmlFor="dataMachineId" className="block text-sm font-medium text-gray-700 mb-1">Machine ID</label>
          <input 
            type="text" 
            id="dataMachineId" 
            placeholder="Enter machine identifier" 
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
          />
        </div>
        <div className="relative">
          <label htmlFor="dataPlantName" className="block text-sm font-medium text-gray-700 mb-1">Plant Name</label>
          <input 
            type="text" 
            id="dataPlantName" 
            placeholder="Enter plant name" 
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
            <input 
              type="number" 
              id="temperature" 
              placeholder="°C" 
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
            />
          </div>
          <div className="relative">
            <label htmlFor="humidity" className="block text-sm font-medium text-gray-700 mb-1">Humidity</label>
            <input 
              type="number" 
              id="humidity" 
              placeholder="%" 
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
            />
          </div>
        </div>
        <div className="relative">
          <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
          <input 
            type="text" 
            id="imageUrl" 
            placeholder="Enter image URL" 
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
          />
        </div>
        <button 
          onClick={() => uploadData(
            (document.getElementById('dataMachineId') as HTMLInputElement).value,
            (document.getElementById('dataPlantName') as HTMLInputElement).value,
            parseFloat((document.getElementById('temperature') as HTMLInputElement).value),
            parseFloat((document.getElementById('humidity') as HTMLInputElement).value),
            (document.getElementById('imageUrl') as HTMLInputElement).value
          )} 
          className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
          disabled={loading}
        >
          Upload Data
        </button>
      </div>
    </div>
  );

  const DataUsageTab = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Data Usage</h2>
      <p className="text-gray-600">Access data entries and use them in applications.</p>
      <div className="space-y-3">
        <div className="relative">
          <label htmlFor="useDataMachineId" className="block text-sm font-medium text-gray-700 mb-1">Machine ID</label>
          <input 
            type="text" 
            id="useDataMachineId" 
            placeholder="Enter machine identifier" 
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
          />
        </div>
        <div className="relative">
          <label htmlFor="useDataPlantName" className="block text-sm font-medium text-gray-700 mb-1">Plant Name</label>
          <input 
            type="text" 
            id="useDataPlantName" 
            placeholder="Enter plant name" 
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
          />
        </div>
        <div className="relative">
          <label htmlFor="entryIndex" className="block text-sm font-medium text-gray-700 mb-1">Entry Index</label>
          <input 
            type="number" 
            id="entryIndex" 
            placeholder="Data entry index" 
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
          />
        </div>
        <button 
          onClick={() => handleDataUsage(
            (document.getElementById('useDataMachineId') as HTMLInputElement).value,
            (document.getElementById('useDataPlantName') as HTMLInputElement).value,
            parseInt((document.getElementById('entryIndex') as HTMLInputElement).value)
          )} 
          className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
          disabled={loading}
        >
          Use Data
        </button>
      </div>
    </div>
  );

  const RewardsTab = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Rewards Management</h2>
      <p className="text-gray-600">Claim rewards earned from your machine data usage.</p>
      <div className="space-y-3">
        <div className="relative">
          <label htmlFor="rewardsMachineId" className="block text-sm font-medium text-gray-700 mb-1">Machine ID</label>
          <input 
            type="text" 
            id="rewardsMachineId" 
            placeholder="Enter machine identifier" 
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
          />
        </div>
        <button 
          onClick={() => claimRewards(
            (document.getElementById('rewardsMachineId') as HTMLInputElement).value
          )} 
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
          disabled={loading}
        >
          Claim Rewards
        </button>
      </div>
    </div>
  );

  // Tab configuration
  const tabs = [
    { id: "initialize", label: "Initialize", component: InitializationTab },
    { id: "delegate", label: "Delegation", component: DelegationTab },
    { id: "machine", label: "Machines", component: MachineTab },
    { id: "plant", label: "Plants", component: PlantTab },
    { id: "data", label: "Upload Data", component: DataUploadTab },
    { id: "usage", label: "Use Data", component: DataUsageTab },
    { id: "rewards", label: "Rewards", component: RewardsTab }
  ];

  // Render the current active tab component
  const renderActiveTab = () => {
    const tab = tabs.find(t => t.id === activeTab);
    if (tab) {
      const TabComponent = tab.component;
      return <TabComponent />;
    }
    return null;
  };

  // Get status color based on message content
  const getStatusColor = () => {
    if (message.includes("Error")) return "bg-red-100 border-red-300 text-red-800";
    if (message.includes("Success")) return "bg-green-100 border-green-300 text-green-800";
    return "bg-blue-100 border-blue-300 text-blue-800";
  };

  // Simple UI with tabs for testing the functions
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AgroX Smart Contract Dashboard</h1>
          <p className="text-lg text-gray-600">Manage your agricultural IoT data on the blockchain</p>
        </div>

        {!wallet ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-yellow-700 mb-2">Wallet Not Connected</h2>
            <p className="text-yellow-600 mb-4">Please connect your Solana wallet to interact with the contract.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Tab navigation */}
            <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id 
                      ? "border-b-2 border-blue-500 text-blue-600"
                      : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Status message */}
            {message && (
              <div className={`m-4 p-4 rounded-md border ${getStatusColor()}`}>
                <p>{message}</p>
              </div>
            )}

            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-center items-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">Processing...</span>
              </div>
            )}

            {/* Active tab content */}
            <div className="p-6">
              {renderActiveTab()}
            </div>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>AgroX Contract: Smart agriculture data management on Solana</p>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
