"use client"
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from "@solana/web3.js";
import { 
    TOKEN_2022_PROGRAM_ID, 
    createWithdrawWithheldTokensFromAccountsInstruction, 
    getTransferFeeAmount, 
    unpackAccount,
    getAssociatedTokenAddressSync
} from "@solana/spl-token";
import { useState } from 'react';

export function TaxHarvester(){
    const { connection } = useConnection();
    const wallet = useWallet();

    const [mintAddress, setMintAddress] = useState("");
    const [status, setStatus] = useState("Idle");
    const [victimAddress, setVictimAddress] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const harvestTax = async()=>{
        if(!wallet.publicKey){
            alert("Connect Wallet First");
            return ;
        }
        setIsLoading(true);
        setStatus("Scanning network for withheld taxes");

        try {
            const mintPubkey = new PublicKey(mintAddress);
            const victimPubkey = new PublicKey(victimAddress);
            const victimATA = getAssociatedTokenAddressSync(
                mintPubkey,
                victimPubkey,
                false,
                TOKEN_2022_PROGRAM_ID
            );

            const accountInfo = await connection.getAccountInfo(victimATA);
            if (!accountInfo) {
                setStatus("Victim does not have an account for this token.");
                setIsLoading(false);
                return;
            }
            let totalWithheld = BigInt(0);
                try {
                    const accountData = unpackAccount(
                    victimATA,
                    { 
                        data: accountInfo.data, 
                        owner: TOKEN_2022_PROGRAM_ID, 
                        lamports: 0, 
                        executable: false 
                    },
                    TOKEN_2022_PROGRAM_ID
                );
                const transferFeeAmount = getTransferFeeAmount(accountData);
                if (transferFeeAmount !== null) {
                    totalWithheld = transferFeeAmount.withheldAmount;
                }
                }catch (e) {
                    console.error("Failed to unpack :", e);
                }
            
            if (totalWithheld === BigInt(0)) {
                setStatus("Target is clean. No taxes to harvest.");
                setIsLoading(false);
                return;
            }

            setStatus(`Target identified! Holding ${totalWithheld} withheld tokens. Seizing...`);

            const myAssociatedTokenAccount = getAssociatedTokenAddressSync(
                mintPubkey,
                wallet.publicKey,
                false,
                TOKEN_2022_PROGRAM_ID
            );
            const transaction = new Transaction();
            transaction.add(
                createWithdrawWithheldTokensFromAccountsInstruction(
                    mintPubkey,
                    myAssociatedTokenAccount, 
                    wallet.publicKey,         
                    [],                       
                    [victimATA],              
                    TOKEN_2022_PROGRAM_ID
                )
            );

            const signature = await wallet.sendTransaction(transaction, connection);
            await connection.confirmTransaction(signature, "confirmed");
            
            setStatus(`Harvested ${totalWithheld} tokens`);

        } catch(error){
            console.error("Harvest failed:", error);
            setStatus("Failed to harvest. Check console for details.");
            alert("Error harvesting taxes.");
        }
        finally{
            setIsLoading(false);
        }
    }
    return (
        <div className="bg-slate-900 p-8 rounded-xl border border-slate-700 mt-8 mb-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-white mb-2">Tax Sniper</h2>
            <p className="text-gray-400 mb-6 text-sm">Target a specific user and extract withheld taxes.</p>
            
            <div className="flex flex-col gap-4">
                <div>
                    <label className="text-gray-400 text-sm mb-1 block">Token Mint Address</label>
                    <input 
                        type="text" 
                        placeholder="Mint Address" 
                        value={mintAddress}
                        onChange={(e) => setMintAddress(e.target.value)}
                        className="w-full p-3 bg-slate-800 text-white rounded border border-slate-600"
                    />
                </div>

                <div>
                    <label className="text-gray-400 text-sm mb-1 block">Target Wallet (Victim)</label>
                    <input 
                        type="text" 
                        placeholder="Wallet Address of User (Account 2)" 
                        value={victimAddress}
                        onChange={(e) => setVictimAddress(e.target.value)}
                        className="w-full p-3 bg-slate-800 text-white rounded border border-slate-600"
                    />
                </div>
                
                <button 
                    onClick={harvestTax}
                    disabled={isLoading}
                    className={`w-full font-bold py-3 rounded transition-all ${
                        isLoading 
                        ? "bg-gray-600 cursor-not-allowed" 
                        : "bg-red-600 hover:bg-red-700 text-white"
                    }`}
                >
                    {isLoading ? "Sniping..." : "Seize Taxes"}
                </button>
                
                <p className="mt-4 text-center text-yellow-400 font-mono text-sm">{status}</p>
            </div>
        </div>
    );
}