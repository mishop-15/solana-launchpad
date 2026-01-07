"use client"

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { useState } from "react";

export function SendTokens(){
    const {connection} = useConnection();
    const {publicKey, sendTransaction} = useWallet();
    const [toAddress, setToAddress] = useState("");
    const [amount, setAmount] = useState("");

    const sendSol = async()=>{
        if(!publicKey){
            alert("Connect Wallet First");
            return;
        }
        try {
            const transaction = new Transaction();
        const recipientPublicKey = new PublicKey(toAddress);

            transaction.add(
                SystemProgram.transfer({
                    fromPubkey:publicKey,
                    toPubkey: recipientPublicKey,
                    lamports: parseFloat(amount) * LAMPORTS_PER_SOL,
                })
            );
            const signature = await sendTransaction(transaction, connection);
            await connection.confirmTransaction(signature, "confirmed");
            alert(`Sent ${amount} SOL to ${toAddress}`);
        }
        catch (error) {
        console.error("Transaction failed", error);
      alert("Transaction failed! Check console.");
    }
    }
    return (
    <div className="flex flex-col gap-2 w-full max-w-md">
      <h2 className="text-2xl font-bold text-center">Send SOL</h2>
      <input 
        type="text" 
        placeholder="Recipient Address" 
        className="text-black p-2 rounded"
        onChange={(e) => setToAddress(e.target.value)}
      />
      <input 
        type="text" 
        placeholder="Amount" 
        className="text-black p-2 rounded"
        onChange={(e) => setAmount(e.target.value)}
      />
      <button 
        onClick={sendSol} 
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
      >
        Send SOL
      </button>
    </div>
  );
}