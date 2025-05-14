'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { sensorData, timeData } from '@/data/sensor';

export default function DatasetPage() {
  const [selectedMetric, setSelectedMetric] = useState<'temperature' | 'humidity'>('temperature');
  
  // Calculate averages from timeData
  const averageTemp = timeData.reduce((sum, data) => sum + data.temperature, 0) / timeData.length;
  const averageHumidity = timeData.reduce((sum, data) => sum + data.humidity, 0) / timeData.length;
  
  // Find min and max values
  const tempValues = timeData.map(data => data.temperature);
  const humidityValues = timeData.map(data => data.humidity);
  
  const minTemp = Math.min(...tempValues);
  const maxTemp = Math.max(...tempValues);
  const minHumidity = Math.min(...humidityValues);
  const maxHumidity = Math.max(...humidityValues);
  
  return (
    <main className="min-h-screen pt-40 md:pt-48">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 md:mt-16">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Environmental Dataset</h1>
          <Link 
            href="/"
            className="inline-flex items-center px-4 py-2 bg-black/40 hover:bg-black/60 text-emerald-400 hover:text-emerald-300 rounded-lg border border-emerald-500/30 transition-all duration-200 shadow-md"
          >
            Back to Dashboard
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-black/80 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-xl p-6">
            <div className="text-white/70 text-sm mb-2">Total Plants</div>
            <div className="text-emerald-400 text-3xl font-bold">1</div>
          </div>
          
          <div className="bg-black/80 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-xl p-6">
            <div className="text-white/70 text-sm mb-2">Avg. Temperature</div>
            <div className="text-emerald-400 text-3xl font-bold">{averageTemp.toFixed(1)}°C</div>
          </div>
          
          <div className="bg-black/80 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-xl p-6">
            <div className="text-white/70 text-sm mb-2">Avg. Humidity</div>
            <div className="text-emerald-400 text-3xl font-bold">{averageHumidity.toFixed(1)}%</div>
          </div>
          
          <div className="bg-black/80 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-xl p-6">
            <div className="text-white/70 text-sm mb-2">Data Points</div>
            <div className="text-emerald-400 text-3xl font-bold">{timeData.length}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-medium text-white">Data Trends</h2>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setSelectedMetric('temperature')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    selectedMetric === 'temperature' 
                      ? 'bg-emerald-500/70 text-white' 
                      : 'bg-black/50 text-white/70 hover:bg-black/70'
                  }`}
                >
                  Temperature
                </button>
                <button 
                  onClick={() => setSelectedMetric('humidity')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    selectedMetric === 'humidity' 
                      ? 'bg-emerald-500/70 text-white' 
                      : 'bg-black/50 text-white/70 hover:bg-black/70'
                  }`}
                >
                  Humidity
                </button>
              </div>
            </div>
            
            <div className="h-64 relative">
              {/* Simple visual representation of data */}
              <div className="absolute inset-0 flex items-end">
                {timeData.map((data, index) => {
                  const value = selectedMetric === 'temperature' ? data.temperature : data.humidity;
                  const max = selectedMetric === 'temperature' ? maxTemp : maxHumidity;
                  const min = selectedMetric === 'temperature' ? minTemp : minHumidity;
                  const range = max - min;
                  const heightPercentage = range === 0 ? 50 : ((value - min) / range) * 80;
                  
                  return (
                    <div 
                      key={index} 
                      className="flex-1 flex justify-center items-end mx-1"
                      title={`${new Date(data.timestamp).toLocaleString()}: ${value}${selectedMetric === 'temperature' ? '°C' : '%'}`}
                    >
                      <div 
                        className="w-full bg-emerald-500/70 hover:bg-emerald-500 cursor-pointer transition-all rounded-t-sm"
                        style={{ height: `${heightPercentage}%` }}
                      ></div>
                    </div>
                  );
                })}
              </div>
              
              {/* Y-axis labels */}
              <div className="absolute left-0 inset-y-0 flex flex-col justify-between text-xs text-white/50 pr-2">
                <span>{selectedMetric === 'temperature' ? `${maxTemp}°C` : `${maxHumidity}%`}</span>
                <span>{selectedMetric === 'temperature' ? 
                  `${((maxTemp + minTemp) / 2).toFixed(1)}°C` : 
                  `${((maxHumidity + minHumidity) / 2).toFixed(1)}%`}
                </span>
                <span>{selectedMetric === 'temperature' ? `${minTemp}°C` : `${minHumidity}%`}</span>
              </div>
            </div>
            
            <div className="flex justify-between mt-2 text-xs text-white/50">
              {timeData.map((data, index) => (
                <div key={index} className="text-center w-full">
                  {index === 0 || index === timeData.length - 1 ? 
                    new Date(data.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                    ''}
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-black/80 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-xl p-6">
            <h2 className="text-xl font-medium text-white mb-4">Active Plants</h2>
            
            <div className="space-y-4">
              <Link 
                href={`/plant-data/${sensorData.plantID}`}
                className="block bg-black/40 hover:bg-black/60 p-4 rounded-lg border border-white/10 transition-all hover:border-emerald-500/30 group"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-md overflow-hidden relative mr-4 border border-white/10">
                    <Image
                      src={sensorData.image}
                      alt={sensorData.plantName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-white font-medium group-hover:text-emerald-300 transition-colors">{sensorData.plantName}</h3>
                    <p className="text-white/50 text-sm">ID: {sensorData.plantID}</p>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <div className="text-emerald-400 text-sm">{sensorData.temperature}°F</div>
                    <div className="text-emerald-400/70 text-sm">{sensorData.humidity}%</div>
                  </div>
                </div>
              </Link>
              
              <div className="text-center py-8">
                <button
                  onClick={() => alert('Feature coming soon!')}
                  className="px-4 py-2 bg-emerald-500/30 text-emerald-300 border border-emerald-400 hover:bg-emerald-500/50 rounded-lg transition-all duration-200"
                >
                  Add New Plant
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-black/80 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-xl p-6 mb-8">
          <h2 className="text-xl font-medium text-white mb-6">Data Records</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-white">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/70">Timestamp</th>
                  <th className="text-left py-3 px-4 text-white/70">Plant ID</th>
                  <th className="text-left py-3 px-4 text-white/70">Plant Name</th>
                  <th className="text-left py-3 px-4 text-white/70">Temperature</th>
                  <th className="text-left py-3 px-4 text-white/70">Humidity</th>
                  <th className="text-left py-3 px-4 text-white/70">Node ID</th>
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
                    <td className="py-3 px-4">{sensorData.plantID}</td>
                    <td className="py-3 px-4">{sensorData.plantName}</td>
                    <td className="py-3 px-4 text-emerald-400">{data.temperature}°C</td>
                    <td className="py-3 px-4 text-emerald-400">{data.humidity}%</td>
                    <td className="py-3 px-4">{sensorData.nodeID}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-black/80 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-xl p-6 mb-8">
          <h2 className="text-xl font-medium text-white mb-6">System Status</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/40 rounded-lg border border-emerald-500/30 p-4">
              <h3 className="text-white font-medium mb-3">Storage Usage</h3>
              <div className="h-3 bg-black/50 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '34%' }}></div>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/50">3.4 GB used</span>
                <span className="text-white/50">10 GB total</span>
              </div>
            </div>
            
            <div className="bg-black/40 rounded-lg border border-emerald-500/30 p-4">
              <h3 className="text-white font-medium mb-3">System Uptime</h3>
              <div className="flex justify-between items-center">
                <div className="text-emerald-400 text-2xl font-bold">99.8%</div>
                <div className="text-white/50 text-sm">Last 30 days</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
