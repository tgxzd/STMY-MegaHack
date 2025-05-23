import { Connection, Keypair, Transaction, VersionedTransaction } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import bs58 from 'bs58';

// Function to create a keypair from a base58 private key string
export const createKeypairFromPrivateKey = (privateKeyBase58: string): Keypair => {
  try {
    // Decode base58 private key to Uint8Array
    const privateKeyUint8 = bs58.decode(privateKeyBase58);
    return Keypair.fromSecretKey(privateKeyUint8);
  } catch (error) {
    console.error('Error creating keypair:', error);
    throw error;
  }
};

// Create connection
export const getConnection = () => {
  return new Connection(
    process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com',
    'confirmed'
  );
};

// Create AnchorProvider with private key
export const getProviderWithPrivateKey = (privateKeyBase58: string) => {
  const connection = getConnection();
  const keypair = createKeypairFromPrivateKey(privateKeyBase58);
  
  return new anchor.AnchorProvider(
    connection,
    {
      publicKey: keypair.publicKey,
      signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => {
        if (tx instanceof Transaction) {
          tx.sign(keypair);
        } else if (tx instanceof VersionedTransaction) {
          tx.sign([keypair]);
        }
        return tx;
      },
      signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => {
        txs.forEach(tx => {
          if (tx instanceof Transaction) {
            tx.sign(keypair);
          } else if (tx instanceof VersionedTransaction) {
            tx.sign([keypair]);
          }
        });
        return txs;
      }
    },
    { commitment: 'confirmed' }
  );
}; 