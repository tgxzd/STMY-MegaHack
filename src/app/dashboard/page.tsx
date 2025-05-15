'use client';

// import { useState, useEffect } from 'react';
import { sensorData } from '@/data/sensor';
import { SensorGraph } from '@/components/ui/SensorGraph';
import Image from 'next/image';

export default function Dashboard() {
  return (
    <main className="min-h-screen pt-16 md:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 gap-6">
          <div className="p-4 mt-8">
            <SensorGraph 
              temperature={sensorData.temperature}
              humidity={sensorData.humidity}
              plantName={sensorData.plantName}
            />
            
            <div className="mt-12 bg-gradient-to-b from-gray-900/50 to-black/30 p-6 rounded-2xl border border-gray-800">
              <div className="flex items-center justify-center mb-6">
                
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {['Day 1', 'Day 2', 'Day 3', 'Day 4'].map((day, index) => (
                  <div key={index} className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600/20 to-emerald-500/30 rounded-xl blur opacity-40 group-hover:opacity-70 transition duration-300"></div>
                    <div className="bg-gradient-to-br from-gray-900 to-black p-3 rounded-xl shadow-xl backdrop-blur-sm border border-gray-800 relative">
                      <div className="absolute top-3 right-3 bg-black/60 text-emerald-400 px-2 py-1 rounded-full text-xs font-medium z-30">{day}</div>
                      <div className="relative overflow-hidden rounded-lg transform transition-all duration-500 group-hover:scale-[1.02]">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                        <Image 
                          src={sensorData.image}
                          alt={`${sensorData.plantName} - ${day}`}
                          width={300}
                          height={200}
                          style={{ objectFit: 'cover', width: '100%', height: 'auto' }}
                          className="rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
