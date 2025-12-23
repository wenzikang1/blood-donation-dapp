import React, { useState } from 'react';
import { ethers } from 'ethers';
import { db } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore'; 
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../scConfig';

const GrantAccess = () => {
    const [doctorAddr, setDoctorAddr] = useState('');
    const [status, setStatus] = useState('');

    const handlePermission = async (isGrant) => {
        if (!doctorAddr) {
            setStatus('Please enter a doctor address.');
            return;
        }

        try {
            if (!window.ethereum) throw new Error("Please install MetaMask");
            setStatus('Requesting wallet signature...');

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const patientAddress = await signer.getAddress(); 
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

            let tx;
            if (isGrant) {
                tx = await contract.grantAccess(doctorAddr);
            } else {
                tx = await contract.revokeAccess(doctorAddr);
            }

            setStatus('Transaction sent, waiting for confirmation...');
            await tx.wait();

            // Sync with Firebase
            try {
                await addDoc(collection(db, "access_list"), {
                    patientAddr: patientAddress,
                    doctorAddr: doctorAddr,
                    hasAccess: isGrant, 
                    timestamp: Math.floor(Date.now() / 1000),
                    action: isGrant ? "Grant" : "Revoke"
                });
            } catch (dbError) {
                console.error("Firebase sync failed:", dbError);
            }
            
            if (isGrant) {
                setStatus('✅ Access Granted! (Synced on-chain & DB)');
            } else {
                setStatus('🚫 Access Revoked! (Synced on-chain & DB)');
            }

        } catch (error) {
            console.error(error);
            const errStr = JSON.stringify(error) + (error.message || "");
            if (errStr.includes("user rejected")) {
                setStatus('User cancelled the transaction.');
            } else {
                setStatus('❌ Failed: ' + (error.reason || error.message));
            }
        }
    };

    return (
        <div style={{ border: '1px solid #ccc', padding: '20px', margin: '10px' }}>
            <h3>🤕 Permission Management</h3>
            <p>Enter Doctor's Wallet Address to Grant or Revoke access:</p>
            <input 
                placeholder="Doctor Address (0x...)" 
                value={doctorAddr} 
                onChange={e => setDoctorAddr(e.target.value)} 
                style={{ width: '300px' }}
            />
            <div style={{ marginTop: '10px' }}>
                <button 
                    onClick={() => handlePermission(true)} 
                    style={{ marginRight: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '8px 15px', cursor: 'pointer' }}
                >
                    ✅ Grant Access
                </button>
                <button 
                    onClick={() => handlePermission(false)}
                    style={{ backgroundColor: '#f44336', color: 'white', border: 'none', padding: '8px 15px', cursor: 'pointer' }}
                >
                    🚫 Revoke Access
                </button>
            </div>
            <p style={{ fontWeight: 'bold' }}>{status}</p>
        </div>
    );
};

export default GrantAccess;