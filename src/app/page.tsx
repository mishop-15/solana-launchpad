"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { RequestAirdrop } from "./components/RequestAirdrop"; 
import { ShowBalance } from "./components/ShowBalance";
import { SendTokens } from "./components/SendTokens";
import { TokenLaunchpad } from "./components/TokenLaunchpad";
import { Airdrop } from "./components/Airdrop";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-4">
      <div className="border hover:border-slate-900 rounded">
        <WalletMultiButton style={{}} />
      </div>
      <ShowBalance />
      <RequestAirdrop />
      <SendTokens />

      <TokenLaunchpad />

      <Airdrop />
      
    </main>
  );
}