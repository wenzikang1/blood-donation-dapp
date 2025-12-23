// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDV0FxgGdmkQ3RIOKfsCJvI4GXnvbCTZyc",
  authDomain: "blood-donation-dapp.firebaseapp.com",
  projectId: "blood-donation-dapp",
  storageBucket: "blood-donation-dapp.firebasestorage.app",
  messagingSenderId: "544009575874",
  appId: "1:544009575874:web:cbcc5e45b90aba2ef3ca5b"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
// 初始化 Firestore 数据库并导出
export const db = getFirestore(app);