'use client'

import { useEffect, useState } from 'react'

const TestPage = () => {
  const [sensorData, setSensorData] = useState<{
    humidity: number;
    temperature_c: number;
    temperature_f: number;
    timestamp: number;
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [apiUrl, setApiUrl] = useState('http://192.168.1.174:8000')

  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/sensor`)
        if (!response.ok) {
          throw new Error('Failed to fetch sensor data')
        }
        const data = await response.json()
        setSensorData(data)
      } catch (error) {
        console.error('Error fetching sensor data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSensorData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchSensorData, 30000)
    
    return () => clearInterval(interval)
  }, [apiUrl])

  // Add function to update API URL
  const updateApiUrl = (newUrl: string) => {
    setApiUrl(newUrl)
    setIsLoading(true)
  }

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading sensor data...</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Sensor Monitoring Dashboard</h1>
      
      <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
        <h3 className="text-lg font-medium mb-2">Connection Settings</h3>
        <div className="flex items-center">
          <input 
            type="text" 
            value={apiUrl} 
            onChange={(e) => setApiUrl(e.target.value)}
            className="border rounded-l px-3 py-2 w-full"
            placeholder="Raspberry Pi IP address (e.g. http://192.168.1.100:8000)"
          />
          <button 
            onClick={() => updateApiUrl(apiUrl)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r"
          >
            Connect
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Latest Image</h2>
          <div className="border rounded-lg overflow-hidden h-64 flex items-center justify-center">
            <img 
              src={`${apiUrl}/api/images/latest`} 
              alt="Latest captured image" 
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Sensor Readings</h2>
          {sensorData ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Humidity</p>
                <p className="text-2xl font-bold">{sensorData.humidity}%</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Temperature (C)</p>
                <p className="text-2xl font-bold">{sensorData.temperature_c}°C</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Temperature (F)</p>
                <p className="text-2xl font-bold">{sensorData.temperature_f}°F</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Timestamp</p>
                <p className="text-sm font-medium">
                  {new Date(sensorData.timestamp * 1000).toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-red-500">Failed to load sensor data</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default TestPage
