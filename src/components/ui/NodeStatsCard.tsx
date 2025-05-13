'use client';

import { useState, useEffect } from 'react';

type StatType = 'uptime' | 'usage';

interface NodeStatsCardProps {
  type: StatType;
  currentValue: number;
  maxValue?: number;
  title: string;
  unit?: string;
}

export function NodeStatsCard({ 
  type, 
  currentValue, 
  maxValue = 24, 
  title, 
  unit = '' 
}: NodeStatsCardProps) {
  // Generate simple historical data for the graph
  const [historicalData, setHistoricalData] = useState<number[]>([]);
  
  useEffect(() => {
    // Only generate data for uptime type
    if (type === 'uptime') {
      // For uptime, create a linear progression to the current value
      setHistoricalData([0, currentValue/4, currentValue/2, currentValue*3/4, currentValue]);
    }
  }, [currentValue, type]);

  // Calculate percentage for the current value
  const percentage = Math.min(100, Math.round((currentValue / maxValue) * 100));
  
  // Determine color based on type
  const primaryColor = type === 'uptime' ? '#10b981' : '#0ea5e9';
  const gradientClass = type === 'uptime' 
    ? 'from-emerald-500 to-emerald-300' 
    : 'from-blue-500 to-cyan-300';

  // For usage type, show a compact card
  if (type === 'usage') {
    return (
      <div className="bg-black/50 rounded-lg border border-white/10 backdrop-blur-sm py-6 px-5 h-[120px] flex items-center">
        <div className="flex flex-col items-center text-center w-full justify-center">
          <h3 className="text-base font-medium text-white/80 mb-1">{title}</h3>
          <span className="text-3xl font-bold text-white">{currentValue}</span>
        </div>
      </div>
    );
  }

  // For uptime type, show full card with graph
  return (
    <div className="bg-black/50 rounded-lg border border-white/10 p-6 overflow-hidden backdrop-blur-sm">
      <h3 className="text-lg font-medium text-white mb-4">{title}</h3>
      
      {/* Current value display */}
      <div className="mb-6">
        <div className="flex items-end mb-1">
          <span className="text-3xl font-bold text-white">{currentValue}</span>
          {unit && <span className="text-white/70 ml-1 pb-1">{unit}</span>}
        </div>
        
        {/* Progress bar */}
        <div className="h-3 w-full bg-black/60 rounded-full overflow-hidden shadow-inner">
          <div 
            className={`h-full rounded-full bg-gradient-to-r ${gradientClass}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
      
      {/* Simple graph with scale */}
      <div className="flex items-stretch">
        {/* Scale values */}
        <div className="flex flex-col justify-between pr-2 text-right text-xs text-white/50 py-1">
          <div>{maxValue}{unit && <span className="ml-0.5">{unit}</span>}</div>
          <div>{maxValue / 2}{unit && <span className="ml-0.5">{unit}</span>}</div>
          <div>0</div>
        </div>
        
        {/* Simple graph */}
        <div className="h-24 relative flex-grow">
          {/* Background grid - simplified */}
          <div className="absolute inset-0 border-b border-l border-white/10">
            <div className="absolute top-1/2 w-full border-t border-white/10"></div>
          </div>
          
          {/* Data visualization */}
          <div className="absolute inset-0 flex items-end">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              {/* Line */}
              <polyline
                points={historicalData.map((value, i) => 
                  `${(i / (historicalData.length - 1)) * 100},${100 - (value / maxValue) * 100}`
                ).join(' ')}
                fill="none"
                stroke={primaryColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Simple dots */}
              {historicalData.map((value, i) => (
                <circle
                  key={i}
                  cx={`${(i / (historicalData.length - 1)) * 100}`}
                  cy={`${100 - (value / maxValue) * 100}`}
                  r="3"
                  fill={primaryColor}
                />
              ))}
            </svg>
          </div>
        </div>
      </div>
      
      {/* Time indicators */}
      <div className="text-xs text-white/50 mt-2 flex justify-between pl-8">
        <span>Earlier</span>
        <span>Now</span>
      </div>
    </div>
  );
} 