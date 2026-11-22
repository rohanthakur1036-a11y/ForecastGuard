# ForecastGuard — Deployment Guide

> Step-by-step instructions to put ForecastGuard on the public internet.
> Written for beginners. No prior DevOps experience required.

---

## Overview of what you will do

```
Your Computer  →  GitHub  →  Render (backend API)
                        →  Vercel (frontend website)
```

After this guide you will have:
- A **public GitHub repository** with all your code
- A **live backend API** at `https://forecastguard-api.onrender.com` (free)
- A **live website** at `https://forecastguard.vercel.app` (free)

**Total time:** ~30–45 minutes (most of it is waiting for things to build)

---

## Part A — GitHub

### A1. Create a GitHub account (skip if you already have one)

1. Go to [github.com](https://github.com)
2. Click **Sign up**
3. Choose a username, enter your email, create a password
4. Verify your email address

### A2. Create a new repository

1. After logging in, click the **+** button in the top-right corner
2. Click **New repository**
3. Fill in:
   - **Repository name:** `ForecastGuard`
   - **Description:** `AI-Based Weather Forecast Bust Detection Platform · MoES SIH26079`
   - **Visibility:** `Public` ✅ (required for free hosting)
   - **Initialize this repository with:** leave all boxes **unchecked**
4. Click **Create repository**
5. GitHub will show you an empty repository with setup instructions — keep this page open

### A3. Configure Git on your computer (one-time setup)

Open the terminal inside VS Code (`Ctrl + `` ` ```) and run:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### A4. Initialise Git in the project folder

```bash
# Navigate to your project folder
cd C:\Users\HP\.gemini\antigravity\scratch\forecastguard

# Initialise a git repository
git init

# Set the main branch name
git branch -M main
```

### A5. Stage all files for the first commit

```bash
# Check which files will be tracked (should NOT include node_modules, .env, dist)
git status

# Stage everything (the .gitignore filters out unwanted files)
git add .

# Review what is staged
git status
```

**Expected to be staged:** all `.py`, `.tsx`, `.ts`, `.json`, `.md`, `.csv`, `.joblib`, `.png` files  
**Expected to be ignored:** `node_modules/`, `frontend/dist/`, `nodejs/`, `__pycache__/`, any `.env` files

If you accidentally see `node_modules` or `.env` in the staged list, run:
```bash
git reset HEAD node_modules/
git reset HEAD .env
```

### A6. Make the first commit

```bash
git commit -m "Initial commit: ForecastGuard v1.0 — AI forecast bust detection platform"
```

### A7. Connect to GitHub and push

Replace `YOUR_USERNAME` with your actual GitHub username:

```bash
git remote add origin https://github.com/YOUR_USERNAME/ForecastGuard.git
git push -u origin main
```

You will be prompted to log in to GitHub. Use your GitHub username and a **Personal Access Token** (not your password):

**To create a Personal Access Token:**
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click **Generate new token (classic)**
3. Name: `ForecastGuard deploy`
4. Expiration: 90 days
5. Scopes: tick `repo`
6. Click **Generate token**
7. **Copy the token now** (you won't see it again)
8. Use this token as your password when Git prompts you

### A8. Verify the repository

1. Go to `https://github.com/YOUR_USERNAME/ForecastGuard`
2. You should see all your files listed
3. Check that these files are **present:** `backend/`, `frontend/`, `artifacts/`, `README.md`
4. Check that these files are **absent:** `node_modules/`, `frontend/dist/`, `.env`

✅ GitHub is ready.

---

## Part B — Backend Deployment (Render)

Render is a cloud platform that runs your Python backend for free.

### B1. Create a Render account

1. Go to [render.com](https://render.com)
2. Click **Get Started for Free**
3. Sign up with your GitHub account (recommended — it auto-connects your repos)

### B2. Create a new Web Service

1. In the Render dashboard, click **New** → **Web Service**
2. Select **Build and deploy from a Git repository**
3. Connect your GitHub account if not already connected
4. Find and select your `ForecastGuard` repository
5. Click **Connect**

### B3. Configure the service

Fill in these exact settings:

| Field | Value |
|-------|-------|
| **Name** | `forecastguard-api` |
| **Region** | Singapore (or whichever is closest to India) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | `Free` |

### B4. Add environment variables

Scroll down to **Environment Variables** and add:

| Key | Value |
|-----|-------|
| `ALLOWED_ORIGINS` | `http://localhost:5173` *(update after Vercel deploy)* |

### B5. Deploy

Click **Create Web Service**

Render will:
1. Pull your code from GitHub
2. Run `pip install -r requirements.txt` (~2–3 minutes)
3. Start uvicorn with the trained model
4. Give you a URL like `https://forecastguard-api.onrender.com`

**Wait for the status to show "Live"** — this can take 3–5 minutes.

### B6. Verify the backend

Once live, open these URLs in your browser:

- `https://forecastguard-api.onrender.com/api/health` — should return JSON with `"model_loaded": true`
- `https://forecastguard-api.onrender.com/docs` — interactive API documentation

If you see `"model_loaded": false`, the model file is missing. Check:
- That `artifacts/forecast_bust_wg_model_v5_wg_dataset_GEFS_IMD.joblib` was committed to GitHub

> ⚠️ **Cold starts:** The free Render plan spins down after 15 minutes of inactivity. The first request after spin-down takes 30–60 seconds. This is normal.

✅ Backend is live.

---

## Part C — Frontend Deployment (Vercel)

Vercel hosts your React frontend as a static website with global CDN.

### C1. Create a Vercel account

1. Go to [vercel.com](https://vercel.com)
2. Click **Sign Up**
3. Sign up with your GitHub account (recommended)

### C2. Import your project

1. In the Vercel dashboard, click **Add New** → **Project**
2. Find your `ForecastGuard` repository and click **Import**

### C3. Configure the project

| Field | Value |
|-------|-------|
| **Framework Preset** | `Vite` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### C4. Add environment variables

In the **Environment Variables** section, add:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://forecastguard-api.onrender.com` |

> Replace `forecastguard-api` with your actual Render service name from Part B.

### C5. Deploy

Click **Deploy**

Vercel will:
1. Install npm packages (~1 minute)
2. Run `npm run build` (builds the React app with VITE_API_URL baked in)
3. Publish to their CDN
4. Give you a URL like `https://forecastguard.vercel.app`

**Wait for the status to show "Ready"** — usually 1–2 minutes.

### C6. Verify the frontend

Open `https://forecastguard.vercel.app` in your browser:
- The dashboard should load with the dark navy theme
- The sidebar should show 7 navigation items
- Clicking **Overview** should show regional risk cards

✅ Frontend is live.

---

## Part D — Connect Frontend and Backend

### D1. Update CORS in Render

Now that you have your Vercel URL, tell the backend to allow it:

1. In the Render dashboard, go to your `forecastguard-api` service
2. Click **Environment** in the left menu
3. Find `ALLOWED_ORIGINS` and change its value to:
   ```
   https://forecastguard.vercel.app,http://localhost:5173
   ```
   *(Use your actual Vercel URL — it may differ slightly)*
4. Click **Save Changes** — Render will automatically redeploy

### D2. Final verification

Check all of these:

- [ ] `https://forecastguard.vercel.app` opens without error
- [ ] The Overview page loads and shows regional risk cards
- [ ] Navigate to **Test Model** → click a preset → click "Analyze Forecast Risk"
- [ ] A bust probability (e.g. 50.7%) appears with a SHAP explanation
- [ ] Navigate to **Historical Analogs** → records load from the OOF CSVs
- [ ] Navigate to **Validation** → metrics table appears
- [ ] Navigate to **Risk Explorer** → map appears with WG region circles
- [ ] On mobile (or DevTools mobile view) the sidebar collapses correctly
- [ ] The browser console shows no CORS errors

If the **Test Model** page shows "Failed to fetch" or a CORS error:
1. Verify `VITE_API_URL` is set correctly in Vercel
2. Verify `ALLOWED_ORIGINS` includes your Vercel domain in Render
3. Wait 2–3 minutes for Render to redeploy after the env change

✅ ForecastGuard is publicly live!

---

## Part E — Git Workflow for Future Updates

### Every time you make changes:

```bash
# 1. Open your project in VS Code terminal
cd C:\Users\HP\.gemini\antigravity\scratch\forecastguard

# 2. Check what you changed
git status
git diff

# 3. Test locally first
#    (Backend in one terminal, frontend in another)

# 4. Stage your changes
git add .
# Or stage specific files:
git add frontend/src/pages/Overview.tsx backend/app/main.py

# 5. Commit with a descriptive message
git commit -m "feat: add monsoon intensity indicators to Overview page"

# 6. Push to GitHub
git push

# 7. Wait 2-3 minutes → Vercel and Render auto-deploy your changes
```

### Useful Git commands

```bash
git log --oneline        # See recent commits
git diff HEAD            # See all uncommitted changes
git status               # See which files are changed
git stash                # Temporarily save changes without committing
git stash pop            # Restore stashed changes
```

### Commit message conventions (optional but good practice)

```
feat: add new feature
fix: fix a bug
docs: update documentation
style: formatting changes only
refactor: code restructuring, no feature change
chore: dependency updates, config changes
```

---

## Troubleshooting

### "CORS error" in browser console
- Check `ALLOWED_ORIGINS` in Render includes your exact Vercel URL
- Wait for Render to redeploy after changing env vars

### "502 Bad Gateway" on Render
- The service may be starting up (cold start). Wait 60 seconds and retry.
- Check Render logs: Render dashboard → your service → **Logs**

### "Model not loaded" on health check
- Verify `artifacts/forecast_bust_wg_model_v5_wg_dataset_GEFS_IMD.joblib` is in your GitHub repo
- Check Render logs for the error message

### Vercel build fails
- Check that `frontend/package.json` has correct `build` script: `"build": "tsc -b && vite build"`
- Check Render logs for specific TypeScript errors

### "Failed to fetch" on Test Model page
- Verify `VITE_API_URL` is set in Vercel project settings (not just locally)
- After changing Vercel env vars, trigger a **Redeploy** from the Vercel dashboard

---

## Important URLs to save

After completing this guide, save these:

| Item | URL |
|------|-----|
| GitHub repository | `https://github.com/YOUR_USERNAME/ForecastGuard` |
| Backend (Render) | `https://forecastguard-api.onrender.com` |
| Backend API docs | `https://forecastguard-api.onrender.com/docs` |
| Frontend (Vercel) | `https://forecastguard.vercel.app` |

---

*ForecastGuard · MoES SIH26079 · Academic research prototype · Not for operational use*
