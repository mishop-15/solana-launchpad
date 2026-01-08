"use client"

import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { MINT_SIZE, TOKEN_PROGRAM_ID, createInitializeMint2Instruction, createMintToInstruction, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, getMinimumBalanceForRentExemptMint, createSetAuthorityInstruction, AuthorityType } from "@solana/spl-token";
import { useState } from "react";

export function TokenLaunchpad(){
    const {connection} = useConnection();
    const {publicKey: walletPublicKey, sendTransaction} = useWallet();

    const [name, setName] = useState("");
    const [symbol, setSymbol] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [supply, setSupply] = useState("");
    const [revokeMint, setRevokeMint] = useState(false);

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

            if(revokeMint){
                transaction.add(
                    createSetAuthorityInstruction(
                        mintKeypair.publicKey,
                        walletPublicKey,
                        AuthorityType.MintTokens,
                        null
                    )
                );
            }
            const signature = await sendTransaction(transaction, connection, { signers: [mintKeypair] });
        await connection.confirmTransaction(signature, "confirmed");
        }
        catch(error){
            console.error("Minting failed:", error);
            alert("Transaction Failed. Check console for details.");
        }
    }
    return (
        <div className="h-screen flex flex-col justify-center items-center bg-slate-900">
            <div className="w-full max-w-md bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-2xl">
                <h2 className="text-3xl font-bold mb-8 text-white text-center tracking-wide">
                    Solana Token Creator
                </h2>
                <div className="flex flex-col gap-6">
                    <input className="w-full bg-slate-900 text-white p-4 rounded-lg border border-slate-600 outline-none" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
                    <input className="w-full bg-slate-900 text-white p-4 rounded-lg border border-slate-600 outline-none" placeholder="Symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
                    <input className="w-full bg-slate-900 text-white p-4 rounded-lg border border-slate-600 outline-none" placeholder="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                    <input className="w-full bg-slate-900 text-white p-4 rounded-lg border border-slate-600 outline-none" placeholder="Initial Supply" value={supply} onChange={(e) => setSupply(e.target.value)} />
                    
                    {/* New Checkbox UI */}
                    <div className="flex items-center gap-3">
                        <input 
                            type="checkbox" 
                            id="revoke"
                            checked={revokeMint}
                            onChange={(e) => setRevokeMint(e.target.checked)}
                            className="w-5 h-5 accent-blue-600"
                        />
                        <label htmlFor="revoke" className="text-gray-300 text-sm font-medium">
                            Revoke Mint Authority (Fixed Supply)
                        </label>
                    </div>

                    <button onClick={createToken} className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-all">
                        Create Token Asset
                    </button>
                </div>
            </div>
        </div>
    );
}