"use client"

import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { MINT_SIZE, TOKEN_PROGRAM_ID, createInitializeMint2Instruction, createMintToInstruction, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, getMinimumBalanceForRentExemptMint } from "@solana/spl-token";
import { useState } from "react";

export function TokenLaunchpad(){
    const {connection} = useConnection();
    const {publicKey: walletPublicKey, sendTransaction} = useWallet();

    // const [name, setName] = useState("");
    // const [symbol, setSymbol] = useState("");
    // const [imageUrl, setImageUrl] = useState("");
    const [supply, setSupply] = useState("");

    const createToken = async()=>{
        if(!walletPublicKey){
            alert("Connect Wallet first")
            return;
        }
        try {
            const mintKeypair = Keypair.generate(); // generating id for token 
            const lamports = await getMinimumBalanceForRentExemptMint(connection);  //rent to pay for this token

            const transaction = new Transaction().add(
                SystemProgram.createAccount({                   //creating a account for the token                   
                    fromPubkey: walletPublicKey,
                    newAccountPubkey: mintKeypair.publicKey,
                    space: MINT_SIZE,
                    lamports,
                    programId: TOKEN_PROGRAM_ID, 
                }),
                createInitializeMint2Instruction(               //instructions to mint the tokens and giving mint authority and freezing authority to the wallet owner
                    mintKeypair.publicKey,
                    9,
                    walletPublicKey,
                    walletPublicKey,
                    TOKEN_PROGRAM_ID
                ),
                createAssociatedTokenAccountInstruction(            //creating ATA for the user to hold this specific token
                    walletPublicKey,
                    await getAssociatedTokenAddress(mintKeypair.publicKey, walletPublicKey),
                    walletPublicKey,
                    mintKeypair.publicKey
                ),
                createMintToInstruction(                            //minting instructions and them in the associated token address wallet 
                    mintKeypair.publicKey,
                    await getAssociatedTokenAddress(mintKeypair.publicKey, walletPublicKey),
                    walletPublicKey,
                    BigInt(parseFloat(supply) * 1000000000)
                )
            ) ;
            const signature = await sendTransaction(transaction, connection, { signers: [mintKeypair] });
        await connection.confirmTransaction(signature, "confirmed");
        }
        catch(error){
            console.error("Minting failed:", error);
            alert("Transaction Failed. Check console for details.");
        }
    }
    return (
        <div className="w-full max-w-md bg-slate-900 p-6 rounded-xl border border-slate-700 shadow-xl">
            <h2 className="text-2xl font-semibold mb-6 text-white text-center">Solana Token Creator</h2>
            
            <div className="flex flex-col gap-4">
                <div>
                    <label className="text-sm text-slate-400 mb-1 block">Token Name</label>
                    <input 
                        className="w-full bg-slate-800 text-white p-3 rounded border border-slate-600 focus:border-blue-500 focus:outline-none" 
                        placeholder="e.g. Venture Capital Token" 
                        onChange={(e) => setName(e.target.value)} 
                    />
                </div>

                <div>
                    <label className="text-sm text-slate-400 mb-1 block">Symbol</label>
                    <input 
                        className="w-full bg-slate-800 text-white p-3 rounded border border-slate-600 focus:border-blue-500 focus:outline-none" 
                        placeholder="e.g. VCT" 
                        onChange={(e) => setSymbol(e.target.value)} 
                    />
                </div>

                <div>
                    <label className="text-sm text-slate-400 mb-1 block">Image URL</label>
                    <input 
                        className="w-full bg-slate-800 text-white p-3 rounded border border-slate-600 focus:border-blue-500 focus:outline-none" 
                        placeholder="https://..." 
                        onChange={(e) => setImageUrl(e.target.value)} 
                    />
                </div>

                <div>
                    <label className="text-sm text-slate-400 mb-1 block">Initial Supply</label>
                    <input 
                        className="w-full bg-slate-800 text-white p-3 rounded border border-slate-600 focus:border-blue-500 focus:outline-none" 
                        placeholder="e.g. 1,000,000" 
                        onChange={(e) => setSupply(e.target.value)} 
                    />
                </div>

                <button 
                    onClick={createToken} 
                    className="mt-4 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded transition-all transform hover:scale-[1.02]"
                >
                    Create Token Asset
                </button>
            </div>
        </div>
    );
}