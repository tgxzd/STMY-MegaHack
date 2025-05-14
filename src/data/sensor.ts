export interface Sensor {
  plantID: string;
  plantName: string;
  nodeID: string;
  temperature: number;
  humidity: number;
  image: string;
  timestamp: string;
}

export interface TimeData {
  timestamp: string;
  temperature: number;
  humidity: number;
}

export const timeData: TimeData[] = [
  {
    timestamp: "2024-05-13T08:00:00Z",
    temperature: 24.5,
    humidity: 78
  },
  {
    timestamp: "2024-05-13T08:10:00Z",
    temperature: 24.7,
    humidity: 79
  },
  {
    timestamp: "2024-05-13T08:20:00Z",
    temperature: 25.1,
    humidity: 77
  },
  {
    timestamp: "2024-05-13T08:30:00Z",
    temperature: 25.4,
    humidity: 76
  },
  {
    timestamp: "2024-05-13T08:40:00Z",
    temperature: 25.0,
    humidity: 78
  },
  {
    timestamp: "2024-05-13T08:50:00Z",
    temperature: 24.8,
    humidity: 80
  },
  {
    timestamp: "2024-05-13T09:00:00Z",
    temperature: 24.6,
    humidity: 81
  }
];

// data
export const sensorData: Sensor = {
  plantID: "PLANT-001",
  plantName: "Tomato Plant",
  nodeID: "NODE-001",
  temperature: 70.5,
  humidity: 78,
  image: "/images/pokok/plant2.jpg",
  timestamp: "2024-05-13T08:00:00Z"
};
