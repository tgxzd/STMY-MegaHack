export interface Node {
  nodeID: string;
  nodeName: string;
  status: 'connected' | 'disconnected' | 'active' | 'inactive';
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
  
]; 