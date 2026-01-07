"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useEffect, useState } from "react";

export function ShowBalance(){
    const {connection} = useConnection();
    const {publicKey} = useWallet();
    const [balance, setBalance] = useState<number>(0);

    useEffect(() => {
    if (!connection || !publicKey) {
      return;
    }
    connection.onAccountChange(
    publicKey,
      (updatedAccountInfo) => {
        setBalance(updatedAccountInfo.lamports / LAMPORTS_PER_SOL);
      },
    "confirmed"
    );
    connection.getBalance(publicKey).then((info) => {
      setBalance(info / LAMPORTS_PER_SOL);
    });
  }, [connection, publicKey]); 
    return (
    <div className="flex flex-col items-center">
      <p className="text-xl font-bold text-slate-200">
        Balance: {publicKey ? balance : 0} SOL
      </p>
    </div>
  );
}