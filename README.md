# ForecastGuard

<div align="center">

**AI-Based Weather Forecast Bust Detection Platform**

*Ministry of Earth Sciences · Smart India Hackathon 2026 · Problem SIH26079*

[![CI](https://github.com/YOUR_USERNAME/ForecastGuard/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR_USERNAME/ForecastGuard/actions)
[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![XGBoost](https://img.shields.io/badge/XGBoost-ML_Model-orange)](https://xgboost.readthedocs.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

🌐 **Live Demo:** `https://forecastguard.vercel.app` *(set after Vercel deployment)*
🔗 **API Docs:** `https://forecastguard-api.onrender.com/docs` *(set after Render deployment)*

</div>

---

## 🌧 What is ForecastGuard?

ForecastGuard is a **forecast reliability intelligence dashboard** that wraps a trained XGBoost ensemble ML model to predict the probability that a **Day-5 heavy rainfall forecast over the Western Ghats will bust** during the Indian Summer Monsoon (JJAS).

> **Important:** ForecastGuard does **not** forecast rainfall. It evaluates *whether an existing numerical weather prediction is likely to be unreliable*, helping meteorologists prioritize human review before high-stakes decisions.

### The Problem

Medium-range (Day-5) heavy rainfall forecasts over the Western Ghats occasionally fail catastrophically — the forecast predicts heavy rain that doesn't materialise, or misses extreme events entirely. These "busts" happen when:

- **Ensemble spread is high** (members disagree strongly)
- **Run-to-run inconsistency** is elevated (the forecast keeps changing)
- **Control run diverges** from the ensemble mean
- **Large-scale monsoon circulation** is in a transitional state

### Our Solution

A trained XGBoost classifier uses only **information available at forecast issue time** (ensemble statistics, not actual rainfall) to output a bust probability score (0–100%). The model was trained on 20 years of GEFS/ERA5 data (2000–2019, JJAS) across three Western Ghats sub-regions.

---

## 🗺 Western Ghats Focus Regions

| Region | Coverage | Lat Band | Lon Band |
|--------|----------|----------|----------|
| WG North | Maharashtra, Goa (Konkan) | 15–21°N | 72.5–75.5°E |
| WG Central | Karnataka (Agumbe, Malnad) | 11.5–15°N | 73.5–76.5°E |
| WG South | Kerala, Cardamom Hills | 8–11.5°N | 75–77.5°E |

---

## 📊 Dashboard Features

| Page | Description |
|------|-------------|
| **Overview** | Regional bust risk summary, day-wise forecast risk (D+3–D+7), model comparison chart, historical analogs, alert queue |
| **Test Model** ⭐ | Enter real ensemble parameters → get actual ML prediction + TreeSHAP explanation |
| **Risk Explorer** | Interactive Leaflet/OpenStreetMap map of Western Ghats with regional overlays |
| **Model Comparison** | Side-by-side evaluation metrics (ROC-AUC, PR-AUC, Brier Skill) across model variants |
| **Historical Analogs** | Browse 3,660 out-of-fold prediction records across 20 monsoon seasons |
| **Validation** | Model skill metrics with charts across stratified/absolute/heavy bust definitions |
| **Alert Review** | Manage and triage high-risk forecast alerts |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────┐
│                   User Browser                      │
│  React 18 + Vite + TypeScript + Tailwind CSS v4     │
│  Recharts · React-Leaflet/OpenStreetMap · Axios     │
│           Deployed on: Vercel                        │
└──────────────────────┬──────────────────────────────┘
                       │  HTTPS REST API
                       ▼
┌─────────────────────────────────────────────────────┐
│                FastAPI Backend                      │
│  Python 3.11 · Uvicorn · Pydantic v2                │
│  XGBoost · scikit-learn · joblib · pandas           │
│           Deployed on: Render                        │
└──────────────────────┬──────────────────────────────┘
                       │  joblib.load()
                       ▼
┌─────────────────────────────────────────────────────┐
│          Trained ML Model (read-only)               │
│  forecast_bust_wg_model_v5_wg_dataset_GEFS_IMD      │
│  XGBClassifier · core_xgb variant · 12 features    │
│  predict_proba + TreeSHAP (pred_contribs)           │
└─────────────────────────────────────────────────────┘
```

---

## 🤖 ML Model Details

### Model file
```
artifacts/forecast_bust_wg_model_v5_wg_dataset_GEFS_IMD.joblib  (0.51 MB)
```

### How it works

```python
import joblib
import numpy as np

obj = joblib.load("artifacts/forecast_bust_wg_model_v5_wg_dataset_GEFS_IMD.joblib")
xgb_model = obj["models"]["stratified"]["xgb"]    # XGBClassifier

# 12 features, in this exact order:
X = np.array([[log_fc_rain, log_ens_mean_rain, lead,
               log_ens_spread, log_ens_range_max, log_ens_iqr1090,
               ens_cv, ens_frac_gt10, ens_frac_gt25,
               log_hres_ens_absdiff, slog_hres_minus_ens,
               hres_ens_rel]], dtype=np.float32)

bust_probability = xgb_model.predict_proba(X)[0][1]  # P(bust)
```

### Input Features

| Feature | Description | Unit |
|---------|-------------|------|
| `log_fc_rain` | Log forecast rainfall | ln(1 + mm) |
| `log_ens_mean_rain` | Log ensemble mean rain | ln(1 + mm) |
| `lead` | Forecast lead time | days (3–7) |
| `log_ens_spread` | Ensemble std dev | ln(1 + mm) |
| `log_ens_range_max` | Max–min member range | ln(1 + mm) |
| `log_ens_iqr1090` | P10–P90 inter-quantile range | ln(1 + mm) |
| `ens_cv` | Coefficient of variation | ratio |
| `ens_frac_gt10` | Fraction of members > 10 mm | 0–1 |
| `ens_frac_gt25` | Fraction of members > 25 mm | 0–1 |
| `log_hres_ens_absdiff` | \|HRES − Ensemble Mean\| | ln(1 + mm) |
| `slog_hres_minus_ens` | Signed log(HRES − Ensemble) | signed ln |
| `hres_ens_rel` | HRES relative disagreement | ratio |

### Evaluation Subsets

| Subset | Bust Definition |
|--------|----------------|
| `stratified` | Top 1/3 of rainy days by regional quantile |
| `absolute` | Area-mean rain < threshold despite high forecast |
| `heavy` | Day exceeds 25 mm threshold but model missed it |

---

## 🛠 Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 18 + TypeScript |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Maps | React-Leaflet + OpenStreetMap |
| HTTP Client | Axios |
| Backend Framework | FastAPI |
| ML Runtime | XGBoost + scikit-learn |
| Model Serialisation | joblib |
| Data Processing | pandas + NumPy |
| Server | Uvicorn |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |

---

## 📁 Project Structure

```
ForecastGuard/
├── artifacts/                    ← Research artifacts (READ-ONLY, committed to repo)
│   ├── forecast_bust_wg_model_v5_wg_dataset_GEFS_IMD.joblib   (0.51 MB)
│   ├── results_summary_v5_wg_dataset_GEFS_IMD.csv
│   ├── oof_predictions_{stratified|absolute|heavy}_v5_...csv
│   ├── results_figures_v5_wg_dataset_GEFS_IMD.png
│   └── bust_drivers_v5_wg_dataset_GEFS_IMD.png
│
├── backend/                      ← FastAPI backend
│   ├── app/
│   │   ├── main.py               # App entry point, CORS, /api/health, /api/overview
│   │   ├── ml/
│   │   │   ├── model_loader.py   # Loads joblib safely (read-only)
│   │   │   ├── predictor.py      # predict_proba + TreeSHAP
│   │   │   └── feature_schema.py # Feature metadata + presets
│   │   ├── routes/               # API route modules
│   │   └── services/
│   │       └── data_service.py   # CSV parsing, alert state
│   ├── artifacts/                # Symlinked/copied from root artifacts/
│   ├── requirements.txt
│   ├── runtime.txt               # python-3.11.0
│   └── Procfile                  # Render/Heroku start command
│
├── frontend/                     ← React frontend
│   ├── src/
│   │   ├── pages/                # 7 dashboard pages
│   │   ├── components/           # Layout, shared UI
│   │   ├── services/api.ts       # Axios client (uses VITE_API_URL)
│   │   └── types.ts
│   ├── public/
│   ├── vercel.json               # Vercel SPA routing
│   ├── .env.example              # Environment variable template
│   ├── package.json
│   └── vite.config.ts
│
├── .github/workflows/deploy.yml  ← CI: build test on every push
├── render.yaml                   ← Render deployment config
├── .gitignore
├── .env.example                  ← Environment variable documentation
├── LICENSE                       ← MIT License
├── README.md                     ← This file
└── DEPLOYMENT_GUIDE.md           ← Step-by-step deployment for beginners
```

---

## 🚀 Local Setup

### Prerequisites

- **Python 3.11+** — [python.org/downloads](https://www.python.org/downloads/)
- **Node.js v20+** — [nodejs.org](https://nodejs.org) (or use the bundled `nodejs/` on Windows)
- **pip** (comes with Python)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/ForecastGuard.git
cd ForecastGuard
```

### 2. Backend setup

```bash
cd backend
pip install -r requirements.txt

# Start the API server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend starts at **http://localhost:8000**

> ⏳ First start takes ~10–15 seconds while XGBoost deserialises the trained model.

API docs available at: **http://localhost:8000/docs**

### 3. Frontend setup

```bash
cd frontend
npm install

# Start the development server
npm run dev
```

The app opens at **http://localhost:5173**

> The Vite dev server automatically proxies `/api` requests to `localhost:8000`.

### 4. (Optional) Run both with one command — Windows

```bat
start_all.bat
```

---

## 🌐 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Backend & model status |
| GET | `/api/overview` | Full dashboard data |
| GET | `/api/model-info` | Model metadata + feature schema |
| GET | `/api/feature-schema` | Feature groups, units, ranges, presets |
| **POST** | **`/api/predict`** | **Real ML prediction + TreeSHAP explanation** |
| GET | `/api/regions` | WG region coordinates |
| GET | `/api/historical` | OOF prediction records (filterable) |
| GET | `/api/model-comparison` | Evaluation metrics from results CSV |
| GET | `/api/validation` | Validation summary across subsets |
| GET | `/api/alerts` | Alert queue |
| PATCH | `/api/alerts/{id}` | Update alert status |

### Quick test (requires backend running)

```bash
curl -X POST http://localhost:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "features": {
      "log_fc_rain": 4.5, "log_ens_mean_rain": 3.8, "lead": 5.0,
      "log_ens_spread": 3.2, "log_ens_range_max": 4.8, "log_ens_iqr1090": 3.6,
      "ens_cv": 1.45, "ens_frac_gt10": 0.85, "ens_frac_gt25": 0.70,
      "log_hres_ens_absdiff": 3.9, "slog_hres_minus_ens": 3.5, "hres_ens_rel": 1.25
    },
    "subset": "stratified",
    "region": "WG_South"
  }'
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `ALLOWED_ORIGINS` | Comma-separated frontend URLs | `*` (dev only) |
| `PORT` | Uvicorn listen port | `8000` |

### Frontend (`frontend/.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend URL (empty = use Vite proxy) | `` (empty) |

---

## 🚢 Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed beginner-friendly instructions.

**Quick summary:**
1. Push this repo to GitHub
2. Deploy backend → Render (free tier, ~1 min)
3. Deploy frontend → Vercel (free tier, ~1 min)
4. Set `VITE_API_URL=https://your-render-url.onrender.com` in Vercel env vars
5. Set `ALLOWED_ORIGINS=https://your-vercel-url.vercel.app` in Render env vars

---

## ⚠️ Limitations & Disclaimer

- **Not for operational use.** This is an academic research prototype.
- Predictions are based on historical GEFS/ERA5 data (2000–2019 JJAS). Performance on future forecasts may differ.
- Risk thresholds (Low ≤30%, Moderate 31–60%, High >60%) are **presentation labels only** — not scientifically validated operational cutoffs.
- Regional risk values on the Overview page are **illustrative sample data**, not live forecasts.
- The backend Render free tier spins down after 15 minutes of inactivity. The first request after spin-down takes ~30–60 seconds (cold start + model loading).

---

## 👥 Team

Built for **Ministry of Earth Sciences · SIH26079**  
Research focus: AI-Based Forecast Bust Detection for Medium-Range Weather Forecasts  
Region: Western Ghats · Season: Indian Summer Monsoon (JJAS) · Lead time: Day-5

---

## 📄 License

MIT License — see [LICENSE](LICENSE)

> *Smarter weather intelligence for a more resilient India.*
