'use client';

import { useState, useEffect } from 'react';
import { Node, nodesData } from '@/data/nodes';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { NodeStatsCard } from '@/components/ui/NodeStatsCard';

export default function NodeDetailPage() {
  const params = useParams();
  const nodeId = params.id as string;
  const [node, setNode] = useState<Node | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Find the node by ID
    const foundNode = nodesData.find(n => n.nodeID === nodeId);
    setNode(foundNode || null);
    setLoading(false);
  }, [nodeId]);

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
            <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
              node.status === 'connected' 
                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400' 
                : 'bg-red-500/30 text-red-300 border border-red-400'
            }`}>
              <span className={`w-2 h-2 rounded-full mr-1.5 ${
                node.status === 'connected' ? 'bg-emerald-300' : 'bg-red-300'
              }`}></span>
              {node.status}
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
          
            <div className="bg-black/50 rounded-lg border border-white/10 p-6">
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
        </div>
      </div>
    </main>
  );
} 