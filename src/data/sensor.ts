export interface Sensor {
  plantID: string;
  plantName: string;
  nodeID: string;
  temperature: number;
  humidity: number;
  image: string;
  timestamp: string;
}

export const sensorsData: Sensor[] = [
  {
    plantID: "PLANT-001",
    plantName: "Tomato Plant",
    nodeID: "NODE-001",
    temperature: 24.5,
    humidity: 78,
    image: "/images/plants/tomato.jpg",
    timestamp: "2024-05-13T08:30:00Z"
  },
  {
    plantID: "PLANT-002",
    plantName: "Basil Herb",
    nodeID: "NODE-001",
    temperature: 23.8,
    humidity: 82,
    image: "/images/plants/basil.jpg",
    timestamp: "2024-05-13T08:32:00Z"
  },
  {
    plantID: "PLANT-003",
    plantName: "Strawberry",
    nodeID: "NODE-002",
    temperature: 22.7,
    humidity: 75,
    image: "/images/plants/strawberry.jpg",
    timestamp: "2024-05-13T08:35:00Z"
  },
  {
    plantID: "PLANT-004",
    plantName: "Lettuce",
    nodeID: "NODE-002",
    temperature: 21.9,
    humidity: 80,
    image: "/images/plants/lettuce.jpg",
    timestamp: "2024-05-13T08:38:00Z"
  },
  {
    plantID: "PLANT-005",
    plantName: "Pepper Plant",
    nodeID: "NODE-003",
    temperature: 25.2,
    humidity: 72,
    image: "/images/plants/pepper.jpg",
    timestamp: "2024-05-13T08:40:00Z"
  },
  {
    plantID: "PLANT-006",
    plantName: "Cucumber",
    nodeID: "NODE-003",
    temperature: 24.1,
    humidity: 79,
    image: "/images/plants/cucumber.jpg",
    timestamp: "2024-05-13T08:42:00Z"
  },
  {
    plantID: "PLANT-007",
    plantName: "Mint",
    nodeID: "NODE-004",
    temperature: 22.5,
    humidity: 83,
    image: "/images/plants/mint.jpg",
    timestamp: "2024-05-13T08:45:00Z"
  },
  {
    plantID: "PLANT-008",
    plantName: "Spinach",
    nodeID: "NODE-004",
    temperature: 21.8,
    humidity: 85,
    image: "/images/plants/spinach.jpg",
    timestamp: "2024-05-13T08:48:00Z"
  },
  {
    plantID: "PLANT-009",
    plantName: "Rosemary",
    nodeID: "NODE-005",
    temperature: 26.3,
    humidity: 68,
    image: "/images/plants/rosemary.jpg",
    timestamp: "2024-05-13T08:50:00Z"
  },
  {
    plantID: "PLANT-010",
    plantName: "Cherry Tomato",
    nodeID: "NODE-005",
    temperature: 25.7,
    humidity: 73,
    image: "/images/plants/cherry-tomato.jpg",
    timestamp: "2024-05-13T08:52:00Z"
  }
];
