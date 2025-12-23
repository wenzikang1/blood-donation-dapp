import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './scConfig';

// Import Components
import AddRecord from './components/AddRecord';     // For Doctors
import GrantAccess from './components/GrantAccess'; // For Patients
import QueryRecord from './components/QueryRecord'; // For Both

function App() {
  const [wallet, setWallet] = useState("");
  const [role, setRole] = useState(""); // Roles: 'admin', 'doctor', 'patient'
  const [loading, setLoading] = useState(false);
  const [registerInput, setRegisterInput] = useState(""); // Input for registering doctors

  // Connect Wallet & Detect Role
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setLoading(true);
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const currentAddr = accounts[0];
        setWallet(currentAddr);

        // --- Role Detection Logic ---
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

        // 1. Check if Admin
        const adminAddr = await contract.admin();
        if (currentAddr.toLowerCase() === adminAddr.toLowerCase()) {
          setRole('admin');
          setLoading(false);
          return;
        }

        // 2. Check if Registered Doctor
        const isDoc = await contract.registeredDoctors(currentAddr);
        if (isDoc) {
          setRole('doctor');
          setLoading(false);
          return;
        }

        // 3. Default to Patient
        setRole('patient');
        setLoading(false);

      } catch (error) {
        console.error("Connection Error:", error);
        setLoading(false);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  // Admin: Register Doctor Function (PRESERVED)
  const handleRegisterDoctor = async () => {
    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        
        const tx = await contract.registerDoctor(registerInput);
        await tx.wait();
        
        alert(`Successfully registered doctor: ${registerInput}`);
        setRegisterInput("");
    } catch (e) {
        alert("Registration Failed: " + e.message);
    }
  };

  // --- Rendering Logic ---
  const renderContent = () => {
    if (loading) return <p>Verifying Identity...</p>;

    switch (role) {
      case 'admin':
        return (
          <div style={styles.card}>
            <h2 style={{color: '#d32f2f'}}>🛡️ Admin Console</h2>
            <p>Current Role: <strong>Super Admin</strong></p>
            <hr/>
            <h3>Register New Doctor</h3>
            <p style={{fontSize: '14px', color: '#666'}}>Enter a wallet address to authorize a new doctor.</p>
            <div style={{display: 'flex', gap: '10px'}}>
                <input 
                    placeholder="Doctor Wallet Address (0x...)" 
                    value={registerInput}
                    onChange={e => setRegisterInput(e.target.value)}
                    style={{flex: 1, padding: '8px'}}
                />
                <button onClick={handleRegisterDoctor} style={styles.btn}>Register</button>
            </div>
          </div>
        );

      case 'doctor':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
             <AddRecord />
             <div style={styles.card}>
                <h3>🔎 Doctor Query Portal</h3>
                <QueryRecord />
             </div>
          </div>
        );

      case 'patient':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={styles.card}>
                <h2 style={{color: '#2e7d32'}}>🏥 Patient Center</h2>
                <p>Welcome. You can manage your permissions or view your medical history here.</p>
            </div>
            
            <GrantAccess />
            
            <div style={styles.card}>
                <h3>📄 My Medical Records</h3>
                <QueryRecord />
            </div>
          </div>
        );

      default:
        return <p>Please connect your wallet to verify your role...</p>;
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#f0f2f5', minHeight: '100vh', padding: '20px' }}>
      {/* Navbar */}
      <nav style={{ background: '#fff', padding: '15px 30px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', color: '#333' }}>🩸 Blood DApp</h1>
        <div>
          {!wallet ? (
            <button onClick={connectWallet} style={{...styles.btn, background: '#1890ff'}}>Connect Wallet</button>
          ) : (
            <div style={{textAlign: 'right'}}>
                <span style={{display: 'block', fontWeight: 'bold', color: '#1890ff'}}>{role.toUpperCase()}</span>
                <span style={{fontSize: '12px', color: '#999'}}>{wallet.substring(0,6)}...{wallet.substring(38)}</span>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {renderContent()}
      </div>
    </div>
  );
}

const styles = {
    card: {
        background: '#fff',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        marginBottom: '20px'
    },
    btn: {
        padding: '8px 20px', 
        background: '#007bff', 
        color: '#fff', 
        border: 'none', 
        borderRadius: '4px', 
        cursor: 'pointer'
    }
};

export default App;