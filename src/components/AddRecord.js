import React, { useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, updateDoc } from 'firebase/firestore';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../scConfig';
// 1. 引入加密库
import CryptoJS from 'crypto-js';

// 定义加密密钥 (在真实生产环境中，这个应该放在 .env 文件里，例如 process.env.REACT_APP_SECRET_KEY)
const SECRET_KEY = "my-secret-key-123"; 

const AddRecord = () => {
    const [patientAddr, setPatientAddr] = useState('');
    const [recordType, setRecordType] = useState('Screening');
    const [location, setLocation] = useState('City Hospital');
    
    // Detailed Form State
    const [bloodType, setBloodType] = useState('A+');
    const [quantity, setQuantity] = useState('200');
    const [bloodPressure, setBloodPressure] = useState('');
    const [notes, setNotes] = useState('');
    
    const [status, setStatus] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('Processing...');

        try {
            if (!window.ethereum) throw new Error("Please install MetaMask");

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const doctorAddress = await signer.getAddress();

            // Pack data into JSON
            const medicalDataObject = {
                bloodType,
                quantity: quantity + 'ml',
                bloodPressure,
                notes
            };
            
            // --- 核心修改：加密过程 ---
            // 1. 先转成字符串
            const dataString = JSON.stringify(medicalDataObject);
            // 2. 使用 AES 加密
            const encryptedData = CryptoJS.AES.encrypt(dataString, SECRET_KEY).toString();
            
            console.log("Original:", dataString);
            console.log("Encrypted:", encryptedData); // 控制台会打印出乱码，说明加密成功

            const timestamp = Math.floor(Date.now() / 1000);

            const initialData = {
                patientAddr,
                doctorAddr: doctorAddress,
                recordType,
                location,
                timestamp,
                encryptedData: encryptedData, // 这里存入的是乱码 (例如: U2FsdGVkX1...)
                dataHash: "pending..."
            };

            // 1. Write to Firebase
            const docRef = await addDoc(collection(db, "encrypted_blood_records"), initialData);
            const firebaseId = docRef.id;

            // 2. Update dataHash
            await updateDoc(docRef, { dataHash: firebaseId });

            // 3. Write to Blockchain
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            const tx = await contract.addRecord(patientAddr, firebaseId, recordType, location);
            
            setStatus('Waiting for blockchain confirmation...');
            await tx.wait();

            setStatus('✅ Success! Encrypted record uploaded and indexed.');
            // Reset form
            setBloodPressure('');
            setNotes('');
            
        } catch (error) {
            console.error(error);
            setStatus('Error: ' + (error.data?.message || error.message));
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '10px', background: '#fff' }}>
            <h2 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px', color: '#007bff' }}>👨‍⚕️ Doctor Dashboard</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                
                <div>
                    <label style={{fontWeight: 'bold'}}>Patient Wallet Address:</label>
                    <input style={{width: '100%', padding: '8px', marginTop: '5px'}} placeholder="0x..." value={patientAddr} onChange={e => setPatientAddr(e.target.value)} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                        <label style={{fontWeight: 'bold'}}>Record Type:</label>
                        <select style={{width: '100%', padding: '8px', marginTop: '5px'}} value={recordType} onChange={e => setRecordType(e.target.value)}>
                            <option value="Screening">Screening</option>
                            <option value="Donation Log">Donation Log</option>
                            <option value="Lab Result">Lab Result</option>
                        </select>
                    </div>
                    <div>
                        <label style={{fontWeight: 'bold'}}>Location:</label>
                        <input style={{width: '100%', padding: '8px', marginTop: '5px'}} value={location} onChange={e => setLocation(e.target.value)} required />
                    </div>
                </div>

                {/* --- Detailed Inputs --- */}
                <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                    <h4 style={{marginTop: 0, color: '#495057'}}>Medical Data Entry</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                            <label>🩸 Blood Type:</label>
                            <select style={{width: '100%', padding: '5px'}} value={bloodType} onChange={e => setBloodType(e.target.value)}>
                                <option value="A+">A+</option><option value="A-">A-</option>
                                <option value="B+">B+</option><option value="B-">B-</option>
                                <option value="O+">O+</option><option value="O-">O-</option>
                                <option value="AB+">AB+</option><option value="AB-">AB-</option>
                            </select>
                        </div>
                        <div>
                            <label>💉 Volume (ml):</label>
                            <input type="number" step="100" style={{width: '100%', padding: '5px'}} value={quantity} onChange={e => setQuantity(e.target.value)} />
                        </div>
                        <div>
                            <label>💓 Pressure (mmHg):</label>
                            <input placeholder="e.g. 120/80" style={{width: '100%', padding: '5px'}} value={bloodPressure} onChange={e => setBloodPressure(e.target.value)} />
                        </div>
                    </div>
                    <div style={{ marginTop: '10px' }}>
                        <label>📝 Notes / Orders:</label>
                        <textarea style={{width: '100%', height: '60px', padding: '5px'}} value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>
                </div>

                <button type="submit" style={{padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer', marginTop: '10px'}}>
                    📤 Upload Encrypted Record
                </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '15px', color: status.includes('✅') ? 'green' : 'red' }}>{status}</p>
        </div>
    );
};

export default AddRecord;
