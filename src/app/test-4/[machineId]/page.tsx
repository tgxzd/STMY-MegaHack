'use client';

import React, { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import IDL from '@/app/contract-2/idl.json';
import { useParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DownloadIcon } from "lucide-react";
import { toast } from 'sonner';
import { getProviderWithPrivateKey } from '@/config/solana';

interface SensorReading {
  temperatureC: number;
  humidity: number;
  timestamp: anchor.BN;
}

interface ImageDataType {
  imageUri: string;
  timestamp: anchor.BN;
}

interface SensorData {
  machineId: string;
  readings: Array<{
    temperatureC: number;
    humidity: number;
    timestamp: number;
  }>;
  imageData: Array<{
    imageUri: string;
    timestamp: number;
  }>;
  totalReadings: number;
  isOn: boolean;
}

const MachineDetailPage = () => {
  const params = useParams();
  const machineId = params.machineId as string;
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const [program, setProgram] = useState<anchor.Program | null>(null);
  const [sensorProgram, setSensorProgram] = useState<anchor.Program | null>(null);
  const [machineData, setMachineData] = useState<SensorData | null>(null);
  const [isLoading, setIsLoading] = useState({
    turnOn: false,
    turnOff: false
  });
  const [dataFetchInterval, setDataFetchInterval] = useState<NodeJS.Timeout | null>(null);
  const [imageFetchInterval, setImageFetchInterval] = useState<NodeJS.Timeout | null>(null);

  // Initialize programs - one with wallet for turn on/off, one with private key for sensor data
  useEffect(() => {
    // Initialize program with wallet for turn on/off operations
    if (publicKey && signTransaction && signAllTransactions) {
      const walletProvider = new anchor.AnchorProvider(
        connection,
        {
          publicKey,
          signTransaction,
          signAllTransactions
        },
        { commitment: 'confirmed' }
      );

      const walletProgram = new anchor.Program(
        IDL as anchor.Idl,
        walletProvider
      );
      setProgram(walletProgram);
    }

    // Initialize program with private key for sensor data
    const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;
    if (privateKey) {
      try {
        const provider = getProviderWithPrivateKey(privateKey);
        const sensorProgram = new anchor.Program(
          IDL as anchor.Idl,
          provider
        );
        setSensorProgram(sensorProgram);
      } catch (error) {
        console.error('Error initializing sensor program with private key:', error);
      }
    }
  }, [publicKey, signTransaction, signAllTransactions, connection]);

  const fetchMachineData = async () => {
    // Use either program instance to fetch data
    const activeProgram = program || sensorProgram;
    if (!activeProgram) return;

    try {
      const [sensorPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("machine"), Buffer.from(machineId)],
        activeProgram.programId
      );

      const account = await connection.getAccountInfo(sensorPDA);
      if (!account) return;

      const accountData = activeProgram.coder.accounts.decode(
        'sensorData',
        account.data
      );

      setMachineData({
        machineId: accountData.machineId,
        readings: accountData.readings.map((r: SensorReading) => ({
          temperatureC: r.temperatureC,
          humidity: r.humidity,
          timestamp: r.timestamp.toNumber(),
        })),
        imageData: accountData.imageData.map((img: ImageDataType) => ({
          imageUri: img.imageUri,
          timestamp: img.timestamp.toNumber(),
        })),
        totalReadings: accountData.totalReadings.toNumber(),
        isOn: accountData.isOn,
      });
    } catch (error) {
      console.error("Error fetching machine data:", error);
    }
  };

  useEffect(() => {
    const activeProgram = program || sensorProgram;
    if (activeProgram) {
      fetchMachineData();
    }
  }, [program, sensorProgram, machineId]);

  const fetchAndAddSensorData = async () => {
    if (!sensorProgram || !machineData?.isOn) {
      return;
    }

    try {
      // Fetch sensor data from API
      const response = await fetch('https://machine.hrzhkm.xyz/api/sensor');
      const sensorData = await response.json();

      const [sensorPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("machine"), Buffer.from(machineId)],
        sensorProgram.programId
      );

      const userPublicKey = sensorProgram.provider.publicKey;
      if (!userPublicKey) {
        throw new Error('Provider public key not available');
      }

      await sensorProgram.methods
        .addData(sensorData.temperature_c, sensorData.humidity)
        .accounts({
          sensorData: sensorPDA,
          user: userPublicKey,
        })
        .rpc();

      await fetchMachineData();
      console.log("Added sensor data:", { temperature: sensorData.temperature_c, humidity: sensorData.humidity });
    } catch (error) {
      console.error("Error adding sensor data:", error);
      toast('Failed to add sensor data', {
        dismissible: true,
        duration: 2000
      });
    }
  };

  const fetchAndAddImageData = async () => {
    if (!sensorProgram || !machineData?.isOn) {
      return;
    }

    try {
      // Fetch image data from API
      const response = await fetch('https://machine.hrzhkm.xyz/api/manual-upload/get');
      const imageData = await response.json();

      if (!imageData.success || !imageData.shortUrl) {
        throw new Error('Failed to get valid image data');
      }

      const [sensorPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("machine"), Buffer.from(machineId)],
        sensorProgram.programId
      );

      const userPublicKey = sensorProgram.provider.publicKey;
      if (!userPublicKey) {
        throw new Error('Provider public key not available');
      }

      await sensorProgram.methods
        .addImage(imageData.shortUrl)
        .accounts({
          sensorData: sensorPDA,
          user: userPublicKey,
        })
        .rpc();

      await fetchMachineData();
      console.log("Added image data:", { imageUrl: imageData.shortUrl });
    } catch (error) {
      console.error("Error adding image data:", error);
      toast('Failed to add image data', {
        dismissible: true,
        duration: 2000
      });
    }
  };

  // Start/stop data fetching based on machine state
  useEffect(() => {
    if (machineData?.isOn && !dataFetchInterval) {
      // Start fetching sensor data every 10 seconds
      const interval = setInterval(fetchAndAddSensorData, 10000);
      setDataFetchInterval(interval);
      // Fetch immediately when turned on
      fetchAndAddSensorData();
    } else if (!machineData?.isOn && dataFetchInterval) {
      // Stop fetching when machine is turned off
      clearInterval(dataFetchInterval);
      setDataFetchInterval(null);
    }

    // Cleanup interval on unmount or when machine is turned off
    return () => {
      if (dataFetchInterval) {
        clearInterval(dataFetchInterval);
      }
    };
  }, [machineData?.isOn, sensorProgram]);

  // Handle image uploads with 10-second initial delay and 10-minute intervals
  useEffect(() => {
    if (machineData?.isOn && !imageFetchInterval) {
      // First image upload after 10 seconds
      const initialTimeout = setTimeout(() => {
        fetchAndAddImageData();
        
        // Then start the 10-minute interval
        const interval = setInterval(fetchAndAddImageData, 600000); // 10 minutes in milliseconds
        setImageFetchInterval(interval);
      }, 10000); // 10 seconds initial delay

      // Cleanup function for the initial timeout
      return () => {
        clearTimeout(initialTimeout);
      };
    } else if (!machineData?.isOn && imageFetchInterval) {
      // Stop fetching when machine is turned off
      clearInterval(imageFetchInterval);
      setImageFetchInterval(null);
    }

    // Cleanup interval on unmount or when machine is turned off
    return () => {
      if (imageFetchInterval) {
        clearInterval(imageFetchInterval);
      }
    };
  }, [machineData?.isOn, sensorProgram]);

  const turnOnMachine = async () => {
    if (!program || !publicKey) return;

    try {
      setIsLoading(prev => ({ ...prev, turnOn: true }));
      const [sensorPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("machine"), Buffer.from(machineId)],
        program.programId
      );

      await program.methods
        .turnOn()
        .accounts({
          sensorData: sensorPDA,
          user: publicKey,
        })
        .rpc();

      // Call the external API after successful blockchain transaction
      try {
        const response = await fetch('https://machine.hrzhkm.xyz/api/control/on');
        const data = await response.json();
        if (!data.camera_active || !data.sensor_active) {
          toast('Warning: Not all systems turned on', {
            dismissible: true,
            duration: 3000
          });
        }
      } catch (apiError) {
        console.error("Error calling external API:", apiError);
        toast('Machine state changed but external systems may not be synced', {
          dismissible: true,
          duration: 3000
        });
      }

      await fetchMachineData();
      toast('Machine turned on successfully', {
        dismissible: true,
        duration: 2000
      });
    } catch (error) {
      console.error("Error turning on machine:", error);
      toast('Failed to turn on machine', {
        dismissible: true,
        duration: 2000
      });
    } finally {
      setIsLoading(prev => ({ ...prev, turnOn: false }));
    }
  };

  const turnOffMachine = async () => {
    if (!program || !publicKey) return;

    try {
      setIsLoading(prev => ({ ...prev, turnOff: true }));
      const [sensorPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("machine"), Buffer.from(machineId)],
        program.programId
      );

      await program.methods
        .turnOff()
        .accounts({
          sensorData: sensorPDA,
          user: publicKey,
        })
        .rpc();

      // Call the external API after successful blockchain transaction
      try {
        const response = await fetch('https://machine.hrzhkm.xyz/api/control/off');
        const data = await response.json();
        if (data.camera_active || data.sensor_active) {
          toast('Warning: Some systems still active', {
            dismissible: true,
            duration: 3000
          });
        }
      } catch (apiError) {
        console.error("Error calling external API:", apiError);
        toast('Machine state changed but external systems may not be synced', {
          dismissible: true,
          duration: 3000
        });
      }

      await fetchMachineData();
      toast('Machine turned off successfully', {
        dismissible: true,
        duration: 2000
      });
    } catch (error) {
      console.error("Error turning off machine:", error);
      toast('Failed to turn off machine', {
        dismissible: true,
        duration: 2000
      });
    } finally {
      setIsLoading(prev => ({ ...prev, turnOff: false }));
    }
  };

  const downloadCSV = () => {
    if (!machineData) return;

    // Create CSV content
    const headers = ['Temperature (°C)', 'Humidity (%)', 'Timestamp'];
    const rows = machineData.readings.map(reading => [
      reading.temperatureC,
      reading.humidity,
      new Date(reading.timestamp * 1000).toLocaleString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sensor_data_${machineData.machineId}_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!publicKey) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center">Please connect your wallet to turn the machine on/off</p>
        </CardContent>
      </Card>
    );
  }

  if (!machineData) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-center">Loading machine data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6 mt-24">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Machine {machineData.machineId}</CardTitle>
              <CardDescription>Detailed sensor information</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${machineData.isOn ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <Button
                onClick={turnOnMachine}
                variant="default"
                disabled={machineData.isOn || isLoading.turnOn || isLoading.turnOff}
              >
                {isLoading.turnOn ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Turning On...
                  </div>
                ) : (
                  "Turn On"
                )}
              </Button>
              <Button
                onClick={turnOffMachine}
                variant="destructive"
                disabled={!machineData.isOn || isLoading.turnOn || isLoading.turnOff}
              >
                {isLoading.turnOff ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Turning Off...
                  </div>
                ) : (
                  "Turn Off"
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Sensor Readings</CardTitle>
                <CardDescription>Total Readings: {machineData.totalReadings}</CardDescription>
              </div>
              <Button
                onClick={downloadCSV}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <DownloadIcon className="h-4 w-4" />
                Download CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Temperature</TableHead>
                    <TableHead>Humidity</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {machineData.readings.map((reading, index) => (
                    <TableRow key={index}>
                      <TableCell>{reading.temperatureC}°C</TableCell>
                      <TableCell>{reading.humidity}%</TableCell>
                      <TableCell>{new Date(reading.timestamp * 1000).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
            <CardDescription>Visual data from the machine</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {machineData.imageData.map((image, index) => (
                <Dialog key={index}>
                  <DialogTrigger asChild>
                    <div className="cursor-pointer hover:opacity-80 transition-opacity">
                      <img
                        src={image.imageUri}
                        alt={`Sensor image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <p className="text-xs mt-1 text-muted-foreground">
                        {new Date(image.timestamp * 1000).toLocaleString()}
                      </p>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <img
                      src={image.imageUri}
                      alt={`Sensor image ${index + 1}`}
                      className="w-full object-contain rounded-lg"
                    />
                    <p className="text-sm text-center mt-2">
                      Uploaded: {new Date(image.timestamp * 1000).toLocaleString()}
                    </p>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MachineDetailPage; 