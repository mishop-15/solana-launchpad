"use client"
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountIdempotentInstruction } from "@solana/spl-token";
import { useState } from "react";

export function Airdrop(){
    const { connection } = useConnection();
    const wallet  = useWallet();

    const [recipients, setRecipients] = useState("");
    const [amount, setAmount] = useState("");
    const [tokenMintAddress, setTokenMintAddress] = useState("");
    const [status, setStatus] = useState("");

    const sendAirdrop = async() => {
        if(!wallet.publicKey){
            alert("Connect Wallet first!");
        }

        setStatus("Starting Airdrop process");
        try {
            const recipientList = recipients.split(",").map(addr => addr.trim()).filter(addr => addr!="");

            if (recipientList.length === 0) {
                alert("No valid addresses found");
                return;
            }

            const mint = new PublicKey(tokenMintAddress);
            const amountPerUser = BigInt(parseFloat(amount)* 1000000000);    //9 decimal
            const batchSize = 5;

            for(let i =0; i<recipientList.length;i++){
                const batch = recipientList.slice(i, i+batchSize);
                const transaction = new Transaction();
                
                setStatus(`Processing Batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(recipientList.length/batchSize)}`);
                for(const recipientAddr of batch){
                    try{
                        new PublicKey(recipientAddr);
                    }
                    catch(e){
                        console.warn(`Invalid address skipped: ${recipientAddr}`);
                        continue;
                    }
                    const toPubkey = new PublicKey(recipientAddr)
                    const toATA = await getAssociatedTokenAddress(mint,toPubkey,false,TOKEN_PROGRAM_ID,ASSOCIATED_TOKEN_PROGRAM_ID);
                    transaction.add(
                        createAssociatedTokenAccountIdempotentInstruction(
                            wallet.publicKey!, 
                            toATA,            
                            toPubkey,         
                            mint
                        )
                    )
                    transaction.add(
                        createTransferInstruction(
                            await getAssociatedTokenAddress(mint, wallet.publicKey!),
                            toATA,
                            wallet.publicKey!,
                            amountPerUser
                        )
                    );
                }
                if (transaction.instructions.length > 0) {
                    const signature = await wallet.sendTransaction(transaction, connection);
                    await connection.confirmTransaction(signature, "confirmed");
                    //console.log(`Batch confirmed: ${signature}`);
                }
            }
                setStatus("Airdrop Complete! All tokens sent");
            alert("Airdrop Successful!");
        }
        catch (error) {
            console.error("Airdrop failed:", error);
            setStatus("failed! Check console for details");
            alert("Error occurred. See console.");
        }
    };
    return (
        <div className="w-full max-w-md bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-2xl mt-8 mb-10">
            <h2 className="text-3xl font-bold mb-4 text-white text-center tracking-wide">
                Bulk Airdrop Tool
            </h2>
            <div className="flex flex-col gap-4">
                <p className="text-gray-400 text-sm text-center">
                    Send tokens to multiple users in one go.
                </p>
                
                <input 
                    className="w-full bg-slate-900 text-white p-4 rounded-lg border border-slate-600 outline-none focus:border-purple-500 transition-colors" 
                    placeholder="Token Mint Address (e.g. 7Xw...)" 
                    value={tokenMintAddress}
                    onChange={(e) => setTokenMintAddress(e.target.value)}
                />
                
                <textarea 
                    className="w-full bg-slate-900 text-white p-4 rounded-lg border border-slate-600 outline-none h-32 focus:border-purple-500 transition-colors" 
                    placeholder="Paste Addresses here (comma separated):&#10;7Xw...abc,&#10;9Yx...xyz" 
                    value={recipients}
                    onChange={(e) => setRecipients(e.target.value)}
                />
                
                <input 
                    className="w-full bg-slate-900 text-white p-4 rounded-lg border border-slate-600 outline-none focus:border-purple-500 transition-colors" 
                    placeholder="Amount per person" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />

                <button 
                    onClick={sendAirdrop}
                    className="mt-2 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg transition-all transform active:scale-95"
                >
                    Start Airdrop
                </button>
                
                {status && <div className="text-center font-mono text-sm mt-2 p-2 bg-slate-900 rounded text-yellow-400 border border-slate-700">{status}</div>}
            </div>
        </div>
    );
}