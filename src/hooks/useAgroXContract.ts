'use client'

import { useEffect, useState, useCallback } from 'react';
import * as anchor from '@coral-xyz/anchor';
import { PublicKey, Connection } from '@solana/web3.js';
import { useAnchorWallet } from '@solana/wallet-adapter-react';

// Import your IDL - path will depend on your project structure
import idl from '../contract/idl.json';
import { Program } from '@coral-xyz/anchor';

// Types for our data - these should match your contract's account structures
type Machine = {
  owner: PublicKey;
  machineId: string;
  isActive: boolean;
  dataCount: anchor.BN;
  imageCount: anchor.BN;
  rewardsEarned: anchor.BN;
  lastDataTimestamp: anchor.BN;
  lastImageTimestamp: anchor.BN;
  dataUsedCount: anchor.BN;
  plants: [string, PublicKey][];
  plantCount: anchor.BN;
  bump: number;
  publicKey: PublicKey; // Added for easier reference
};

type Plant = {
  creator: PublicKey;
  plantName: string;
  dataCount: anchor.BN;
  imageCount: anchor.BN;
  creationTimestamp: anchor.BN;
  lastUpdateTimestamp: anchor.BN;
  machine: PublicKey;
  bump: number;
  publicKey: PublicKey; // Added for easier reference
};

type DataEntry = {
  timestamp: anchor.BN;
  temperature: number;
  humidity: number;
  imageUrl: string | null;
  usedCount: anchor.BN;
};

type IoTData = {
  machine: PublicKey;
  plant: PublicKey;
  dataEntries: DataEntry[];
  bump: number;
  publicKey: PublicKey; // Added for easier reference
};

type Cluster = {
  authority: PublicKey;
  machineCount: anchor.BN;
  totalDataUploads: anchor.BN;
  dataRequestCount: anchor.BN;
  plantCount: anchor.BN;
  machines: [string, PublicKey][];
  plants: [string, PublicKey][];
  bump: number;
  publicKey: PublicKey; // Added for easier reference
};

// Define the account structure types from Anchor
type AnchorAccount = {
  publicKey: PublicKey;
  account: Record<string, unknown>;
};

// Define sensor data type
type SensorData = {
  humidity: number;
  temperature_c: number;
  temperature_f: number;
  timestamp: number;
};

export function useAgroXContract() {
  const connection = new Connection(
    process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com'
  );

  // State variables for data
  const [cluster, setCluster] = useState<Cluster | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [iotData, setIotData] = useState<IoTData[]>([]);
  const [userMachines, setUserMachines] = useState<Machine[]>([]);
  const [isLoadingMachines, setIsLoadingMachines] = useState(false);
  const [isLoadingPlants, setIsLoadingPlants] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isClaimingRewards, setIsClaimingRewards] = useState(false);
  const wallet = useAnchorWallet();
  
  // Additional state for sensor data and images
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [latestImage, setLatestImage] = useState<string | null>(null);
  const [isFetchingSensorData, setIsFetchingSensorData] = useState(false);

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

  // Get Anchor program instance
  const getProgram = useCallback(() => {
    try {
      const provider = getProvider();
      const program = new Program(idl as anchor.Idl, provider);
      return program;
    } catch (error) {
      console.error("Error getting program:", error);
      return null;
    }
  }, [wallet, connection]);

  // Fetch all data from the cluster
  const fetchClusterData = useCallback(async () => {
    try {
      const program = getProgram();
      if (!program) return null;
      
      // Find the cluster PDA
      const [clusterPDA] = await PublicKey.findProgramAddressSync(
        [Buffer.from("cluster")],
        program.programId
      );
      
      // @ts-expect-error - Account structure from IDL
      const clusterData = await program.account.cluster.fetch(clusterPDA);
      setCluster({
        ...clusterData,
        publicKey: clusterPDA
      });
      
      return {
        ...clusterData,
        publicKey: clusterPDA
      };
    } catch (error) {
      console.error("Error fetching cluster data:", error);
      return null;
    }
  }, [getProgram]);

  // Fetch all machines
  const fetchAllMachines = useCallback(async () => {
    try {
      setIsLoadingMachines(true);
      const program = getProgram();
      if (!program) {
        console.log("Program not available");
        return [];
      }

      // @ts-expect-error - Account structure from IDL
      const allMachines = await program.account.machine.all();
      console.log("All machines:", allMachines);
      
      // Format the results with the public key included
      const formattedMachines = allMachines.map((item: AnchorAccount) => ({
        ...item.account,
        publicKey: item.publicKey
      }));
      
      setMachines(formattedMachines);
      
      // Filter for user's machines
      if (wallet?.publicKey) {
        const userOwnedMachines = formattedMachines.filter(
          (machine: Machine) => machine.owner.toString() === wallet.publicKey?.toString()
        );
        setUserMachines(userOwnedMachines);
      }
      
      return formattedMachines;
    } catch (error) {
      console.error("Error fetching machines:", error);
      return [];
    } finally {
      setIsLoadingMachines(false);
    }
  }, [getProgram, wallet]);

  // Fetch all plants
  const fetchAllPlants = useCallback(async () => {
    try {
      setIsLoadingPlants(true);
      const program = getProgram();
      if (!program) return [];

      // @ts-expect-error - Account structure from IDL
      const allPlants = await program.account.plantData.all();
      console.log("All plants:", allPlants);
      
      // Format the results with the public key included
      const formattedPlants = allPlants.map((item: AnchorAccount) => ({
        ...item.account,
        publicKey: item.publicKey
      }));
      
      setPlants(formattedPlants);
      return formattedPlants;
    } catch (error) {
      console.error("Error fetching plants:", error);
      return [];
    } finally {
      setIsLoadingPlants(false);
    }
  }, [getProgram]);

  // Fetch all IoT data
  const fetchAllIoTData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const program = getProgram();
      if (!program) return [];

      // @ts-expect-error - Account structure from IDL
      const allData = await program.account.ioTData.all();
      console.log("All IoT data:", allData);
      
      // Format the results with the public key included
      const formattedData = allData.map((item: AnchorAccount) => ({
        ...item.account,
        publicKey: item.publicKey
      }));
      
      setIotData(formattedData);
      return formattedData;
    } catch (error) {
      console.error("Error fetching IoT data:", error);
      return [];
    } finally {
      setIsLoadingData(false);
    }
  }, [getProgram]);

  // Fetch sensor data from the API
  const fetchSensorData = async () => {
    try {
      setIsFetchingSensorData(true);
      const response = await fetch('http://192.168.1.174:8000/api/sensor');
      if (response.ok) {
        const data = await response.json();
        setSensorData(data);
        console.log('Sensor data fetched:', data);
        return data;
      } else {
        console.error('Failed to fetch sensor data:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      return null;
    } finally {
      setIsFetchingSensorData(false);
    }
  };

  // Fetch latest image from the API
  const fetchLatestImage = async () => {
    try {
      const response = await fetch('http://192.168.1.174:8000/api/images/latest');
      if (response.ok) {
        // For image data, create a blob URL
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setLatestImage(imageUrl);
        console.log('Latest image fetched');
        return imageUrl;
      } else {
        console.error('Failed to fetch latest image:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('Error fetching latest image:', error);
      return null;
    }
  };

  // Fetch all data on wallet connection
  useEffect(() => {
    if (wallet) {
      fetchClusterData();
      fetchAllMachines();
      fetchAllPlants();
      fetchAllIoTData();
    }
  }, [wallet, fetchClusterData, fetchAllMachines, fetchAllPlants, fetchAllIoTData]);

  // Fetch plants for a specific machine
  const fetchPlantsByMachine = async (machinePublicKey: PublicKey) => {
    try {
      const allPlants = await fetchAllPlants();
      return allPlants.filter(
        (plant: Plant) => plant.machine.toString() === machinePublicKey.toString()
      );
    } catch (error) {
      console.error(`Error fetching plants for machine ${machinePublicKey.toString()}:`, error);
      return [];
    }
  };

  // Fetch IoT data for a specific plant
  const fetchDataByPlant = async (plantPublicKey: PublicKey) => {
    try {
      const allData = await fetchAllIoTData();
      return allData.filter(
        (data: IoTData) => data.plant.toString() === plantPublicKey.toString()
      );
    } catch (error) {
      console.error(`Error fetching data for plant ${plantPublicKey.toString()}:`, error);
      return [];
    }
  };

  // Fetch IoT data for a specific machine
  const fetchDataByMachine = async (machinePublicKey: PublicKey) => {
    try {
      const allData = await fetchAllIoTData();
      return allData.filter(
        (data: IoTData) => data.machine.toString() === machinePublicKey.toString()
      );
    } catch (error) {
      console.error(`Error fetching data for machine ${machinePublicKey.toString()}:`, error);
      return [];
    }
  };

  // Register a new machine
  const registerMachine = async (machineId: string) => {
    try {
      const program = getProgram();
      if (!program || !wallet?.publicKey) {
        console.error("Wallet not connected");
        return null;
      }

      // Find the cluster PDA
      const [clusterPDA] = await PublicKey.findProgramAddressSync(
        [Buffer.from("cluster")],
        program.programId
      );

      // Find the machine PDA
      const [machinePDA] = await PublicKey.findProgramAddressSync(
        [Buffer.from("machine"), Buffer.from(machineId)],
        program.programId
      );

      // Send transaction
      const tx = await program.methods
        .registerMachine(machineId)
        .accounts({
          cluster: clusterPDA,
          machine: machinePDA,
          user: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Machine registered with transaction:", tx);
      
      // Refresh machines list
      await fetchAllMachines();
      
      return {
        txId: tx,
        machineAddress: machinePDA.toString()
      };
    } catch (error) {
      console.error("Error registering machine:", error);
      return null;
    }
  };

  // Create a new plant
  const createPlant = async (machinePublicKey: PublicKey, plantName: string) => {
    try {
      const program = getProgram();
      if (!program || !wallet?.publicKey) {
        console.error("Wallet not connected");
        return null;
      }

      // Find the cluster PDA
      const [clusterPDA] = await PublicKey.findProgramAddressSync(
        [Buffer.from("cluster")],
        program.programId
      );

      // Find the plant PDA
      const [plantPDA] = await PublicKey.findProgramAddressSync(
        [Buffer.from("plant"), Buffer.from(plantName)],
        program.programId
      );

      // Send transaction
      const tx = await program.methods
        .createPlant(plantName)
        .accounts({
          cluster: clusterPDA,
          plant: plantPDA,
          machine: machinePublicKey,
          user: wallet?.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Plant created with transaction:", tx);
      
      // Refresh plants list
      await fetchAllPlants();
      
      return {
        txId: tx,
        plantAddress: plantPDA.toString()
      };
    } catch (error) {
      console.error("Error creating plant:", error);
      return null;
    }
  };

  // Start a machine
  const startMachine = async (machinePublicKey: PublicKey) => {
    try {
      const program = getProgram();
      if (!program || !wallet?.publicKey) {
        console.error("Wallet not connected");
        return null;
      }

      // Send transaction
      const tx = await program.methods
        .startMachine()
        .accounts({
          machine: machinePublicKey,
          user: wallet.publicKey,
        })
        .rpc();

      console.log("Machine started with transaction:", tx);
      
      // Call control API to physically turn on the device
      try {
        const response = await fetch('http://192.168.1.174:8000/api/control/on', {
          method: 'GET',
        });
        if (response.ok) {
          console.log('Hardware device turned ON via API');
          
          // Wait 3 seconds before fetching sensor data and image
          console.log('Waiting 3 seconds before fetching sensor data and image...');
          setTimeout(async () => {
            // Fetch sensor data and latest image in parallel
            const [sensorDataResult, imageUrl] = await Promise.all([
              fetchSensorData(),
              fetchLatestImage()
            ]);
            
            // If we have sensor data, upload it to the blockchain
            if (sensorDataResult && machinePublicKey) {
              // Find a plant to associate the data with (first plant of the machine)
              const machinePlants = await fetchPlantsByMachine(machinePublicKey);
              if (machinePlants.length > 0) {
                const firstPlant = machinePlants[0];
                // Upload the data to the blockchain
                await uploadData(
                  machinePublicKey,
                  firstPlant.publicKey,
                  sensorDataResult.temperature_c,
                  sensorDataResult.humidity,
                  imageUrl || undefined
                );
                console.log('Sensor data and image uploaded to blockchain');
              } else {
                console.log('No plants found for this machine to upload data');
              }
            }
          }, 3000); // 3 seconds delay
        } else {
          console.error('Failed to turn ON hardware device via API:', await response.text());
        }
      } catch (apiError) {
        console.error('Error calling control API for ON:', apiError);
      }
      
      // Refresh machines list
      await fetchAllMachines();
      
      return { txId: tx };
    } catch (error) {
      console.error("Error starting machine:", error);
      return null;
    }
  };

  // Stop a machine
  const stopMachine = async (machinePublicKey: PublicKey) => {
    try {
      const program = getProgram();
      if (!program || !wallet?.publicKey) {
        console.error("Wallet not connected");
        return null;
      }

      // Send transaction
      const tx = await program.methods
        .stopMachine()
        .accounts({
          machine: machinePublicKey,
          user: wallet.publicKey,
        })
        .rpc();

      console.log("Machine stopped with transaction:", tx);
      
      // Call control API to physically turn off the device
      try {
        const response = await fetch('http://192.168.1.174:8000/api/control/off', {
          method: 'GET',
        });
        if (response.ok) {
          console.log('Hardware device turned OFF via API');
        } else {
          console.error('Failed to turn OFF hardware device via API:', await response.text());
        }
      } catch (apiError) {
        console.error('Error calling control API for OFF:', apiError);
      }
      
      // Refresh machines list
      await fetchAllMachines();
      
      return { txId: tx };
    } catch (error) {
      console.error("Error stopping machine:", error);
      return null;
    }
  };

  // Upload data
  const uploadData = async (
    machinePublicKey: PublicKey, 
    plantPublicKey: PublicKey, 
    temperature: number, 
    humidity: number, 
    imageUrl?: string
  ) => {
    try {
      const program = getProgram();
      if (!program || !wallet?.publicKey) {
        console.error("Wallet not connected");
        return null;
      }

      // Get machine account to access machineId
      // @ts-expect-error - Account structure from IDL
      const machineAccount = await program.account.machine.fetch(machinePublicKey);
      
      // Get plant account to access plantName
      // @ts-expect-error - Account structure from IDL
      const plantAccount = await program.account.plantData.fetch(plantPublicKey);
      
      // Find the cluster PDA
      const [clusterPDA] = await PublicKey.findProgramAddressSync(
        [Buffer.from("cluster")],
        program.programId
      );
      
      // Find the data PDA
      const [dataPDA] = await PublicKey.findProgramAddressSync(
        [
          Buffer.from("data"), 
          Buffer.from(machineAccount.machineId), 
          Buffer.from(plantAccount.plantName)
        ],
        program.programId
      );

      // Send transaction
      const tx = await program.methods
        .uploadData(
          temperature, 
          humidity, 
          imageUrl || null
        )
        .accounts({
          cluster: clusterPDA,
          machine: machinePublicKey,
          plant: plantPublicKey,
          data: dataPDA,
          payer: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Data uploaded with transaction:", tx);
      
      // Refresh data
      await fetchAllIoTData();
      
      return {
        txId: tx,
        dataAddress: dataPDA.toString()
      };
    } catch (error) {
      console.error("Error uploading data:", error);
      return null;
    }
  };

  // Use data
  const useData = async (
    machinePublicKey: PublicKey,
    dataPublicKey: PublicKey, 
    entryIndex: number
  ) => {
    try {
      const program = getProgram();
      if (!program || !wallet?.publicKey) {
        console.error("Wallet not connected");
        return null;
      }

      // Find the cluster PDA
      const [clusterPDA] = await PublicKey.findProgramAddressSync(
        [Buffer.from("cluster")],
        program.programId
      );

      // Send transaction
      const tx = await program.methods
        .useData(new anchor.BN(entryIndex))
        .accounts({
          cluster: clusterPDA,
          machine: machinePublicKey,
          data: dataPublicKey,
          user: wallet.publicKey,
        })
        .rpc();

      console.log("Data used with transaction:", tx);
      
      // Refresh data
      await fetchAllIoTData();
      
      return { txId: tx };
    } catch (error) {
      console.error("Error using data:", error);
      return null;
    }
  };

  // Claim rewards
  const claimRewards = async (machinePublicKey: PublicKey) => {
    try {
      setIsClaimingRewards(true);
      const program = getProgram();
      if (!program || !wallet?.publicKey) {
        console.error("Wallet not connected");
        return null;
      }

      // Send transaction
      const tx = await program.methods
        .claimRewards()
        .accounts({
          machine: machinePublicKey,
          user: wallet.publicKey,
        })
        .rpc();

      console.log("Rewards claimed with transaction:", tx);
      
      // Refresh machines to update rewards
      await fetchAllMachines();
      
      return { txId: tx };
    } catch (error) {
      console.error("Error claiming rewards:", error);
      return null;
    } finally {
      setIsClaimingRewards(false);
    }
  };

  return {
    // State
    cluster,
    machines,
    plants,
    iotData,
    userMachines,
    isLoadingMachines,
    isLoadingPlants,
    isLoadingData,
    isClaimingRewards,
    sensorData,
    latestImage,
    isFetchingSensorData,
    
    // Data fetching methods
    fetchClusterData,
    fetchAllMachines,
    fetchAllPlants,
    fetchPlantsByMachine,
    fetchAllIoTData,
    fetchDataByPlant,
    fetchDataByMachine,
    fetchSensorData,
    fetchLatestImage,
    
    // Transaction methods
    registerMachine,
    createPlant,
    startMachine,
    stopMachine,
    uploadData,
    useData,
    claimRewards,
  };
} 