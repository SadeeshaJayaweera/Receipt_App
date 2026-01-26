# 🧃 Juice Receipt App

> A modern full-stack receipt generation system designed for small juice businesses, enabling effortless creation, management, and printing of professional receipts.

![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E=18-brightgreen)
![MongoDB](https://img.shields.io/badge/database-MongoDB-success)
![React](https://img.shields.io/badge/frontend-React-blue)

---

## ✨ Overview

**Juice Receipt App** is designed to streamline the billing process for small juice shops. The application allows business owners to:

- Manage juice flavours efficiently  
- Generate receipts quickly and professionally  
- Format receipts for thermal printing (80mm)  
- Export receipts as PDF  
- Track and view receipt history  
- Support multiple currencies (LKR & USD)  

Built with a modern tech stack, it emphasizes **performance, scalability, and usability**.

---

## 🚀 Features

- 🧃 **Juice Flavour Management** – Add, edit, delete flavours  
- 📝 **Professional Receipt Creation**  
- 🖨️ **Thermal Printer Support** (80mm format)  
- 📄 **Download Receipts as PDF**  
- 📋 **View Receipt History**  
- 💱 **Multi-Currency Support** (LKR & USD)  
- 📱 **Mobile Responsive Design**  
- 🔐 **User Authentication & Authorization**  
- ⚡ **Fast and Lightweight UI**

---

## 🛠️ Tech Stack

### Frontend
- React  
- Tailwind CSS  
- Zustand  

### Backend
- Node.js  
- Express.js  

### Database
- MongoDB  

### Utilities
- jsPDF (PDF Generation)  
- JWT Authentication  

---

## 📦 Getting Started

### ✅ Prerequisites
Before running the application, ensure the following are installed:

- Node.js v18+  
- MongoDB (Local or Atlas)

---

### 📸 Screenshots

**Dashboard Preview**  
<br>
<img src="App Preview/Dashboard.png">

**Flavours Section**   
<br>
<img src="App Preview/Flavours_Section.png">

**Receipt Creation Section**  
<br>
<img src="App Preview/Receipt_Create.png">

**Receipt History Section**  
<br>
<img src="App Preview/Receipt_History.png">

**Contact Settings Section**   
<br>
<img src="App Preview/Settings_Contact_Info.png">

---

<section class="installation">
  <h3>📥 Installation</h3>

  <div class="step">
    <h4>1️⃣ Clone the repository</h4>
    <pre><code>git clone https://github.com/YOUR_USERNAME/juice-receipt-app.git
cd juice-receipt-app</code></pre>
  </div>

  <div class="step">
    <h4>2️⃣ Install dependencies</h4>
    <p><strong>Backend:</strong></p>
    <pre><code>cd backend
npm install</code></pre>
    <p><strong>Frontend:</strong></p>
    <pre><code>cd ../frontend
npm install</code></pre>
  </div>

  <div class="step">
    <h4>3️⃣ Set up Environment Variables</h4>
    <p><strong>Backend (<code>backend/.env</code>):</strong></p>
    <pre><code>MONGODB_URI=mongodb://localhost:27017/juice-receipt-app
JWT_SECRET=your-secret-key
PORT=5000</code></pre>

    <p><strong>Frontend (<code>frontend/.env</code>):</strong></p>
    <pre><code>REACT_APP_API_URL=http://localhost:5000/api</code></pre>
  </div>

  <div class="step">
    <h4>4️⃣ Run the Application</h4>
    <p><strong>Terminal 1 – Backend:</strong></p>
    <pre><code>cd backend
npm start</code></pre>

    <p><strong>Terminal 2 – Frontend:</strong></p>
    <pre><code>cd frontend
npm start</code></pre>

    <p>Open in your browser: <a href="http://localhost:3000">http://localhost:3000</a></p>
  </div>

 <section class="deployment">
  <div class="section-item">
    <h3>🌍 Deployment</h3>
    <p>Deployment instructions are available in: <a href="./DEPLOY_TO_VERCEL.md">📄 DEPLOY_TO_VERCEL.md</a></p>
    <p>Supports multiple platforms:</p>
    <ul>
      <li>Vercel</li>
      <li>Render</li>
      <li>Railway</li>
      <li>MongoDB Atlas</li>
    </ul>
  </div>

  <div class="section-item">
    <h3>📄 License</h3>
    <p>This project is licensed under the <strong>MIT License</strong>.</p>
  </div>

  <div class="section-item">
    <h3>👨‍💻 Author</h3>
    <p>Sadeesha Vishmitha Jayaweera</p>
