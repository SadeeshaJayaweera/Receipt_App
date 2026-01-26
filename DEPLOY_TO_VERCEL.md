# 🚀 Deploying Juice Receipt App to Vercel (Free)

This guide will help you deploy your Juice Receipt App to Vercel for free.

## Prerequisites

1. **MongoDB Atlas Account** (Free tier available)
   - Go to https://www.mongodb.com/cloud/atlas
   - Create a free cluster
   - Get your connection string

2. **Vercel Account** (Free)
   - Go to https://vercel.com
   - Sign up with GitHub (recommended)

3. **GitHub Account** (to connect with Vercel)

---

## Step 1: Push Code to GitHub

First, create a GitHub repository and push your code:

```bash
# Navigate to the project root
cd /Users/macboookpro/Documents/Projects/juice-receipt-app

# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Juice Receipt App"

# Add your GitHub remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/juice-receipt-app.git

# Push to GitHub
git push -u origin main
```

---

## Step 2: Deploy Backend to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Configure the project:
   - **Root Directory:** `backend`
   - **Framework Preset:** Other
   - **Build Command:** (leave empty)
   - **Output Directory:** (leave empty)

5. Add Environment Variables:
   - `MONGODB_URI` = Your MongoDB Atlas connection string
   - `JWT_SECRET` = A strong random string (e.g., generate at https://randomkeygen.com/)
   - `NODE_ENV` = production

6. Click **"Deploy"**

7. Copy your backend URL (e.g., `https://juice-receipt-backend.vercel.app`)

### Option B: Deploy via CLI

```bash
cd backend
npx vercel login
npx vercel --prod
```

---

## Step 3: Deploy Frontend to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Click **"Add New"** → **"Project"**
3. Import the same GitHub repository
4. Configure the project:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Create React App
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`

5. Add Environment Variables:
   - `REACT_APP_API_URL` = Your backend URL + `/api` (e.g., `https://juice-receipt-backend.vercel.app/api`)

6. Click **"Deploy"**

### Option B: Deploy via CLI

```bash
cd frontend
npx vercel login
npx vercel --prod
```

---

## Step 4: Update Backend CORS

After deploying the frontend, update your backend's environment variable:

1. Go to your backend project on Vercel
2. Go to **Settings** → **Environment Variables**
3. Add: `FRONTEND_URL` = Your frontend URL (e.g., `https://juice-receipt-frontend.vercel.app`)
4. Redeploy the backend

---

## Step 5: Test Your Deployment

1. Visit your frontend URL
2. Register a new account
3. Add some flavours
4. Create a receipt
5. Test print and PDF functionality

---

## MongoDB Atlas Setup (If you haven't already)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster (choose FREE tier - M0)
4. Create a database user:
   - Go to **Database Access** → **Add New Database User**
   - Choose username and password
5. Allow network access:
   - Go to **Network Access** → **Add IP Address**
   - Click **"Allow Access from Anywhere"** (for Vercel)
6. Get your connection string:
   - Go to **Clusters** → **Connect** → **Connect your application**
   - Copy the connection string
   - Replace `<password>` with your database user password

---

## Environment Variables Summary

### Backend (on Vercel):
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/juice-receipt-app
JWT_SECRET=your-super-secret-key-here
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
```

### Frontend (on Vercel):
```
REACT_APP_API_URL=https://your-backend.vercel.app/api
```

---

## Troubleshooting

### CORS Errors
- Make sure `FRONTEND_URL` is set correctly in backend
- Redeploy backend after adding the variable

### MongoDB Connection Issues
- Check if IP is whitelisted in MongoDB Atlas (use 0.0.0.0/0 for Vercel)
- Verify connection string is correct
- Check database user credentials

### Build Errors
- Check Vercel build logs for specific errors
- Make sure all dependencies are in package.json

---

## Free Tier Limits

### Vercel Free Tier:
- Unlimited deployments
- 100GB bandwidth/month
- Serverless function execution: 100GB-hours/month

### MongoDB Atlas Free Tier (M0):
- 512MB storage
- Shared RAM
- Perfect for small apps

---

## Your Deployed URLs

After deployment, your app will be available at:
- **Frontend:** `https://juice-receipt-frontend.vercel.app` (or similar)
- **Backend API:** `https://juice-receipt-backend.vercel.app/api` (or similar)

🎉 Congratulations! Your app is now live!
