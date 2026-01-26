# Juice Receipt App

A full-stack receipt generating application for small juice businesses.

## Features

- 🧃 Manage juice flavours (add, edit, delete)
- 📝 Create professional receipts
- 🖨️ Print receipts (thermal printer format - 80mm)
- 📄 Download receipts as PDF
- 📋 View receipt history
- 💱 Support for LKR and USD currencies
- 📱 Mobile responsive design
- 🔐 User authentication

## Tech Stack

- **Frontend:** React, Tailwind CSS, Zustand
- **Backend:** Node.js, Express
- **Database:** MongoDB
- **PDF Generation:** jsPDF

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/juice-receipt-app.git
cd juice-receipt-app
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables:

**Backend (.env):**
```
MONGODB_URI=mongodb://localhost:27017/juice-receipt-app
JWT_SECRET=your-secret-key
PORT=5000
```

**Frontend (.env):**
```
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the application:

```bash
# Terminal 1 - Start backend
cd backend
npm start

# Terminal 2 - Start frontend
cd frontend
npm start
```

5. Open http://localhost:3000 in your browser

## Deployment

See [DEPLOY_TO_VERCEL.md](./DEPLOY_TO_VERCEL.md) for detailed deployment instructions.

## License

MIT
