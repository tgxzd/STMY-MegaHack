'use client';

import { useState, useEffect } from 'react';
import { sensorsData } from '@/data/sensor';
import { PlantGraph } from '@/components/ui/PlantGraph';

export default function Dashboard() {
  // Get the first plant's data
  const selectedPlant = sensorsData[0];

  return (
    <main className="min-h-screen pt-16 md:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Environmental Monitoring</h1>
          <p className="text-white/70">Real-time tracking of plant growth conditions</p>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <div className="p-4">
            <h2 className="text-xl font-semibold text-white mb-4">
              {selectedPlant.plantName} - Node {selectedPlant.nodeID}
            </h2>
            <PlantGraph 
              temperature={selectedPlant.temperature}
              humidity={selectedPlant.humidity}
              plantName={selectedPlant.plantName}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
