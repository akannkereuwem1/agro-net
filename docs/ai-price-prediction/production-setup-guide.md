# AI Feature — Production Setup & Testing Guide

This guide covers everything needed to get the AI price prediction and image
classification features running end-to-end in a production environment.

---

## 1. What's Missing from the Current Repo

The codebase is fully implemented but two external dependencies are not yet
in `requirements.txt` and the model file does not exist:

| Missing | Needed for | Action |
|---|---|---|
| `tensorflow` | Price prediction inference | Install + add to requirements |
| `google-cloud-vision` | Image classification | Install + add to requirements |
| `ai/model/price_model.keras` | Price prediction | Train or obtain a `.keras` model file |
| `GOOGLE_APPLICATION_CREDENTIALS` | Image classification | Create a GCP service account |

---

## 2. Install the AI Dependencies

From the project root, with the venv active:

```bash
# Windows
C:\Users\WELCOME\Desktop\workspace\demo-hack-env\Scripts\activate

uv add tensorflow google-cloud-vision --project .
```

Or add them directly to `requirements.txt` and reinstall:

```
tensorflow==2.17.0
google-cloud-vision==3.7.2
```

```bash
uv pip install -r requirements.txt
```

Verify both are importable:

```bash
python -c "import tensorflow as tf; print(tf.__version__)"
python -c "from google.cloud import vision; print('vision ok')"
```

---

## 3. Prepare the TensorFlow Model

The service expects a Keras `.keras` file at the path set by `AI_MODEL_PATH`
(default: `ai/model/price_model.keras` relative to the working directory,
which is `backend/` when running with gunicorn or `manage.py`).

### 3.1 Create the model directory

```bash
mkdir -p backend/ai/model
```

### 3.2 Option A — Use a real trained model

Place your trained `.keras` file at:

```
backend/ai/model/price_model.keras
```

The model must accept a `(1, 5)` float32 input vector:
`[quantity, crop_type_enc, unit_enc, location_enc, season_enc]`

and return a `(1, 1)` output — the predicted price.

### 3.3 Option B — Create a dummy model for smoke testing

Run this once from the `backend/` directory to generate a minimal valid model:

```bash
python - <<'EOF'
import tensorflow as tf
import numpy as np

model = tf.keras.Sequential([
    tf.keras.layers.Dense(16, activation='relu', input_shape=(5,)),
    tf.keras.layers.Dense(1)
])
model.compile(optimizer='adam', loss='mse')

# Dummy training so weights are initialised
X = np.random.rand(100, 5).astype('float32')
y = np.random.rand(100, 1).astype('float32') * 1000
model.fit(X, y, epochs=1, verbose=0)

model.save('ai/model/price_model.keras')
print("Model saved to ai/model/price_model.keras")
EOF
```

This produces a real, loadable Keras model that returns plausible (random)
prices. It is sufficient to verify the full request/response flow.

---

## 4. Set Up Google Cloud Vision

### 4.1 Create a GCP service account

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Select your project (or create one)
3. Navigate to **IAM & Admin → Service Accounts**
4. Click **Create Service Account**
5. Name it `agronet-vision`, click **Create and Continue**
6. Assign the role **Cloud Vision API → Cloud Vision API User**
7. Click **Done**
8. Click the service account → **Keys** tab → **Add Key → Create new key → JSON**
9. Download the JSON file — save it somewhere safe, e.g.:
   ```
   C:\secrets\agronet-vision-sa.json
   ```

### 4.2 Enable the Vision API

```
https://console.cloud.google.com/apis/library/vision.googleapis.com
```

Click **Enable**.

### 4.3 Set the environment variable

In your `.env` file:

```
GOOGLE_APPLICATION_CREDENTIALS=C:\secrets\agronet-vision-sa.json
```

In production (Docker / Render / Railway), set this as an environment variable
pointing to the path where the JSON file is mounted inside the container.

---

## 5. Environment Variables for Production

Your `.env` (or server environment) must contain all of these:

```bash
# Django
DJANGO_SECRET_KEY=<long-random-string>
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database
DATABASE_URL=postgres://user:password@host:5432/agronet_db

# Cloudinary (for product images)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI — Price Prediction
AI_MODEL_PATH=/app/backend/ai/model/price_model.keras
AI_MODEL_VERSION=v1.0

# AI — Image Classification
GOOGLE_APPLICATION_CREDENTIALS=/run/secrets/gcp-vision-sa.json
```

`AI_MODEL_PATH` must be an absolute path in production because the working
directory may vary depending on how gunicorn is invoked.

---

## 6. Docker Production Build

### 6.1 Update the Dockerfile to include the model file

The `.dockerignore` currently excludes `.env` (correct) but does not exclude
the model file. Add the model to the image at build time:

```dockerfile
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/

# Collect static files
RUN cd backend && python manage.py collectstatic --noinput

WORKDIR /app/backend

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "config.wsgi:application"]
```

The model file at `backend/ai/model/price_model.keras` will be copied in by
`COPY . /app/`. Make sure it exists before building.

### 6.2 Build and run

```bash
# Build
docker build -t agronet-backend .

# Run — pass env vars and mount the GCP credentials file
docker run -p 8000:8000 \
  --env-file backend/.env \
  -e AI_MODEL_PATH=/app/backend/ai/model/price_model.keras \
  -e GOOGLE_APPLICATION_CREDENTIALS=/run/secrets/gcp-sa.json \
  -v C:\secrets\agronet-vision-sa.json:/run/secrets/gcp-sa.json:ro \
  agronet-backend
```

### 6.3 Run migrations inside the container

```bash
docker run --env-file backend/.env agronet-backend \
  python manage.py migrate
```

---

## 7. Verify the Server Starts Correctly

After starting the server (Docker or `gunicorn` directly), check the logs.

**Good startup — model loaded:**
```
INFO Starting gunicorn 25.1.0
INFO Listening at: http://0.0.0.0:8000
```
No warning about the model means `AiConfig.ready()` loaded it successfully.

**Acceptable startup — model missing:**
```
WARNING AI price prediction model could not be loaded at startup: Prediction
model file not found at '/app/backend/ai/model/price_model.keras'. Prediction
requests will return HTTP 503 until the model is available.
```
The server still starts. Fix by placing the model file at the configured path.

---

## 8. Run Migrations in Production

```bash
# Local
python backend/manage.py migrate

# Docker
docker run --env-file backend/.env agronet-backend python manage.py migrate
```

The AI migration creates two tables:
- `ai_price_predictions`
- `ai_image_classifications`

Verify they exist:

```bash
python backend/manage.py showmigrations ai
```

Expected:
```
ai
 [X] 0001_initial
```

---

## 9. End-to-End Smoke Test

With the server running at `https://yourdomain.com` (or `http://localhost:8000`
for local Docker), run through this sequence.

Set your base URL:

```bash
BASE=http://localhost:8000
```

### Step 1 — Register and authenticate

```bash
curl -s -X POST $BASE/api/users/register/ \
  -H "Content-Type: application/json" \
  -d '{"email": "prod-farmer@test.com", "password": "SecurePass123!", "role": "farmer"}'

TOKEN=$(curl -s -X POST $BASE/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"email": "prod-farmer@test.com", "password": "SecurePass123!"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['access'])")

echo "Token: $TOKEN"
```

### Step 2 — Price prediction

```bash
curl -s -X POST $BASE/api/ai/predict-price/ \
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

Expected (HTTP 200):
```json
{
  "success": true,
  "predicted_price": "487.23",
  "lower_bound": "438.51",
  "upper_bound": "535.95",
  "model_version": "v1.0"
}
```

If you get HTTP 503 with `"prediction model is not available"`, the model file
is not at the path set by `AI_MODEL_PATH`. Check the path and restart.

### Step 3 — Image classification via URL

```bash
curl -s -X POST $BASE/api/ai/classify-image/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"image_url": "https://upload.wikimedia.org/wikipedia/commons/8/88/Salad_garden.jpg"}' \
  | python -m json.tool
```

Expected (HTTP 200):
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

If you get HTTP 503 with `"image classification service is unavailable"`,
`GOOGLE_APPLICATION_CREDENTIALS` is not set or the Vision API is not enabled
on your GCP project.

### Step 4 — Use classification_id to create a product

```bash
# Copy the classification_id from Step 3
CLS_ID="<paste-classification_id-here>"

curl -s -X POST $BASE/api/products/ \
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

Expected (HTTP 201) — `crop_type` is auto-populated from the top Vision label:
```json
{
  "id": "...",
  "crop_type": "Plant",
  ...
}
```

### Step 5 — Verify history endpoints

```bash
# Prediction history
curl -s $BASE/api/ai/predict-price/ \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool

# Classification history
curl -s $BASE/api/ai/classify-image/ \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool
```

Both should return paginated results with the records created in Steps 2 and 3.

---

## 10. Run the Full Test Suite Against Production DB

With `DATABASE_URL` pointing to your production (or staging) database:

```bash
cd backend
python -m pytest tests/test_ai_properties.py tests/test_ai_integration.py -v
```

All 13 property tests and all integration tests should pass. The integration
tests create and clean up their own test database — they do not touch your
production data.

---

## 11. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `503 prediction model is not available` | Model file not found at `AI_MODEL_PATH` | Check the absolute path; ensure the file exists inside the container |
| `503 image classification service is unavailable` | `GOOGLE_APPLICATION_CREDENTIALS` not set or Vision API not enabled | Set the env var; enable the API in GCP console |
| `ImportError: No module named 'tensorflow'` | TF not in requirements | `uv add tensorflow` and rebuild the Docker image |
| `ImportError: No module named 'google.cloud.vision'` | Vision library not installed | `uv add google-cloud-vision` and rebuild |
| `django.db.utils.OperationalError` on startup | DB not reachable | Check `DATABASE_URL`; ensure Postgres is running and accessible |
| `WARNING AI price prediction model could not be loaded` | Expected if model file is absent | Place the `.keras` file at `AI_MODEL_PATH` and restart |
| Prediction returns a nonsensical price | Dummy model in use | Replace with a properly trained model |
