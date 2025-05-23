'use client';

import React, { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
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
  const [machineData, setMachineData] = useState<SensorData | null>(null);
  const [isLoading, setIsLoading] = useState({
    turnOn: false,
    turnOff: false
  });

  useEffect(() => {
    if (publicKey && signTransaction && signAllTransactions) {
      const wallet = {
        publicKey,
        signTransaction,
        signAllTransactions
      };

      const provider = new anchor.AnchorProvider(
        connection,
        wallet,
        { commitment: 'confirmed' }
      );

      const program = new anchor.Program(
        IDL as anchor.Idl,
        provider
      );
      setProgram(program);
    }
  }, [publicKey, signTransaction, signAllTransactions, connection]);

  const fetchMachineData = async () => {
    if (!program || !publicKey) return;

    try {
      const [sensorPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("machine"), Buffer.from(machineId)],
        program.programId
      );

      const account = await connection.getAccountInfo(sensorPDA);
      if (!account) return;

      const accountData = program.coder.accounts.decode(
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
    if (program && publicKey) {
      fetchMachineData();
    }
  }, [program, publicKey, machineId]);

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
          <p className="text-center">Please connect your wallet to continue</p>
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
      {/* <Toaster 
        position="top-right" 
        expand={true} 
        richColors 
        closeButton
        toastOptions={{
          style: { background: 'white' }
        }}
      /> */}
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