"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, sendAndConfirmTransaction } from "@solana/web3.js";

export function RequestAirdrop(){
    const {connection} = useConnection();
    const {publicKey} = useWallet();

    const getAirdrop = async ()=> {
        if(!publicKey){
            alert("Please connect your wallet first");
            return;
        }
        try {
            const signature = await connection.requestAirdrop(
                publicKey,
               1 * LAMPORTS_PER_SOL
            );
            await connection.confirmTransaction(signature, "confirmed");
            alert("Airdropped 1 SOL to " + publicKey.toBase58());
        }
        catch(error){
            alert("Airdrop failed! You might be rate-limited.");
            console.error(error);
        }
    };

    return (
    <div className="flex flex-col items-center gap-2">
      <h2 className="text-2xl font-bold">Get Free SOL</h2>
      <button
        onClick={getAirdrop}
        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
      >
        Request Airdrop
      </button>
    </div>
  );
}
