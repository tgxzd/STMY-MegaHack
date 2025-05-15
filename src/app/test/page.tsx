'use client';
import { useEffect, useState } from 'react';
import * as anchor from '@coral-xyz/anchor';
import { Idl, Program } from '@coral-xyz/anchor';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { toast } from 'sonner';
import idl from '@/contract/idl.json';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// Define a type for error objects
interface ErrorWithMessage {
  message?: string;
}

// Add type information for the Agrox Program
type AgroxProgram = Program<Idl>;

const TestPage = () => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [program, setProgram] = useState<AgroxProgram | null>(null);
  const [systemStatePubkey, setSystemStatePubkey] = useState<PublicKey | null>(null);
  
  // State variables for various functions
  const [plantName, setPlantName] = useState('');
  const [machineId, setMachineId] = useState('');
  const [temperature, setTemperature] = useState('25.0');
  const [humidity, setHumidity] = useState('60.0');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedPlant, setSelectedPlant] = useState<PublicKey | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<PublicKey | null>(null);
  const [selectedData, setSelectedData] = useState<PublicKey | null>(null);
  
  // Lists for created entities
  const [plants, setPlants] = useState<{pubkey: PublicKey, name: string}[]>([]);
  const [machines, setMachines] = useState<{pubkey: PublicKey, id: string}[]>([]);
  const [dataEntries, setDataEntries] = useState<{pubkey: PublicKey, temp: string, humidity: string}[]>([]);

  // Initialize program when wallet connects
  useEffect(() => {
    if (!wallet || !connection) return;
    
    try {
      // Create provider and program
      const provider = new anchor.AnchorProvider(
        connection,
        wallet,
        { commitment: 'confirmed' }
      );
      
      const programId = new PublicKey(idl.address);
      const program = new anchor.Program(idl, provider);
      setProgram(program as AgroxProgram);
      
      // Calculate system state pubkey
      // In a real application, you'd retrieve this from somewhere or use a known seed
      const systemStateKeypair = Keypair.generate(); 
      setSystemStatePubkey(systemStateKeypair.publicKey);
      
      console.log('Program initialized with ID:', programId.toString());
    } catch (error) {
      console.error('Error initializing program:', error);
      toast.error('Failed to initialize program');
    }
  }, [wallet, connection]);

  // Helper function to extract error message
  const getErrorMessage = (error: unknown): string => {
    if (typeof error === 'string') return error;
    const typedError = error as ErrorWithMessage;
    return typedError.message || 'Unknown error';
  };

  // 1. Initialize System
  const handleInitialize = async () => {
    if (!program || !wallet || !systemStatePubkey) {
      toast.error('Program not initialized or wallet not connected');
      return;
    }

    try {
      const systemStateKeypair = Keypair.generate(); 
      setSystemStatePubkey(systemStateKeypair.publicKey);
      
      const tx = await program.methods
        .initialize()
        .accounts({
          systemState: systemStateKeypair.publicKey,
          authority: wallet.publicKey,
          systemProgram: SystemProgram.programId
        })
        .signers([systemStateKeypair])
        .rpc();
      
      toast.success('System initialized successfully');
      console.log('Transaction signature:', tx);
    } catch (error) {
      console.error('Error initializing system:', error);
      toast.error(`Initialization failed: ${getErrorMessage(error)}`);
    }
  };

  // 2. Create Plant
  const handleCreatePlant = async () => {
    if (!program || !wallet || !systemStatePubkey || !plantName) {
      toast.error('Missing required information');
      return;
    }

    try {
      const plantKeypair = Keypair.generate();
      
      const tx = await program.methods
        .createPlant(plantName)
        .accounts({
          systemState: systemStatePubkey,
          plant: plantKeypair.publicKey,
          user: wallet.publicKey,
          systemProgram: SystemProgram.programId
        })
        .signers([plantKeypair])
        .rpc();
      
      setPlants([...plants, {pubkey: plantKeypair.publicKey, name: plantName}]);
      setPlantName('');
      toast.success('Plant created successfully');
      console.log('Transaction signature:', tx);
    } catch (error) {
      console.error('Error creating plant:', error);
      toast.error(`Create plant failed: ${getErrorMessage(error)}`);
    }
  };

  // 3. Register Machine
  const handleRegisterMachine = async () => {
    if (!program || !wallet || !systemStatePubkey || !machineId) {
      toast.error('Missing required information');
      return;
    }

    try {
      const machineKeypair = Keypair.generate();
      
      const tx = await program.methods
        .registerMachine(machineId)
        .accounts({
          systemState: systemStatePubkey,
          machine: machineKeypair.publicKey,
          user: wallet.publicKey,
          systemProgram: SystemProgram.programId
        })
        .signers([machineKeypair])
        .rpc();
      
      setMachines([...machines, {pubkey: machineKeypair.publicKey, id: machineId}]);
      setMachineId('');
      toast.success('Machine registered successfully');
      console.log('Transaction signature:', tx);
    } catch (error) {
      console.error('Error registering machine:', error);
      toast.error(`Register machine failed: ${getErrorMessage(error)}`);
    }
  };

  // 4. Start Machine
  const handleStartMachine = async () => {
    if (!program || !wallet || !selectedMachine) {
      toast.error('No machine selected');
      return;
    }

    try {
      const tx = await program.methods
        .startMachine()
        .accounts({
          machine: selectedMachine,
          user: wallet.publicKey
        })
        .rpc();
      
      toast.success('Machine started successfully');
      console.log('Transaction signature:', tx);
    } catch (error) {
      console.error('Error starting machine:', error);
      toast.error(`Start machine failed: ${getErrorMessage(error)}`);
    }
  };

  // 5. Stop Machine
  const handleStopMachine = async () => {
    if (!program || !wallet || !selectedMachine) {
      toast.error('No machine selected');
      return;
    }

    try {
      const tx = await program.methods
        .stopMachine()
        .accounts({
          machine: selectedMachine,
          user: wallet.publicKey
        })
        .rpc();
      
      toast.success('Machine stopped successfully');
      console.log('Transaction signature:', tx);
    } catch (error) {
      console.error('Error stopping machine:', error);
      toast.error(`Stop machine failed: ${getErrorMessage(error)}`);
    }
  };

  // 6. Generate Machine Auth
  const handleGenerateMachineAuth = async () => {
    if (!program || !wallet || !selectedMachine || !machineId) {
      toast.error('Missing required information');
      return;
    }

    try {
      // Calculate auth PDA
      const [authPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('machine-auth'), Buffer.from(machineId)],
        program.programId
      );
      
      const tx = await program.methods
        .generateMachineAuth(machineId)
        .accounts({
          machine: selectedMachine,
          user: wallet.publicKey,
          authPda,
          systemProgram: SystemProgram.programId
        })
        .rpc();
      
      toast.success('Machine auth generated successfully');
      console.log('Transaction signature:', tx);
    } catch (error) {
      console.error('Error generating machine auth:', error);
      toast.error(`Generate machine auth failed: ${getErrorMessage(error)}`);
    }
  };

  // 7. Upload Data
  const handleUploadData = async () => {
    if (!program || !wallet || !selectedMachine || !selectedPlant || !temperature || !humidity) {
      toast.error('Missing required information');
      return;
    }

    try {
      const dataKeypair = Keypair.generate();
      
      // Calculate auth PDA for the selected machine
      const machine = selectedMachine && machines.find(m => m.pubkey.equals(selectedMachine));
      if (!machine) {
        toast.error('Machine information not found');
        return;
      }
      
      const [authPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('machine-auth'), Buffer.from(machine.id)],
        program.programId
      );
      
      const imageUrlOption = imageUrl ? imageUrl : null;
      
      const tx = await program.methods
        .uploadData(
          parseFloat(temperature), 
          parseFloat(humidity), 
          imageUrlOption
        )
        .accounts({
          systemState: systemStatePubkey,
          machine: selectedMachine,
          plant: selectedPlant,
          data: dataKeypair.publicKey,
          authPda,
          payer: wallet.publicKey,
          systemProgram: SystemProgram.programId
        })
        .signers([dataKeypair])
        .rpc();
      
      setDataEntries([...dataEntries, {
        pubkey: dataKeypair.publicKey, 
        temp: temperature,
        humidity: humidity
      }]);
      
      toast.success('Data uploaded successfully');
      console.log('Transaction signature:', tx);
    } catch (error) {
      console.error('Error uploading data:', error);
      toast.error(`Upload data failed: ${getErrorMessage(error)}`);
    }
  };

  // 8. Use Data
  const handleUseData = async () => {
    if (!program || !wallet || !selectedMachine || !selectedData || !systemStatePubkey) {
      toast.error('Missing required information');
      return;
    }

    try {
      const tx = await program.methods
        .useData()
        .accounts({
          systemState: systemStatePubkey,
          machine: selectedMachine,
          data: selectedData,
          user: wallet.publicKey
        })
        .rpc();
      
      toast.success('Data used successfully');
      console.log('Transaction signature:', tx);
    } catch (error) {
      console.error('Error using data:', error);
      toast.error(`Use data failed: ${getErrorMessage(error)}`);
    }
  };

  // 9. Claim Rewards
  const handleClaimRewards = async () => {
    if (!program || !wallet || !selectedMachine) {
      toast.error('No machine selected');
      return;
    }

    try {
      const tx = await program.methods
        .claimRewards()
        .accounts({
          machine: selectedMachine,
          user: wallet.publicKey
        })
        .rpc();
      
      toast.success('Rewards claimed successfully');
      console.log('Transaction signature:', tx);
    } catch (error) {
      console.error('Error claiming rewards:', error);
      toast.error(`Claim rewards failed: ${getErrorMessage(error)}`);
    }
  };

  // Wallet Connection Check
  if (!wallet) {
    return (
      <div className="container mx-auto p-8 text-center">
        <Card>
          <CardHeader>
            <CardTitle>Wallet Not Connected</CardTitle>
            <CardDescription>
              Please connect your wallet to test the smart contract functions.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-6">AgroX Contract Test Interface</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Initialize the system or view current state</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>System State Address</Label>
              <p className="text-sm font-mono bg-muted p-2 rounded-md overflow-auto">
                {systemStatePubkey ? systemStatePubkey.toString() : 'Not initialized'}
              </p>
            </div>
            <div>
              <Label>Connected Wallet</Label>
              <p className="text-sm font-mono bg-muted p-2 rounded-md overflow-auto">
                {wallet.publicKey.toString()}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleInitialize}>Initialize System</Button>
        </CardFooter>
      </Card>

      <Tabs defaultValue="create" className="space-y-4">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="create">Create & Register</TabsTrigger>
          <TabsTrigger value="manage">Manage</TabsTrigger>
          <TabsTrigger value="data">Data & Rewards</TabsTrigger>
        </TabsList>
        
        {/* Create & Register Tab */}
        <TabsContent value="create" className="space-y-6">
          {/* Create Plant */}
          <Card>
            <CardHeader>
              <CardTitle>Create Plant</CardTitle>
              <CardDescription>Register a new plant in the system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="plantName">Plant Name</Label>
                <Input 
                  id="plantName" 
                  value={plantName} 
                  onChange={(e) => setPlantName(e.target.value)} 
                  placeholder="Enter plant name" 
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleCreatePlant}>Create Plant</Button>
            </CardFooter>
          </Card>
          
          {/* Register Machine */}
          <Card>
            <CardHeader>
              <CardTitle>Register Machine</CardTitle>
              <CardDescription>Register a new IoT machine</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="machineId">Machine ID</Label>
                <Input 
                  id="machineId" 
                  value={machineId} 
                  onChange={(e) => setMachineId(e.target.value)} 
                  placeholder="Enter unique machine ID" 
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleRegisterMachine}>Register Machine</Button>
            </CardFooter>
          </Card>
          
          {/* Display Created Plants and Machines */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Plants</CardTitle>
                <CardDescription>Created plants</CardDescription>
              </CardHeader>
              <CardContent>
                {plants.length > 0 ? (
                  <ul className="space-y-2">
                    {plants.map((plant, index) => (
                      <li key={index} className="p-2 border rounded-md">
                        <p className="font-semibold">{plant.name}</p>
                        <p className="text-xs font-mono truncate">{plant.pubkey.toString()}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No plants created yet</p>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Machines</CardTitle>
                <CardDescription>Registered machines</CardDescription>
              </CardHeader>
              <CardContent>
                {machines.length > 0 ? (
                  <ul className="space-y-2">
                    {machines.map((machine, index) => (
                      <li key={index} className="p-2 border rounded-md">
                        <p className="font-semibold">{machine.id}</p>
                        <p className="text-xs font-mono truncate">{machine.pubkey.toString()}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No machines registered yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Manage Tab */}
        <TabsContent value="manage" className="space-y-6">
          {/* Machine Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Machine</CardTitle>
              <CardDescription>Choose a machine to manage</CardDescription>
            </CardHeader>
            <CardContent>
              {machines.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {machines.map((machine, index) => (
                    <Button 
                      key={index}
                      variant={selectedMachine?.equals(machine.pubkey) ? "default" : "outline"}
                      onClick={() => setSelectedMachine(machine.pubkey)}
                      className="justify-start h-auto py-2"
                    >
                      <div className="text-left">
                        <p className="font-semibold">{machine.id}</p>
                        <p className="text-xs truncate">{machine.pubkey.toString().substring(0, 16)}...</p>
                      </div>
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No machines registered yet</p>
              )}
            </CardContent>
          </Card>
          
          {/* Machine Control */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Machine Control</CardTitle>
                <CardDescription>Start or stop the selected machine</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-4">
                  <Button 
                    onClick={handleStartMachine}
                    disabled={!selectedMachine}
                    className="flex-1"
                  >
                    Start Machine
                  </Button>
                  <Button 
                    onClick={handleStopMachine}
                    disabled={!selectedMachine}
                    variant="destructive"
                    className="flex-1"
                  >
                    Stop Machine
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Machine Authentication</CardTitle>
                <CardDescription>Generate auth for the selected machine</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="authMachineId">Machine ID</Label>
                  <Input 
                    id="authMachineId" 
                    value={machineId} 
                    onChange={(e) => setMachineId(e.target.value)} 
                    placeholder="Enter machine ID for auth" 
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleGenerateMachineAuth}
                  disabled={!selectedMachine || !machineId}
                >
                  Generate Auth
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        {/* Data & Rewards Tab */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Data</CardTitle>
              <CardDescription>Upload IoT data from a machine to a plant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Machine and Plant Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Select Machine</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {machines.map((machine, index) => (
                      <Button 
                        key={index}
                        variant={selectedMachine?.equals(machine.pubkey) ? "default" : "outline"}
                        onClick={() => setSelectedMachine(machine.pubkey)}
                        className="justify-start h-auto py-2"
                      >
                        <div className="text-left">
                          <p className="font-semibold">{machine.id}</p>
                          <p className="text-xs truncate">{machine.pubkey.toString().substring(0, 8)}...</p>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label>Select Plant</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {plants.map((plant, index) => (
                      <Button 
                        key={index}
                        variant={selectedPlant?.equals(plant.pubkey) ? "default" : "outline"}
                        onClick={() => setSelectedPlant(plant.pubkey)}
                        className="justify-start h-auto py-2"
                      >
                        <div className="text-left">
                          <p className="font-semibold">{plant.name}</p>
                          <p className="text-xs truncate">{plant.pubkey.toString().substring(0, 8)}...</p>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              
              <Separator className="my-2" />
              
              {/* Data Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="temperature">Temperature (°C)</Label>
                  <Input 
                    id="temperature" 
                    type="number"
                    value={temperature} 
                    onChange={(e) => setTemperature(e.target.value)} 
                    placeholder="e.g. 25.5" 
                  />
                </div>
                <div>
                  <Label htmlFor="humidity">Humidity (%)</Label>
                  <Input 
                    id="humidity" 
                    type="number"
                    value={humidity} 
                    onChange={(e) => setHumidity(e.target.value)} 
                    placeholder="e.g. 60.5" 
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                <Input 
                  id="imageUrl" 
                  value={imageUrl} 
                  onChange={(e) => setImageUrl(e.target.value)} 
                  placeholder="https://example.com/image.jpg" 
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleUploadData}
                disabled={!selectedMachine || !selectedPlant || !temperature || !humidity}
              >
                Upload Data
              </Button>
            </CardFooter>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Use Data</CardTitle>
                <CardDescription>Select data to use</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Label>Select Data Entry</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {dataEntries.length > 0 ? (
                      dataEntries.map((data, index) => (
                        <div 
                          key={index}
                          className={`p-2 border rounded-md cursor-pointer ${
                            selectedData?.equals(data.pubkey) ? 'bg-primary/10 border-primary' : ''
                          }`}
                          onClick={() => setSelectedData(data.pubkey)}
                        >
                          <p className="text-sm">Temp: {data.temp}°C, Humidity: {data.humidity}%</p>
                          <p className="text-xs font-mono truncate">{data.pubkey.toString().substring(0, 16)}...</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No data entries available</p>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleUseData}
                  disabled={!selectedData || !selectedMachine}
                >
                  Use Selected Data
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Claim Rewards</CardTitle>
                <CardDescription>Claim rewards from a machine</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Label>Select Machine to Claim From</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {machines.map((machine, index) => (
                      <Button 
                        key={index}
                        variant={selectedMachine?.equals(machine.pubkey) ? "default" : "outline"}
                        onClick={() => setSelectedMachine(machine.pubkey)}
                        className="justify-start h-auto py-2"
                      >
                        <div className="text-left">
                          <p className="font-semibold">{machine.id}</p>
                          <p className="text-xs truncate">{machine.pubkey.toString().substring(0, 16)}...</p>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleClaimRewards}
                  disabled={!selectedMachine}
                >
                  Claim Rewards
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TestPage;
