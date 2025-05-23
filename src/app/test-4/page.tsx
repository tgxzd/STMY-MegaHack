'use client';

import React, { useState, useEffect } from 'react';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
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
  imageUri: z.string().url("Must be a valid URL"),
});

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

const TestPage = () => {
  const wallet = useAnchorWallet();
  const [connection] = useState(new Connection(clusterApiUrl('devnet')));
  const [program, setProgram] = useState<anchor.Program | null>(null);
 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sensorData, setSensorData] = useState<SensorData | null>(null);

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
      imageUri: '',
    },
  });

  useEffect(() => {
    if (wallet) {
      const provider = new anchor.AnchorProvider(connection, wallet, {});
      const program = new anchor.Program(IDL, provider);
      setProgram(program);
    }
  }, [wallet, connection]);

  const initializeSensorData = async (machineId: string) => {
    if (!program || !wallet) return;

    try {
      const [sensorPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("machine"), Buffer.from(machineId)],
        program.programId
      );

      await program.methods
        .initialize(machineId)
        .accounts({
          sensorData: sensorPDA,
          user: wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Initialized sensor data for machine:", machineId);
    } catch (error) {
      console.error("Error initializing sensor data:", error);
    }
  };

  const addSensorData = async (values: z.infer<typeof sensorFormSchema>) => {
    if (!program || !wallet) return;

    try {
      const [sensorPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("machine"), Buffer.from(values.machineId)],
        program.programId
      );

      await program.methods
        .addData(values.temperature, values.humidity)
        .accounts({
          sensorData: sensorPDA,
          user: wallet.publicKey,
        })
        .rpc();

      console.log("Added sensor data:", values);
    } catch (error) {
      console.error("Error adding sensor data:", error);
    }
  };

  const addImageData = async (values: z.infer<typeof imageFormSchema>) => {
    if (!program || !wallet || !sensorData) return;

    try {
      const [sensorPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("machine"), Buffer.from(sensorData.machineId)],
        program.programId
      );

      await program.methods
        .addImage(values.imageUri)
        .accounts({
          sensorData: sensorPDA,
          user: wallet.publicKey,
        })
        .rpc();

      console.log("Added image data:", values);
    } catch (error) {
      console.error("Error adding image data:", error);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sensor Data Management</h1>
        <WalletMultiButton />
      </div>

      {wallet ? (
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
                <form onSubmit={sensorForm.handleSubmit(addSensorData)} className="space-y-4">
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
                <form onSubmit={imageForm.handleSubmit(addImageData)} className="space-y-4">
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
