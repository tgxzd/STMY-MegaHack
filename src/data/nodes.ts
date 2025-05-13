export interface Node {
  nodeID: string;
  nodeName: string;
  status: 'connected' | 'disconnected';
  uptime: number;
  usage: number;
  reward: number;
  activationDate: string;
  totalDataTransmitted: string;
}

export const nodesData: Node[] = [
  {
    nodeID: "NODE-001",
    nodeName: "Alpha Node",
    status: "connected",
    uptime: 4,
    usage: 3,
    reward: 35,
    activationDate: "2024-01-15",
    totalDataTransmitted: "0.8MB"
  },
  {
    nodeID: "NODE-002",
    nodeName: "Beta Node",
    status: "disconnected",
    uptime: 0,
    usage: 0,
    reward: 0,
    activationDate: "2024-02-01",
    totalDataTransmitted: "0MB"
  },
  {
    nodeID: "NODE-003",
    nodeName: "Gamma Node",
    status: "connected",
    uptime: 6,
    usage: 5,
    reward: 48,
    activationDate: "2024-01-20",
    totalDataTransmitted: "1.2MB"
  },
  {
    nodeID: "NODE-004",
    nodeName: "Delta Node",
    status: "connected",
    uptime: 3,
    usage: 4,
    reward: 42,
    activationDate: "2024-02-10",
    totalDataTransmitted: "0.9MB"
  },
  {
    nodeID: "NODE-005",
    nodeName: "Epsilon Node",
    status: "disconnected",
    uptime: 0,
    usage: 0,
    reward: 0,
    activationDate: "2024-02-15",
    totalDataTransmitted: "0MB"
  }
]; 