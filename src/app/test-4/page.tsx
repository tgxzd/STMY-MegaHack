'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Connection, PublicKey, clusterApiUrl, Keypair } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
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
import bs58 from 'bs58';

// Contract address from your IDL
// const PROGRAM_ID = new PublicKey("CJ2k7Z7dQZDKmNyiBHqK6zBLCRqcyqA5xHcYUohZgVt4");

// Form schema for sensor data
const sensorFormSchema = z.object({
  machineId: z.string().min(1, "Machine ID is required"),
  temperature: z.number().min(-273.15).max(1000),
  humidity: z.number().min(0).max(100),
});

// Form schema for image data
const imageFormSchema = z.object({
  machineId: z.string().min(1, "Machine ID is required"),
  imageUri: z.string().url("Must be a valid URL"),
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
}

// Add this function to create a keypair from private key
const createKeypairFromPrivateKey = (privateKeyString: string | undefined) => {
  if (!privateKeyString) return null;
  try {
    const decodedKey = bs58.decode(privateKeyString);
    return Keypair.fromSecretKey(decodedKey);
  } catch (error) {
    console.error('Error creating keypair:', error);
    return null;
  }
};

const TestPage = () => {
  const [connection] = useState(new Connection(clusterApiUrl('devnet')));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [program, setProgram] = useState<any>(null);
  const [allMachineData, setAllMachineData] = useState<{ [key: string]: SensorData }>({});
  
  // Create a keypair from the environment variable
  const privateKeySigner = useMemo(() => {
    return createKeypairFromPrivateKey(process.env.NEXT_PUBLIC_PRIVATE_KEY);
  }, []);

  // Forms
  const sensorForm = useForm<z.infer<typeof sensorFormSchema>>({
    resolver: zodResolver(sensorFormSchema),
    defaultValues: {
      machineId: '',
      temperature: 20,
      humidity: 50,
    },
  });

  const imageForm = useForm<z.infer<typeof imageFormSchema>>({
    resolver: zodResolver(imageFormSchema),
    defaultValues: {
      machineId: '',
      imageUri: '',
    },
  });

  useEffect(() => {
    if (privateKeySigner) {
      const wallet = {
        publicKey: privateKeySigner.publicKey,
        signTransaction: async <T extends anchor.web3.Transaction | anchor.web3.VersionedTransaction>(tx: T): Promise<T> => {
          if (tx instanceof anchor.web3.VersionedTransaction) {
            tx.sign([privateKeySigner]);
          } else {
            tx.partialSign(privateKeySigner);
          }
          return tx;
        },
        signAllTransactions: async <T extends anchor.web3.Transaction | anchor.web3.VersionedTransaction>(txs: T[]): Promise<T[]> => {
          return txs.map((tx) => {
            if (tx instanceof anchor.web3.VersionedTransaction) {
              tx.sign([privateKeySigner]);
            } else {
              tx.partialSign(privateKeySigner);
            }
            return tx;
          });
        },
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
  }, [privateKeySigner, connection]);

  const fetchAllMachines = async () => {
    if (!program || !privateKeySigner) return;

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
    if (program && privateKeySigner) {
      fetchAllMachines();
    }
  }, [program, privateKeySigner]);

  const initializeSensorData = async (machineId: string) => {
    if (!program || !privateKeySigner) return;

    try {
      const [sensorPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("machine"), Buffer.from(machineId)],
        program.programId
      );

      await program.methods
        .initialize(machineId)
        .accounts({
          sensorData: sensorPDA,
          user: privateKeySigner.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Initialized sensor data for machine:", machineId);
    } catch (error) {
      console.error("Error initializing sensor data:", error);
    }
  };

  const addSensorData = async (values: z.infer<typeof sensorFormSchema>) => {
    if (!program || !privateKeySigner) {
      console.error('Program or signer not available');
      return;
    }

    try {
      const [sensorPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("machine"), Buffer.from(values.machineId)],
        program.programId
      );

      await program.methods
        .addData(values.temperature, values.humidity)
        .accounts({
          sensorData: sensorPDA,
          user: privateKeySigner.publicKey,
        })
        .signers([privateKeySigner])
        .rpc();

      console.log("Added sensor data:", values);
      await fetchAllMachines();
    } catch (error) {
      console.error("Error adding sensor data:", error);
    }
  };

  const addImageData = async (values: z.infer<typeof imageFormSchema>) => {
    if (!program || !privateKeySigner) {
      console.error('Program or signer not available');
      return;
    }

    try {
      const [sensorPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("machine"), Buffer.from(values.machineId)],
        program.programId
      );

      await program.methods
        .addImage(values.imageUri)
        .accounts({
          sensorData: sensorPDA,
          user: privateKeySigner.publicKey,
        })
        .signers([privateKeySigner])
        .rpc();

      console.log("Added image data:", values);
      await fetchAllMachines();
    } catch (error) {
      console.error("Error adding image data:", error);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sensor Data Management</h1>
        {privateKeySigner && (
          <div className="text-sm text-gray-600">
            Connected with: {privateKeySigner.publicKey.toString()}
          </div>
        )}
      </div>

      {privateKeySigner ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Initialize Sensor Data */}
          <Card>
            <CardHeader>
              <CardTitle>Initialize Sensor</CardTitle>
              <CardDescription>Create a new sensor data account</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...sensorForm}>
                <form onSubmit={sensorForm.handleSubmit(async (values) => {
                  await initializeSensorData(values.machineId);
                  fetchAllMachines(); // Refresh the list after initialization
                })} className="space-y-4">
                  <FormField
                    control={sensorForm.control}
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

          {/* Add Sensor Reading */}
          <Card>
            <CardHeader>
              <CardTitle>Add Sensor Reading</CardTitle>
              <CardDescription>Record new sensor data</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...sensorForm}>
                <form onSubmit={sensorForm.handleSubmit(async (values) => {
                  await addSensorData(values);
                  fetchAllMachines(); // Refresh the list after adding data
                })} className="space-y-4">
                  <FormField
                    control={sensorForm.control}
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
                  <FormField
                    control={sensorForm.control}
                    name="temperature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temperature (°C)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            value={field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={sensorForm.control}
                    name="humidity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Humidity (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            value={field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Add Reading</Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Add Image Data */}
          <Card>
            <CardHeader>
              <CardTitle>Add Image</CardTitle>
              <CardDescription>Upload a new image URI</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...imageForm}>
                <form onSubmit={imageForm.handleSubmit(async (values) => {
                  await addImageData(values);
                  fetchAllMachines(); // Refresh the list after adding image
                })} className="space-y-4">
                  <FormField
                    control={imageForm.control}
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
                  <FormField
                    control={imageForm.control}
                    name="imageUri"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URI</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Add Image</Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Display all machines */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>All Machines</CardTitle>
              <CardDescription>View all machine data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(allMachineData).map(([machineId, data]) => (
                  <div key={machineId} className="border rounded-lg p-4 space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Machine {machineId}</h3>
                      <p>Total Readings: {data.totalReadings}</p>
                    </div>

                    <div>
                      <h4 className="text-md font-semibold mb-2">Sensor Readings</h4>
                      <div className="grid gap-2">
                        {data.readings.map((reading, index) => (
                          <div key={index} className="bg-secondary p-3 rounded-lg">
                            <p>Temperature: {reading.temperatureC}°C</p>
                            <p>Humidity: {reading.humidity}%</p>
                            <p>Timestamp: {new Date(reading.timestamp * 1000).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-md font-semibold mb-2">Images</h4>
                      <div className="grid gap-4 grid-cols-2">
                        {data.imageData.map((image, index) => (
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
                    </div>
                  </div>
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
