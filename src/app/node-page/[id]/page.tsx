'use client';

import { useState, useEffect } from 'react';
import { Node, nodesData } from '@/data/nodes';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { NodeStatsCard } from '@/components/ui/NodeStatsCard';
import { sensorData } from '@/data/sensor';

export default function NodeDetailPage() {
  const params = useParams();
  const nodeId = params.id as string;
  const [node, setNode] = useState<Node | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPlantModal, setShowPlantModal] = useState(false);
  const [plantName, setPlantName] = useState('');

  useEffect(() => {
    // Find the node by ID
    const foundNode = nodesData.find(n => n.nodeID === nodeId);
    setNode(foundNode || null);
    setLoading(false);
  }, [nodeId]);

  const handleStart = () => {
    if (node) {
      setNode({...node, status: 'active'});
    }
  };

  const handleStop = () => {
    if (node) {
      setNode({...node, status: 'inactive'});
    }
  };

  const handleClaimReward = () => {
    if (node) {
      // Here you would handle the reward claiming logic
      console.log(`Claiming reward for node: ${node.nodeName}`);
      alert(`Claimed ${node.reward} Pts reward successfully!`);
    }
  };

  const handleCreatePlant = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would handle the plant creation logic
    console.log(`Creating plant: ${plantName}`);
    // Reset form and close modal
    setPlantName('');
    setShowPlantModal(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen pt-40 md:pt-48">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        </div>
      </main>
    );
  }

  if (!node) {
    return (
      <main className="min-h-screen pt-40 md:pt-48">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-black/80 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-xl p-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Node Not Found</h1>
            <p className="text-white/70 mb-6">The node with ID {nodeId} does not exist.</p>
            <Link href="/node-page" className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg transition-all duration-200 shadow-md">
              Back to Nodes
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-40 md:pt-48">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
        <div className="mb-8">
          <Link 
            href="/node-page" 
            className="inline-flex items-center px-4 py-2 bg-black/40 hover:bg-black/60 text-emerald-400 hover:text-emerald-300 rounded-lg border border-emerald-500/30 transition-all duration-200 group shadow-md"
          >
            <svg 
              className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform duration-200" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Nodes
          </Link>
        </div>
        
        <div className="bg-black/80 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-xl p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">{node.nodeName}</h1>
              <p className="text-white/50">ID: {node.nodeID}</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                node.status === 'connected' || node.status === 'active'
                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400' 
                  : 'bg-red-500/30 text-red-300 border border-red-400'
              }`}>
                <span className={`w-2 h-2 rounded-full mr-1.5 ${
                  node.status === 'connected' || node.status === 'active' ? 'bg-emerald-300' : 'bg-red-300'
                }`}></span>
                {node.status === 'connected' || node.status === 'active' ? 'active' : 'inactive'}
              </div>
              <button
                onClick={handleStart}
                disabled={node.status === 'connected' || node.status === 'active'}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  node.status === 'connected' || node.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300/50 cursor-not-allowed'
                    : 'bg-emerald-500/30 text-emerald-300 border border-emerald-400 hover:bg-emerald-500/50'
                }`}
              >
                Start
              </button>
              <button
                onClick={handleStop}
                disabled={node.status === 'disconnected' || node.status === 'inactive'}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  node.status === 'disconnected' || node.status === 'inactive'
                    ? 'bg-red-500/20 text-red-300/50 cursor-not-allowed'
                    : 'bg-red-500/30 text-red-300 border border-red-400 hover:bg-red-500/50'
                }`}
              >
                Stop
              </button>
              <button
                onClick={handleClaimReward}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-500/30 text-amber-300 border border-amber-400 hover:bg-amber-500/50 transition-all duration-200"
              >
                Claim Reward
              </button>
              <button
                onClick={() => setShowPlantModal(true)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-500/30 text-purple-300 border border-purple-400 hover:bg-purple-500/50 transition-all duration-200"
              >
                Create Plant
              </button>
            </div>
          </div>
          
          {/* Node stats graphs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <NodeStatsCard 
              type="uptime"
              currentValue={node.uptime}
              maxValue={24}
              title="Today's Uptime"
              unit="hours"
            />
            <NodeStatsCard 
              type="usage"
              currentValue={node.usage}
              maxValue={10}
              title="Today's Usage"
              unit="GB"
            />
          </div>
          
          <div className="bg-black/50 rounded-lg border border-white/10 p-6 mb-6">
            <h2 className="text-lg font-medium text-white mb-4">Node Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/70">Activation Date:</span>
                <span className="text-white">{node.activationDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Total Data Transmitted:</span>
                <span className="text-white">{node.totalDataTransmitted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Today's Rewards:</span>
                <span className="text-white">{node.reward} Pts</span>
              </div>
            </div>
          </div>

          <div className="bg-black/50 rounded-lg border border-white/10 p-6 mb-6">
            <h2 className="text-lg font-medium text-white mb-4">Dataset</h2>
            <div className="grid grid-cols-1 gap-4">
              <div 
                onClick={() => window.location.href = `/plant-data/${sensorData.plantID}`} 
                className="bg-black/40 border border-emerald-500/30 rounded-lg p-4 flex flex-col items-center cursor-pointer hover:bg-emerald-900/20 hover:border-emerald-500/50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/20"
              >
                
                <div className="text-white font-medium text-lg">{sensorData.plantName}</div>
                
                <div className="mt-2 bg-emerald-500/20 px-3 py-1 rounded-full text-xs text-emerald-300">View Dataset</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plant Creation Modal */}
      {showPlantModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-black/90 backdrop-blur-md rounded-xl border border-white/10 p-8 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Create New Plant</h3>
            <form onSubmit={handleCreatePlant}>
              <div className="mb-6">
                <label htmlFor="plantName" className="block text-white/70 mb-2">Plant Name</label>
                <input
                  type="text"
                  id="plantName"
                  value={plantName}
                  onChange={(e) => setPlantName(e.target.value)}
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Enter plant name"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPlantModal(false)}
                  className="px-4 py-2 border border-white/20 text-white/70 rounded-lg hover:bg-white/10 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all duration-200"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
} 