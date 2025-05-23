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
import IDL from '@/app/contract-2/idl.json';
import { useParams } from 'next/navigation';

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

      await fetchMachineData();
    } catch (error) {
      console.error("Error turning on machine:", error);
    }
  };

  const turnOffMachine = async () => {
    if (!program || !publicKey) return;

    try {
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

      await fetchMachineData();
    } catch (error) {
      console.error("Error turning off machine:", error);
    }
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
    <div className="container mx-auto p-4 space-y-6">
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
                disabled={machineData.isOn}
              >
                Turn On
              </Button>
              <Button
                onClick={turnOffMachine}
                variant="destructive"
                disabled={!machineData.isOn}
              >
                Turn Off
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sensor Readings</CardTitle>
            <CardDescription>Total Readings: {machineData.totalReadings}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {machineData.readings.map((reading, index) => (
                <div key={index} className="bg-secondary p-3 rounded-lg">
                  <p>Temperature: {reading.temperatureC}°C</p>
                  <p>Humidity: {reading.humidity}%</p>
                  <p>Timestamp: {new Date(reading.timestamp * 1000).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
            <CardDescription>Visual data from the machine</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {machineData.imageData.map((image, index) => (
                <div key={index} className="space-y-2">
                  <img
                    src={image.imageUri}
                    alt={`Sensor image ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <p className="text-sm">
                    Uploaded: {new Date(image.timestamp * 1000).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MachineDetailPage; 