import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Inter } from 'next/font/google';
import Navbar from '@/components/navbar';
import "./globals.css";
import { WalletProvider } from "@/components/wallet-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "AgroX",
  description: "Grow Crops, Share Data, Earn Rewards",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.className} antialiased min-h-screen bg-emerald-50`}
        style={{
          backgroundImage: 'url("/images/back-wallpaper.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        <WalletProvider>
          <Navbar />
          {children}
          <Toaster />
        </WalletProvider>
      </body>
    </html>
  );
}
