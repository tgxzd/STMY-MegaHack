'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { timeData } from '@/data/sensor';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface SensorGraphProps {
  temperature: number;
  humidity: number;
  plantName: string;
}

export function SensorGraph({ temperature, humidity, plantName }: SensorGraphProps) {
  const commonOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'white'
        }
      }
    },
    scales: {
      y: {
        ticks: { color: 'white' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      x: {
        ticks: { color: 'white' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    }
  };

  // Format timestamps for display
  const timeLabels = timeData.map(data => {
    const date = new Date(data.timestamp);
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  });

  const temperatureData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Temperature (°C)',
        data: [temperature, temperature-0.2, temperature+0.3, temperature+0.1, temperature-0.5, temperature+0.2, temperature],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      }
    ],
  };

  const humidityData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Humidity (%)',
        data: [humidity, humidity+1, humidity-2, humidity-1, humidity+2, humidity+1, humidity],
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      }
    ],
  };

  const temperatureOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: true,
        text: `${plantName} - Temperature`,
        color: 'white'
      }
    }
  };

  const humidityOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: true,
        text: `${plantName} - Humidity`,
        color: 'white'
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-black p-4 rounded-lg">
        <Line options={temperatureOptions} data={temperatureData} />
      </div>
      <div className="bg-black p-4 rounded-lg">
        <Line options={humidityOptions} data={humidityData} />
      </div>
    </div>
  );
} 