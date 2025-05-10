"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { cn } from "@/lib/utils";

interface WalletConnectButtonProps {
  className?: string;
}

export function WalletConnectButton({ className }: WalletConnectButtonProps) {
  const { connected, disconnect, wallet, publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  const handleClick = () => {
    if (connected) {
      disconnect();
    } else {
      setVisible(true);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        onClick={handleClick}
        className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-full px-6 py-2.5 shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2"
      >
        {connected ? (
          <>
            <span className="text-emerald-100">{formatAddress(publicKey?.toBase58() || '')}</span>
            <span className="text-emerald-200">|</span>
            <span>Disconnect</span>
          </>
        ) : (
          "Connect Wallet"
        )}
      </button>
    </div>
  );
} 