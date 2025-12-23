import React, { useState } from 'react';
import { ethers } from 'ethers';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore'; 
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../scConfig';

const QueryRecord = () => {
    const [targetPatient, setTargetPatient] = useState('');
    const [records, setRecords] = useState([]);
    const [status, setStatus] = useState('');

    const fetchRecords = async () => {
        setRecords([]);
        setStatus('Fetching index from Blockchain...');
        try {
            if (!window.ethereum) throw new Error("Please install MetaMask");
            
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

            const result = await contract.getRecords(targetPatient);
            
            if (!result || result.length === 0) {
                setStatus('No records found.');
                return;
            }

            const fullRecords = [];
            for (let i = 0; i < result.length; i++) {
                const item = result[i];
                const firebaseId = item.dataHash; 
                const timestampNum = item.timestamp.toNumber ? item.timestamp.toNumber() : Number(item.timestamp);

                const docRef = doc(db, "encrypted_blood_records", firebaseId);
                const docSnap = await getDoc(docRef);

                let displayData = "Unable to read data";
                
                if (docSnap.exists()) {
                    const rawData = docSnap.data().encryptedData;
                    try {
                        const parsed = JSON.parse(rawData);
                        // 格式化显示的详细数据
                        displayData = `Blood Type: ${parsed.bloodType} | Vol: ${parsed.volume} | BP: ${parsed.bloodPressure} | Notes: ${parsed.notes || parsed.doctorNotes}`;
                    } catch (e) {
                        displayData = rawData;
                    }
                }

                fullRecords.push({
                    type: item.recordType,
                    location: item.location,
                    doctor: item.doctor, // <--- 确保这里取到了合约里的医生地址
                    timestamp: new Date(timestampNum * 1000).toLocaleString(),
                    details: displayData
                });
            }

            setRecords(fullRecords);
            setStatus(`Success! Found ${fullRecords.length} records.`);

        } catch (error) {
            console.error("Query Error:", error);
            const errStr = JSON.stringify(error) + (error.message || "");
            
            if (errStr.includes("Access denied")) {
                setStatus('⛔ Access Denied: You do not have permission to view this patient.');
            } else if (errStr.includes("user rejected")) {
                setStatus('Operation cancelled by user.');
            } else {
                setStatus('❌ Error: ' + (error.reason || "Network or Contract Error"));
            }
        }
    };

    return (
        <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#333' }}>🔍 Search Records</h3>
            <p style={{ fontSize: '14px', color: '#666' }}>Doctors need patient authorization to view records.</p>
            
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input 
                    placeholder="Patient Wallet Address (0x...)" 
                    value={targetPatient} 
                    onChange={e => setTargetPatient(e.target.value)} 
                    style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
                <button onClick={fetchRecords} style={{ padding: '10px 20px', background: '#1890ff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Search
                </button>
            </div>
            <p style={{ color: status.includes('⛔') ? 'red' : status.includes('Success') ? 'green' : '#666', fontSize: '14px', marginTop: '10px', fontWeight: 'bold' }}>{status}</p>

            <div style={{ marginTop: '20px', maxHeight: '500px', overflowY: 'auto' }}>
                {records.map((rec, index) => (
                    <div key={index} style={{ border: '1px solid #eee', background: '#f9f9f9', padding: '15px', marginBottom: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        
                        {/* 头部：类型和时间 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ddd', paddingBottom: '10px', marginBottom: '10px' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#0050b3' }}>{rec.type}</span>
                            <span style={{ color: '#888', fontSize: '14px' }}>📅 {rec.timestamp}</span>
                        </div>

                        {/* 中部：基础信息 (地点和医生) - 这里加回来了 */}
                        <div style={{ fontSize: '14px', color: '#555', marginBottom: '10px', lineHeight: '1.6' }}>
                            <div><strong>📍 Location:</strong> {rec.location}</div>
                            <div><strong>👨‍⚕️ Doctor:</strong> <span style={{ fontFamily: 'monospace', background: '#e6f7ff', padding: '2px 4px', borderRadius: '3px' }}>{rec.doctor}</span></div>
                        </div>

                        {/* 底部：详细医疗数据 */}
                        <div style={{ background: '#fff', padding: '10px', border: '1px solid #e6e6e6', borderRadius: '4px', fontSize: '14px', color: '#333', borderLeft: '4px solid #52c41a' }}>
                            <strong>📄 Details:</strong><br/>
                            {rec.details}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default QueryRecord;