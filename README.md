# 🩸 Secure Blood Donation DApp (基于区块链的安全献血病历系统)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/Frontend-React-61DAFB.svg)
![Firebase](https://img.shields.io/badge/Database-Firebase-FFCA28.svg)
![Ethereum](https://img.shields.io/badge/Blockchain-Ethereum%2FSepolia-3C3C3D.svg)

## 📖 项目简介 (Introduction)

本项目是一个去中心化的医疗数据管理应用（DApp），旨在解决传统献血记录中存在的**数据孤岛**、**隐私泄露**和**信任缺失**问题。

系统采用 **"链上索引 + 链下存储"** 的混合架构：利用以太坊区块链保证数据的不可篡RK和权限控制，利用 Firebase 存储加密后的详细病历数据。患者拥有对自己数据的完全控制权（Self-Sovereign Identity），可以自主决定授权或撤销医生对病历的访问。

---

## 🏗 系统架构 (System Architecture)

系统分为三层架构，确保安全性与效率的平衡：

1.  **前端交互层 (React.js)**: 
    *   根据连接的钱包地址自动识别身份（管理员/医生/患者）。
    *   提供结构化的数据录入和可视化的数据查询界面。
2.  **逻辑控制层 (Smart Contract - Solidity)**: 
    *   部署在 Sepolia 测试网。
    *   维护医生注册白名单。
    *   记录病历的哈希值（Data Hash）以防篡改。
    *   管理复杂的权限逻辑（Grant/Revoke Access）。
3.  **数据存储层 (Hybrid Storage)**:
    *   **On-Chain (链上)**: 仅存储关键元数据（患者地址、医生地址、记录类型、时间戳、IPFS/Firebase 索引哈希）。
    *   **Off-Chain (链下 - Firebase)**: 存储经 AES 加密后的详细医疗数据（血型、血压、献血量、医嘱等）。

---

## ✨ 核心功能 (Key Features)

### 1. 🛡 身份与权限管理 (Role-Based Access Control)
*   **自动身份识别**: 系统根据钱包地址自动判断用户角色（管理员/医生/患者）。
*   **患者主权**: 患者必须显式授权（Grant Access），医生才能查看其详细病历；患者可随时撤销（Revoke Access）权限。

### 2. 📝 医生工作台 (Doctor Dashboard)
*   **结构化录入**: 提供血型、献血量、血压等标准化字段录入。
*   **数据加密上链**: 前端自动将敏感数据打包并加密，生成哈希值上链，原始加密数据存入云端。

### 3. 🔍 医疗记录查询 (Secure Query)
*   **双重验证**: 查询时首先通过智能合约验证访问权限，验证通过后方可解密并读取云端详细数据。
*   **完整追溯**: 每条记录均包含时间戳、地点、操作医生签名，全流程可追溯。

---

## 🛠 技术栈 (Tech Stack)

| 模块 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **前端框架** | React.js | 响应式 UI，组件化开发 |
| **区块链交互** | Ethers.js (v5) | 连接 MetaMask 钱包，调用智能合约 |
| **智能合约** | Solidity | 编写核心业务逻辑 (AccessControl, Registry) |
| **部署网络** | Sepolia Testnet | 以太坊测试网 |
| **云数据库** | Google Firebase | Firestore 存储加密后的 JSON 数据 |
| **开发工具** | VScode, Remix | 代码编写与合约调试 |
| **部署托管** | Vercel | 前端自动化部署 |

---

## 🔒 数据隐私方案 (Data Privacy)

为了符合医疗数据合规性（如 HIPAA/GDPR 的设计思路）：
1.  **数据脱敏**: 链上不存储任何明文的个人身份信息（PII）。
2.  **混合存储**: 
    *   **智能合约**: 存 `DataHash` (索引)。
    *   **Firebase**: 存 `EncryptedData` (密文)。
3.  **查询逻辑**:
    > 用户发起查询 -> 钱包签名 -> 合约检查 `mapping(patient => doctor => bool)` 权限 -> 若 `true` -> 返回 `DataHash` -> 前端用 Hash 去 Firebase 拉取数据 -> 展示。

---

## 🚀 快速开始 (Getting Started)

### 前置要求
*   Node.js (v16+)
*   MetaMask 浏览器插件 (切换至 Sepolia 网络)

### 1. 克隆项目
```bash
git clone https://github.com/wenzikang1/blood-donation-dapp.git
cd blood-donation-dapp
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
在根目录创建 `.env` 文件（参考 `.env.example`），填入你的 Firebase 配置：
```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
...
```

### 4. 启动本地服务
```bash
npm start
```
打开浏览器访问 `http://localhost:3000`。

---

## 📜 智能合约信息

*   **Network**: Sepolia Testnet
*   **Contract Address**: `0x358C1b214ca97156B36f121cfDDfE8c7cfba8A38`

---

## 📚 参考文献验证 (Reference Verification)

本仓库包含对15篇学术参考文献的DOI和期刊信息验证结果。查看详细信息：

*   **[参考文献核查结果.md](./参考文献核查结果.md)** - 中文简要摘要（推荐）
*   **[REFERENCES_README.md](./REFERENCES_README.md)** - 完整使用指南
*   **[CORRECTED_REFERENCES.md](./CORRECTED_REFERENCES.md)** - 更正后的文献列表
*   **[REFERENCES_VERIFICATION.md](./REFERENCES_VERIFICATION.md)** - 详细验证报告

**核查摘要：** 15篇文献中，13篇完全正确，1篇需要更正年份（文献[2]: 2021→2019），1篇无法验证（文献[9]）。

---

## 👥 作者 (Author)

*   **wenzikang1** - [GitHub Profile](https://github.com/wenzikang1)

---

*本项目仅供学习与研究区块链在医疗领域的应用。*
