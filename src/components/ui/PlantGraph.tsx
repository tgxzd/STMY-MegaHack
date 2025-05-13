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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PlantGraphProps {
  temperature: number;
  humidity: number;
  plantName: string;
}

export function PlantGraph({ temperature, humidity, plantName }: PlantGraphProps) {
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

  const temperatureData = {
    labels: ['Current'],
    datasets: [
      {
        label: 'Temperature (°C)',
        data: [temperature],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      }
    ],
  };

  const humidityData = {
    labels: ['Current'],
    datasets: [
      {
        label: 'Humidity (%)',
        data: [humidity],
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
      <div className="bg-black/50 p-4 rounded-lg">
        <Line options={temperatureOptions} data={temperatureData} />
      </div>
      <div className="bg-black/50 p-4 rounded-lg">
        <Line options={humidityOptions} data={humidityData} />
      </div>
    </div>
  );
} 