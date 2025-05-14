'use client';

import { useState, useEffect } from 'react';
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
            
            <div className="mt-8 flex justify-center">
              <div className="bg-gradient-to-br from-black to-gray-800 p-3 rounded-xl max-w-xs shadow-xl border border-gray-700">
                <div className="relative overflow-hidden rounded-lg transform transition-transform duration-300 hover:scale-105">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"></div>
                  <Image 
                    src={sensorData.image}
                    alt={sensorData.plantName}
                    width={300}
                    height={200}
                    style={{ objectFit: 'cover', width: '100%', height: 'auto' }}
                    className="rounded-lg"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
                    
                    <div className="flex items-center mt-1 text-xs text-gray-300">

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
