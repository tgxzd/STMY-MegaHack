'use client';

import { useState, useEffect } from 'react';
import AddNodeForm from '@/components/AddNodeForm';
import { Node, nodesData } from '@/data/nodes';
import Link from 'next/link';

export default function NodePage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [nodes, setNodes] = useState<Node[]>([]);

  useEffect(() => {
    // Load initial node data
    setNodes(nodesData);
  }, []);

  const handleAddNode = (nodeName: string) => {
    
    console.log('Adding new node:', nodeName);
   
    const newNode: Node = {
      nodeID: `NODE-${String(nodes.length + 1).padStart(3, '0')}`,
      nodeName: nodeName,
      status: 'connected',
      uptime: 0,
      usage: 0,
      reward: 0,
      activationDate: new Date().toISOString().split('T')[0],
      totalDataTransmitted: "0MB"
    };
    setNodes([...nodes, newNode]);
  };

  return (
    <main className="min-h-screen pt-16 md:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8 mt-25">
          
          <button 
            onClick={() => setIsFormOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Node
          </button>
        </div>
        
        {/* Node table */}
        <div className="bg-black/80 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-xl">
          {/* Table header */}
          <div className="grid grid-cols-5 bg-black/90 px-6 py-4 border-b border-white/10">
            <div className="font-medium text-white/90 text-sm">Node Name</div>
            <div className="font-medium text-white/90 text-sm text-center">Status</div>
            <div className="font-medium text-white/90 text-sm text-center">Today&apos;s Uptime</div>
            <div className="font-medium text-white/90 text-sm text-center">Today&apos;s Usage</div>
            <div className="font-medium text-white/90 text-sm text-center">Today&apos;s Rewards</div>
          </div>
          
          {/* Table body */}
          <div className="divide-y divide-white/5">
            {nodes.map((node) => (
              <Link 
                href={`/node-page/${node.nodeID}`}
                key={node.nodeID}
                className="grid grid-cols-5 px-6 py-4 hover:bg-black/50 transition-colors block cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-white">{node.nodeName}</span>
                  <span className="text-xs text-white/50">ID: {node.nodeID}</span>
                </div>
                
                <div className="flex justify-center items-center">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    node.status === 'connected' 
                      ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400' 
                      : 'bg-red-500/30 text-red-300 border border-red-400'
                  }`}>
                    <span className={`w-2 h-2 rounded-full mr-1.5 ${
                      node.status === 'connected' ? 'bg-emerald-300' : 'bg-red-300'
                    }`}></span>
                    {node.status}
                  </span>
                </div>
                
                <div className="text-center flex flex-col justify-center items-center">
                  <span className="text-white font-medium">{node.uptime}</span>
                  <span className="text-xs text-white/50">hours</span>
                </div>
                
                <div className="flex items-center justify-center">
                  <span className="text-white font-medium">{node.usage}</span>
                </div>
                
                <div className="text-center flex items-center justify-center">
                  <span className="text-white font-medium">{node.reward}</span>
                  <span className="text-white/50 text-sm ml-1">Pts</span>
                </div>
              </Link>
            ))}
            
            {nodes.length === 0 && (
              <div className="px-6 py-12 text-center">
                <p className="text-white/50">No nodes available. Add your first node to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddNodeForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddNode}
      />
    </main>
  );
}
