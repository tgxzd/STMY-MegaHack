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
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import IDL from '@/app/contract-2/idl.json';

// Form schema for initialization
const initFormSchema = z.object({
  machineId: z.string().min(1, "Machine ID is required"),
});

// Add these types
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

const TestPage = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const [program, setProgram] = useState<anchor.Program | null>(null);
  const [allMachineData, setAllMachineData] = useState<{ [key: string]: SensorData }>({});
  
  // Form
  const initForm = useForm<z.infer<typeof initFormSchema>>({
    resolver: zodResolver(initFormSchema),
    defaultValues: {
      machineId: '',
    },
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

  const fetchAllMachines = async () => {
    if (!program || !publicKey) return;

    try {
      const accounts = await connection.getProgramAccounts(program.programId);
      const machinesData: { [key: string]: SensorData } = {};

      for (const { account } of accounts) {
        try {
          const accountData = program.coder.accounts.decode(
            'sensorData',
            account.data
          );

          machinesData[accountData.machineId] = {
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
          };
        } catch (error) {
          console.error("Error decoding account:", error);
        }
      }

      setAllMachineData(machinesData);
    } catch (error) {
      console.error("Error fetching machines:", error);
    }
  };

  useEffect(() => {
    if (program && publicKey) {
      fetchAllMachines();
    }
  }, [program, publicKey]);

  const initializeSensorData = async (machineId: string) => {
    if (!program || !publicKey) return;

    try {
      const [sensorPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("machine"), Buffer.from(machineId)],
        program.programId
      );

      await program.methods
        .initialize(machineId)
        .accounts({
          sensorData: sensorPDA,
          user: publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Initialized sensor data for machine:", machineId);
    } catch (error) {
      console.error("Error initializing sensor data:", error);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sensor Data Management</h1>
        {publicKey && (
          <div className="text-sm text-gray-600">
            Connected with: {publicKey.toString()}
          </div>
        )}
      </div>

      {publicKey ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-24">
          {/* Initialize Sensor Data */}
          <Card className="md:col-span-2 max-w-md mx-auto w-full">
            <CardHeader className="text-center">
              <CardTitle>Initialize Sensor</CardTitle>
              <CardDescription>Create a new sensor data account</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...initForm}>
                <form onSubmit={initForm.handleSubmit(async (values) => {
                  await initializeSensorData(values.machineId);
                  fetchAllMachines(); // Refresh the list after initialization
                })} className="space-y-4">
                  <FormField
                    control={initForm.control}
                    name="machineId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Machine ID</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Initialize</Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Display all machines */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>All Machines</CardTitle>
              <CardDescription>Click on a machine to view detailed information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(allMachineData).map(([machineId, data]) => (
                  <a 
                    href={`/test-4/${machineId}`} 
                    key={machineId} 
                    className="block transition-transform hover:scale-105"
                  >
                    <Card className="h-full">
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-lg">Machine {machineId}</CardTitle>
                            <CardDescription>Total Readings: {data.totalReadings}</CardDescription>
                          </div>
                          <div className={`w-3 h-3 rounded-full ${data.isOn ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {data.readings.length > 0 && (
                            <div className="bg-secondary p-2 rounded">
                              <p className="text-sm">Latest Reading:</p>
                              <p className="text-sm">Temp: {data.readings[data.readings.length - 1].temperatureC}°C</p>
                              <p className="text-sm">Humidity: {data.readings[data.readings.length - 1].humidity}%</p>
                            </div>
                          )}
                          {data.imageData.length > 0 && (
                            <div>
                              <p className="text-sm mb-1">Latest Image:</p>
                              <img
                                src={data.imageData[data.imageData.length - 1].imageUri}
                                alt={`Latest sensor image`}
                                className="w-full h-32 object-cover rounded"
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            <p className="text-center">Please connect your wallet to continue</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TestPage;
