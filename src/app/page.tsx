"use client";

import { SlidingText } from "@/components/ui/sliding-text";
import { useWallet } from '@solana/wallet-adapter-react';

export default function Home() {
  const { connected } = useWallet();

  return (
    <main className="min-h-screen">
      <div className="relative min-h-screen flex flex-col items-center justify-center">
        {/* Content */}
        <div className="relative z-10 text-center px-4 -mt-40">
          <h1 className="text-7xl font-extrabold mb-8 tracking-tighter text-emerald-500">
            AgroX
          </h1>
          <div className="text-2xl font-light max-w-2xl mx-auto tracking-wide text-emerald-700">
            <SlidingText 
              texts={["Grow Crops", "Share Data", "Earn Rewards"]}
              duration={3000}
            />
          </div>
          {connected && (
            <div className="mt-8 text-emerald-600">
              Welcome to AgroX! Your wallet is connected.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
