# AgroNet AI Feature — Setup Guide

Covers both sub-features:
- **Price Prediction** — powered by Google Gemini API
- **Image Classification** — powered by Google Cloud Vision API

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Python | 3.11+ | Must match `.python-version` |
| PostgreSQL | 14+ | Running on `127.0.0.1:5432` |
| Virtual environment | — | `demo-hack-env` — do not create a new one |

---

## Step 1 — Activate the virtual environment

```bash
# Windows PowerShell
C:\Users\WELCOME\Desktop\workspace\demo-hack-env\Scripts\activate
```

All subsequent commands assume this venv is active.

---

## Step 2 — Install dependencies

`google-generativeai` is already in `requirements.txt`. Install everything:

```bash
uv pip install -r requirements.txt
```

Verify the two AI libraries loaded correctly:

```bash
python -c "import google.generativeai; print('Gemini OK')"
python -c "from google.cloud import vision; print('Vision OK')"
```

If either fails, install individually:

```bash
uv add google-generativeai
uv add google-cloud-vision
```

---

## Step 3 — Configure environment variables

Copy the example file:

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in every value below.

### 3.1 Database

```
DB_NAME=agronet_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=127.0.0.1
DB_PORT=5432
```

Or use a single `DATABASE_URL` instead (takes precedence):

```
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/agronet_db
```

### 3.2 Django core

```
DJANGO_SECRET_KEY=<generate a long random string>
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1
```

Generate a secret key:

```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

### 3.3 Gemini API — Price Prediction

Get a free API key at **https://aistudio.google.com/app/apikey**

```
GEMINI_API_KEY=AIza...your_key_here
GEMINI_MODEL=gemini-1.5-flash
AI_MODEL_VERSION=gemini-1.5-flash
```

`gemini-1.5-flash` is the recommended model — it is fast, free-tier eligible,
and handles structured JSON output reliably.

### 3.4 Google Cloud Vision API — Image Classification

Follow the steps in Section 4 to obtain the credentials file, then set:

```
GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\your\service-account.json
```

### 3.5 Cloudinary — Product image uploads

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Step 4 — Set up Google Cloud Vision

### 4.1 Create a GCP project (skip if you already have one)

Go to https://console.cloud.google.com and create a project named `agronet`.

### 4.2 Enable the Vision API

Navigate to:

```
https://console.cloud.google.com/apis/library/vision.googleapis.com
```

Click **Enable**.

### 4.3 Create a service account

1. Go to **IAM & Admin → Service Accounts**
2. Click **Create Service Account**
3. Name: `agronet-vision` → click **Create and Continue**
4. Role: **Cloud Vision API User** → click **Continue** → **Done**
5. Click the service account row → **Keys** tab
6. **Add Key → Create new key → JSON** → download the file
7. Save it somewhere permanent, e.g.:
   ```
   C:\secrets\agronet-vision-sa.json
   ```

### 4.4 Set the env var

In `backend/.env`:

```
GOOGLE_APPLICATION_CREDENTIALS=C:\secrets\agronet-vision-sa.json
```

---

## Step 5 — Run database migrations

```bash
cd backend
python manage.py migrate
```

Verify the AI tables were created:

```bash
python manage.py showmigrations ai
```

Expected output:

```
ai
 [X] 0001_initial
```

This creates:
- `ai_price_predictions` — stores every prediction request and result
- `ai_image_classifications` — stores every classification request and result

---

## Step 6 — Verify the setup

Run this check before starting the server:

```bash
python manage.py check
```

No errors should appear. Warnings about `DEBUG=True` are fine for local dev.

---

## Step 7 — Start the development server

```bash
python manage.py runserver
```

### What you should see in the logs

**Gemini initialised successfully:**
```
INFO PredictionService: Gemini model 'gemini-1.5-flash' initialised.
```

**Gemini key missing (server still starts):**
```
WARNING AI price prediction model could not be loaded at startup:
GEMINI_API_KEY environment variable is not set. Prediction requests
will return HTTP 503 until the model is available.
```

Fix: add `GEMINI_API_KEY` to `.env` and restart.

---

## Step 8 — Smoke test the endpoints

### 8.1 Register a user

```bash
curl -s -X POST http://127.0.0.1:8000/api/users/register/ \
  -H "Content-Type: application/json" \
  -d '{"email": "farmer@test.com", "password": "SecurePass123!", "role": "farmer"}' \
  | python -m json.tool
```

### 8.2 Get a JWT token

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"email": "farmer@test.com", "password": "SecurePass123!"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['access'])")

echo "Token acquired: ${TOKEN:0:20}..."
```

### 8.3 Price prediction

```bash
curl -s -X POST http://127.0.0.1:8000/api/ai/predict-price/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "crop_type": "Tomato",
    "quantity": "100.00",
    "unit": "kg",
    "location": "Lagos, Nigeria",
    "season": "dry"
  }' | python -m json.tool
```

Expected response (HTTP 200):

```json
{
  "success": true,
  "predicted_price": "450.00",
  "lower_bound": "405.00",
  "upper_bound": "495.00",
  "model_version": "gemini-1.5-flash"
}
```

### 8.4 Image classification via URL

```bash
curl -s -X POST http://127.0.0.1:8000/api/ai/classify-image/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"image_url": "https://upload.wikimedia.org/wikipedia/commons/8/88/Salad_garden.jpg"}' \
  | python -m json.tool
```

Expected response (HTTP 200):

```json
{
  "success": true,
  "classification_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "labels": [
    {"label": "Plant", "confidence": 0.9654},
    {"label": "Vegetable", "confidence": 0.9123}
  ],
  "created_at": "2026-03-25T14:00:00Z"
}
```

### 8.5 Use classification_id to create a product

```bash
CLS_ID="<paste classification_id from step 8.4>"

curl -s -X POST http://127.0.0.1:8000/api/products/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Fresh Produce\",
    \"description\": \"Classified via Vision API.\",
    \"quantity\": \"50.00\",
    \"unit\": \"kg\",
    \"price_per_unit\": \"200.00\",
    \"location\": \"Lagos, Nigeria\",
    \"classification_id\": \"$CLS_ID\"
  }" | python -m json.tool
```

Expected (HTTP 201) — `crop_type` auto-populated from the top Vision label:

```json
{
  "id": "...",
  "crop_type": "Plant",
  ...
}
```

---

## Step 9 — Run the test suite

### Non-DB tests (no PostgreSQL needed)

```bash
cd backend
python -m pytest tests/test_ai_properties.py -k "not persisted and not history" -v
```

Expected: 8 passed.

### Full test suite (PostgreSQL required)

```bash
python -m pytest tests/test_ai_properties.py tests/test_ai_integration.py -v
```

Expected: all tests pass. The integration tests create and tear down their own
test database — they do not touch your development data.

---

## Environment variable reference

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DJANGO_SECRET_KEY` | Yes | insecure default | Django signing key |
| `DEBUG` | No | `True` | Set to `False` in production |
| `ALLOWED_HOSTS` | Yes (prod) | `*` | Comma-separated allowed hostnames |
| `DATABASE_URL` | No | built from DB_* vars | Full Postgres connection string |
| `DB_NAME` | No | `agronet_db` | Database name |
| `DB_USER` | No | `postgres` | Database user |
| `DB_PASSWORD` | No | `postgres` | Database password |
| `DB_HOST` | No | `127.0.0.1` | Database host |
| `DB_PORT` | No | `5432` | Database port |
| `GEMINI_API_KEY` | Yes | — | Gemini API key from AI Studio |
| `GEMINI_MODEL` | No | `gemini-1.5-flash` | Gemini model name |
| `AI_MODEL_VERSION` | No | value of `GEMINI_MODEL` | Tag stored on each prediction record |
| `GOOGLE_APPLICATION_CREDENTIALS` | Yes | — | Path to GCP service account JSON |
| `CLOUDINARY_CLOUD_NAME` | Yes | `test_cloud` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | `test_key` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | `test_secret` | Cloudinary API secret |

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `503 prediction model is not available` | `GEMINI_API_KEY` not set | Add key to `.env`, restart server |
| `503 prediction model is not available` | `google-generativeai` not installed | `uv add google-generativeai` |
| `500 prediction failed` | Gemini returned non-JSON or API error | Check logs; verify API key is valid and has quota |
| `503 image classification service is unavailable` | `GOOGLE_APPLICATION_CREDENTIALS` not set | Set path to service account JSON in `.env` |
| `503 image classification service is unavailable` | Vision API not enabled on GCP project | Enable it at console.cloud.google.com |
| `django.db.utils.OperationalError` | PostgreSQL not running | Start Postgres; verify `DB_HOST`/`DB_PORT` |
| `ModuleNotFoundError: google.generativeai` | Library not installed | `uv pip install -r requirements.txt` |
| `ModuleNotFoundError: google.cloud.vision` | Library not installed | `uv add google-cloud-vision` |
| `python manage.py migrate` fails | DB credentials wrong | Check `DB_*` vars in `.env` |
