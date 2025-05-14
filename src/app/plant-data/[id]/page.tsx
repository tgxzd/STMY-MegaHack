'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { sensorData, timeData } from '@/data/sensor';
import Image from 'next/image';

export default function PlantDataPage() {
  const params = useParams();
  const router = useRouter();
  const plantId = params.id as string;
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // In a real app, you would fetch data here
    // For now we'll just simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [plantId]);
  
  if (loading) {
    return (
      <main className="min-h-screen pt-40 md:pt-48">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        </div>
      </main>
    );
  }
  
  // Check if the plant exists (in a real app, check against fetched data)
  if (plantId !== sensorData.plantID) {
    return (
      <main className="min-h-screen pt-40 md:pt-48">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-black/80 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-xl p-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Plant Not Found</h1>
            <p className="text-white/70 mb-6">The plant with ID {plantId} does not exist.</p>
            <button 
              onClick={() => router.back()} 
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg transition-all duration-200 shadow-md"
            >
              Go Back
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-40 md:pt-48">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 bg-black/40 hover:bg-black/60 text-emerald-400 hover:text-emerald-300 rounded-lg border border-emerald-500/30 transition-all duration-200 group shadow-md"
          >
            <svg 
              className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform duration-200" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>
        
        <div className="bg-black/80 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-xl p-8">
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="md:w-1/3 relative h-64 md:h-auto overflow-hidden rounded-xl border border-white/10">
              <Image 
                src={sensorData.image} 
                alt={sensorData.plantName}
                fill
                className="object-cover"
              />
            </div>
            
            <div className="md:w-2/3">
              <h1 className="text-2xl font-bold text-white mb-2">{sensorData.plantName}</h1>
              <p className="text-white/50 mb-4">ID: {sensorData.plantID}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-black/50 rounded-lg border border-white/10 p-4">
                  <div className="text-white/70 text-sm mb-1">Current Temperature</div>
                  <div className="text-emerald-400 text-2xl font-bold">{sensorData.temperature}°F</div>
                </div>
                
                <div className="bg-black/50 rounded-lg border border-white/10 p-4">
                  <div className="text-white/70 text-sm mb-1">Current Humidity</div>
                  <div className="text-emerald-400 text-2xl font-bold">{sensorData.humidity}%</div>
                </div>
              </div>
              
              <div className="bg-black/50 rounded-lg border border-white/10 p-4">
                <div className="text-white/70 text-sm mb-1">Connected Node</div>
                <div className="text-white font-medium">{sensorData.nodeID}</div>
                <div className="text-white/50 text-xs mt-1">Last Updated: {new Date(sensorData.timestamp).toLocaleString()}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-black/50 rounded-lg border border-white/10 p-6 mb-6">
            <h2 className="text-lg font-medium text-white mb-6">Historical Data</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-white/70">Timestamp</th>
                    <th className="text-left py-3 px-4 text-white/70">Temperature</th>
                    <th className="text-left py-3 px-4 text-white/70">Humidity</th>
                  </tr>
                </thead>
                <tbody>
                  {timeData.map((data, index) => (
                    <tr 
                      key={index} 
                      className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                        index % 2 === 0 ? 'bg-black/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">{new Date(data.timestamp).toLocaleString()}</td>
                      <td className="py-3 px-4 text-emerald-400">{data.temperature}°C</td>
                      <td className="py-3 px-4 text-emerald-400">{data.humidity}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="bg-black/50 rounded-lg border border-white/10 p-6">
            <h2 className="text-lg font-medium text-white mb-6">Plant Health Indicators</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-black/40 rounded-lg border border-emerald-500/30 p-4">
                <div className="text-white/70 text-sm mb-2">Growth Rate</div>
                <div className="h-3 bg-black/50 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '75%' }}></div>
                </div>
                <div className="text-emerald-400 text-right text-sm mt-1">75%</div>
              </div>
              
              <div className="bg-black/40 rounded-lg border border-emerald-500/30 p-4">
                <div className="text-white/70 text-sm mb-2">Nutrient Levels</div>
                <div className="h-3 bg-black/50 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '60%' }}></div>
                </div>
                <div className="text-emerald-400 text-right text-sm mt-1">60%</div>
              </div>
              
              <div className="bg-black/40 rounded-lg border border-emerald-500/30 p-4">
                <div className="text-white/70 text-sm mb-2">Water Content</div>
                <div className="h-3 bg-black/50 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <div className="text-emerald-400 text-right text-sm mt-1">85%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 