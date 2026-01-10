"use client"
import { useConnection, useWallet  } from "@solana/wallet-adapter-react"
import { Keypair, SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { TOKEN_2022_PROGRAM_ID, 
    getMintLen, 
    createInitializeMetadataPointerInstruction, 
    createInitializeMintInstruction, 
    ExtensionType,
    createInitializeTransferFeeConfigInstruction, createMintToInstruction, 
    getAssociatedTokenAddressSync, 
    createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { useState } from "react";

const TREASURY_WALLET = new PublicKey("Fbr3vtcBP8DVim4fGyAs8uLug8V8iErVQQQxqkghCQ52");
const SERVICE_FEE = 0.1


export function Token2022Creator(){
    const {connection} = useConnection();
    const wallet = useWallet();

    const [feeBasisPoints, setFeeBasisPoints] = useState(0); 
    const [maxFee, setMaxFee] = useState(0);
    const [loading, setLoading] = useState(false);

    const createToken = async()=>{
            if(!wallet.publicKey){
            alert("Connect Wallet First");
            return;
        }
        setLoading(true);
        try{
            const mintKeypair= Keypair.generate();
            const decimals = 9;
            const paymentInstruction = SystemProgram.transfer({             
                fromPubkey: wallet.publicKey,
                toPubkey: TREASURY_WALLET,
                lamports: SERVICE_FEE * LAMPORTS_PER_SOL 
            })
            const extensions = [
                ExtensionType.TransferFeeConfig,
                ExtensionType.MetadataPointer
            ];
            const mintLen = getMintLen(extensions);
            const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

            const associatedToken = getAssociatedTokenAddressSync(
                mintKeypair.publicKey,
                wallet.publicKey,
                false,
                TOKEN_2022_PROGRAM_ID
            );

            const transaction = new Transaction().add(
                paymentInstruction,
                SystemProgram.createAccount({
                    fromPubkey: wallet.publicKey,
                    newAccountPubkey: mintKeypair.publicKey,
                    space: mintLen,
                    lamports,
                    programId: TOKEN_2022_PROGRAM_ID,
                }),
                createInitializeTransferFeeConfigInstruction(
                    mintKeypair.publicKey,
                    wallet.publicKey,
                    wallet.publicKey,
                    feeBasisPoints,
                    BigInt(maxFee * Math.pow(10, decimals))
                ),
                createInitializeMetadataPointerInstruction(
                    mintKeypair.publicKey,
                    wallet.publicKey,
                    mintKeypair.publicKey,
                    TOKEN_2022_PROGRAM_ID
                ),
                createInitializeMintInstruction(
                    mintKeypair.publicKey,
                    decimals,
                    wallet.publicKey,
                    null,
                    TOKEN_2022_PROGRAM_ID
                ),
                createAssociatedTokenAccountInstruction(
                    wallet.publicKey, 
                    associatedToken,  
                    wallet.publicKey, 
                    mintKeypair.publicKey,
                    TOKEN_2022_PROGRAM_ID
                ),
                createMintToInstruction(
                    mintKeypair.publicKey, 
                    associatedToken,       
                    wallet.publicKey,      
                    BigInt(1000000000 * Math.pow(10, decimals)), 
                    [],
                    TOKEN_2022_PROGRAM_ID
                )
            );
            const signature = await wallet.sendTransaction(transaction,connection, {signers: [mintKeypair]});
            console.log("Token-2022 Created:", signature);
            alert("Success! Token Created with Tax.");  

        }
        catch(error){
                console.error("Failed to create token:", error);
            alert("Transaction Failed! See console for details.");
        }
        finally{
            setLoading(false);
        }
    } 
    return (
        <div className="bg-slate-900 p-8 rounded-xl border border-slate-700 mt-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Token-2022 (Tax Token) Creator</h2>
            
            <div className="flex flex-col gap-4">
                <div>
                    <label className="text-gray-400 text-sm">Transfer Fee (%)</label>
                    <input 
                        type="number" 
                        placeholder="e.g. 2 for 2%" 
                        onChange={e => setFeeBasisPoints(Number(e.target.value) * 100)} 
                        className="w-full p-3 bg-slate-800 text-white rounded border border-slate-600 outline-none"
                    />
                </div>
                
                <div>
                    <label className="text-gray-400 text-sm">Max Fee Cap</label>
                    <input 
                        type="number" 
                        placeholder="e.g. 1000 Tokens" 
                        onChange={e => setMaxFee(Number(e.target.value))} 
                        className="w-full p-3 bg-slate-800 text-white rounded border border-slate-600 outline-none"
                    />
                </div>

                <button 
                    onClick={createToken}
                    disabled={loading} 
                    className={`font-bold py-3 rounded transition-all ${
                        loading 
                        ? "bg-gray-600 cursor-not-allowed" 
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                >
                    {loading ? "Creating..." : "Create Tax Token"}
                </button>
            </div>
        </div>
    );
}