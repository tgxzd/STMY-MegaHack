'use client'

import { useAgroXContract } from '@/hooks/useAgroXContract';

export default function Test3Page() {
  const {
    cluster,
    // machines,
    plants,
    // iotData,
    userMachines,
    isLoadingMachines,
    isLoadingPlants,
    isLoadingData,
    // isClaimingRewards,
    sensorData,
    latestImage
  } = useAgroXContract();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AgroX Dashboard</h1>
      
      {/* Display loading states */}
      {(isLoadingMachines || isLoadingPlants || isLoadingData) && (
        <div className="mb-4">
          <p>Loading data...</p>
        </div>
      )}

      {/* Display cluster info */}
      {cluster && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Cluster Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p>Total Machines: {cluster.machineCount.toString()}</p>
              <p>Total Plants: {cluster.plantCount.toString()}</p>
            </div>
            <div>
              <p>Total Data Uploads: {cluster.totalDataUploads.toString()}</p>
              <p>Data Requests: {cluster.dataRequestCount.toString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Display user's machines */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Your Machines</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userMachines.map((machine) => (
            <div key={machine.publicKey.toString()} className="p-4 bg-white rounded-lg shadow">
              <h3 className="font-medium">Machine ID: {machine.machineId}</h3>
              <p>Status: {machine.isActive ? 'Active' : 'Inactive'}</p>
              <p>Data Count: {machine.dataCount.toString()}</p>
              <p>Image Count: {machine.imageCount.toString()}</p>
              <p>Rewards Earned: {machine.rewardsEarned.toString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Display plants */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Plants</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plants.map((plant) => (
            <div key={plant.publicKey.toString()} className="p-4 bg-white rounded-lg shadow">
              <h3 className="font-medium">Plant: {plant.plantName}</h3>
              <p>Data Count: {plant.dataCount.toString()}</p>
              <p>Image Count: {plant.imageCount.toString()}</p>
              <p>Created: {new Date(plant.creationTimestamp.toNumber() * 1000).toLocaleDateString()}</p>
              <p>Last Update: {new Date(plant.lastUpdateTimestamp.toNumber() * 1000).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Display latest sensor data */}
      {sensorData && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Latest Sensor Data</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p>Temperature (C): {sensorData.temperature_c}°C</p>
              <p>Temperature (F): {sensorData.temperature_f}°F</p>
            </div>
            <div>
              <p>Humidity: {sensorData.humidity}%</p>
              <p>Timestamp: {new Date(sensorData.timestamp * 1000).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Display latest image */}
      {latestImage && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Latest Image</h2>
          <div className="w-full max-w-md mx-auto">
            <img src={latestImage} alt="Latest plant capture" className="w-full h-auto rounded-lg shadow" />
          </div>
        </div>
      )}
    </div>
  );
}
