# AI Feature Testing Guide
## Price Prediction & Image Classification

This guide walks through every way to test the AI feature — automated tests,
manual HTTP calls, and the Django shell. It reflects the exact current state of
the codebase.

---

## 1. Prerequisites

### 1.1 Environment

All commands must run inside the project venv:

```bash
# Windows (PowerShell)
C:\Users\WELCOME\Desktop\workspace\demo-hack-env\Scripts\activate

# Then cd into the backend directory
cd backend
```

### 1.2 PostgreSQL

The DB-dependent tests and the dev server both require a running PostgreSQL
instance. The default connection settings (from `.env.example`) are:

```
host: 127.0.0.1
port: 5432
db:   agronet_db
user: postgres
pass: postgres
```

Start PostgreSQL, then run migrations if you haven't already:

```bash
python manage.py migrate
```

### 1.3 Environment file

Copy `.env.example` to `.env` and fill in real values where needed:

```bash
cp .env.example .env
```

The AI-specific variables are:

| Variable | Required for | Default |
|---|---|---|
| `AI_MODEL_PATH` | Price prediction (real model) | `ai/model/price_model.keras` |
| `AI_MODEL_VERSION` | Price prediction | `v1.0` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Image classification (real API) | *(none — must be set)* |

> **Note:** Neither TensorFlow nor the Google Vision library needs to be
> installed to run the automated tests — all external calls are mocked.
> The dev server will log a warning at startup if the model file is missing,
> but it will still start.

---

## 2. Running the Automated Tests

### 2.1 Property-based tests (no DB required)

These tests run entirely in-memory and finish in under 10 seconds:

```bash
python -m pytest tests/test_ai_properties.py -k "not persisted and not history" -v
```

Expected output — 8 tests, all green:

```
tests/test_ai_properties.py::test_classify_image_response_serializer_round_trip PASSED
tests/test_ai_properties.py::test_non_positive_quantity_always_rejected        PASSED
tests/test_ai_properties.py::test_invalid_unit_always_rejected                 PASSED
tests/test_ai_properties.py::test_invalid_season_always_rejected               PASSED
tests/test_ai_properties.py::test_missing_required_fields_always_rejected      PASSED
tests/test_ai_properties.py::test_classification_labels_ordered_by_confidence_descending PASSED
tests/test_ai_properties.py::test_non_https_url_always_rejected                PASSED
tests/test_ai_properties.py::test_oversized_file_always_rejected               PASSED
```

### 2.2 All property-based tests (DB required)

With PostgreSQL running:

```bash
python -m pytest tests/test_ai_properties.py -v
```

This adds 5 more DB-backed tests:
- `test_successful_prediction_always_persisted` (Property 6)
- `test_failed_prediction_never_persisted` (Property 7)
- `test_successful_classification_always_persisted` (Property 15)
- `test_prediction_history_isolated_per_user` (Property 8)
- `test_classification_history_isolated_per_user` (Property 17)

### 2.3 Integration tests (DB required)

```bash
python -m pytest tests/test_ai_integration.py -v
```

This runs 3 test classes covering 20 scenarios:

| Class | What it tests |
|---|---|
| `PricePredictionIntegrationTests` | Auth, 503/500 errors, valid prediction, singleton, env vars, history |
| `ImageClassificationIntegrationTests` | Auth, input validation, 503/422 errors, empty labels, valid classification, history |
| `ClassificationIdIntegrationTests` | 404 on missing ID, 403 on wrong owner, crop_type auto-population |

### 2.4 Run everything at once

```bash
python -m pytest tests/test_ai_properties.py tests/test_ai_integration.py -v
```

### 2.5 Run a single test by name

```bash
python -m pytest tests/test_ai_integration.py::PricePredictionIntegrationTests::test_valid_prediction_returns_200 -v
python -m pytest tests/test_ai_integration.py::ClassificationIdIntegrationTests::test_classification_id_wrong_owner_returns_403 -v
```

---

## 3. Manual HTTP Testing (Dev Server)

### 3.1 Start the server

```bash
python manage.py runserver
```

The server starts on `http://127.0.0.1:8000`. At startup you will see:

```
WARNING AI price prediction model could not be loaded at startup: TensorFlow is
not installed; cannot load the prediction model. Prediction requests will return
HTTP 503 until the model is available.
```

This is expected if TensorFlow is not installed. The server still starts and all
classification endpoints work normally.

### 3.2 Register a user

```bash
curl -s -X POST http://127.0.0.1:8000/api/users/register/ \
  -H "Content-Type: application/json" \
  -d '{"email": "farmer@test.com", "password": "securepass123", "role": "farmer"}' \
  | python -m json.tool
```

### 3.3 Get a JWT token

```bash
curl -s -X POST http://127.0.0.1:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"email": "farmer@test.com", "password": "securepass123"}' \
  | python -m json.tool
```

Copy the `access` token. All subsequent requests use:

```
Authorization: Bearer <access_token>
```

Set it as a shell variable for convenience:

```bash
TOKEN="<paste_access_token_here>"
```

---

## 4. Price Prediction Endpoint

**URL:** `POST /api/ai/predict-price/`  
**Auth:** Bearer token required

### 4.1 Valid request (will return 503 without a real TF model)

```bash
curl -s -X POST http://127.0.0.1:8000/api/ai/predict-price/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "crop_type": "Tomato",
    "quantity": "50.00",
    "unit": "kg",
    "location": "Lagos, Nigeria",
    "season": "dry"
  }' | python -m json.tool
```

Without a real model file, expected response (HTTP 503):

```json
{
  "success": false,
  "error": {
    "status_code": 503,
    "message": "prediction model is not available",
    "details": {}
  }
}
```

### 4.2 Validation errors

**Missing field (HTTP 400):**

```bash
curl -s -X POST http://127.0.0.1:8000/api/ai/predict-price/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"crop_type": "Tomato", "unit": "kg", "location": "Lagos", "season": "dry"}' \
  | python -m json.tool
```

**Non-positive quantity (HTTP 400):**

```bash
curl -s -X POST http://127.0.0.1:8000/api/ai/predict-price/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"crop_type": "Tomato", "quantity": "-5", "unit": "kg", "location": "Lagos", "season": "dry"}' \
  | python -m json.tool
```

Expected:
```json
{"success": false, "error": {"status_code": 400, "message": "quantity must be greater than zero", ...}}
```

**Invalid unit (HTTP 400):**

```bash
curl -s -X POST http://127.0.0.1:8000/api/ai/predict-price/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"crop_type": "Tomato", "quantity": "10", "unit": "gallons", "location": "Lagos", "season": "dry"}' \
  | python -m json.tool
```

**Invalid season (HTTP 400):**

```bash
curl -s -X POST http://127.0.0.1:8000/api/ai/predict-price/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"crop_type": "Tomato", "quantity": "10", "unit": "kg", "location": "Lagos", "season": "summer"}' \
  | python -m json.tool
```

Valid values: `dry`, `wet`, `harmattan`, `off-season`

### 4.3 Unauthenticated request (HTTP 401)

```bash
curl -s -X POST http://127.0.0.1:8000/api/ai/predict-price/ \
  -H "Content-Type: application/json" \
  -d '{"crop_type": "Tomato", "quantity": "10", "unit": "kg", "location": "Lagos", "season": "dry"}' \
  | python -m json.tool
```

### 4.4 Prediction history (GET)

```bash
curl -s http://127.0.0.1:8000/api/ai/predict-price/ \
  -H "Authorization: Bearer $TOKEN" \
  | python -m json.tool
```

Returns paginated list. Empty when no predictions exist:

```json
{"count": 0, "next": null, "previous": null, "results": []}
```

---

## 5. Image Classification Endpoint

**URL:** `POST /api/ai/classify-image/`  
**Auth:** Bearer token required

### 5.1 Upload a file (multipart/form-data)

```bash
curl -s -X POST http://127.0.0.1:8000/api/ai/classify-image/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/path/to/your/tomato.jpg" \
  | python -m json.tool
```

Without `GOOGLE_APPLICATION_CREDENTIALS` set, expected response (HTTP 503):

```json
{
  "success": false,
  "error": {
    "status_code": 503,
    "message": "image classification service is unavailable",
    "details": {}
  }
}
```

With valid credentials and a real image, expected (HTTP 200):

```json
{
  "success": true,
  "classification_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "labels": [
    {"label": "Tomato", "confidence": 0.9821},
    {"label": "Vegetable", "confidence": 0.8743}
  ],
  "created_at": "2026-03-25T14:00:00Z"
}
```

### 5.2 Classify via URL

```bash
curl -s -X POST http://127.0.0.1:8000/api/ai/classify-image/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"image_url": "https://upload.wikimedia.org/wikipedia/commons/8/88/Salad_garden.jpg"}' \
  | python -m json.tool
```

### 5.3 Validation errors

**Both inputs absent (HTTP 400):**

```bash
curl -s -X POST http://127.0.0.1:8000/api/ai/classify-image/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | python -m json.tool
```

**Non-HTTPS URL (HTTP 400):**

```bash
curl -s -X POST http://127.0.0.1:8000/api/ai/classify-image/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"image_url": "http://example.com/image.jpg"}' \
  | python -m json.tool
```

**Wrong MIME type (HTTP 415):**

```bash
# Create a fake PDF file
echo "%PDF-1.4 fake" > /tmp/fake.pdf

curl -s -X POST http://127.0.0.1:8000/api/ai/classify-image/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/tmp/fake.pdf;type=application/pdf" \
  | python -m json.tool
```

**Oversized file (HTTP 413):**

```bash
# Create a file > 10 MB
dd if=/dev/zero bs=1M count=11 > /tmp/big.jpg 2>/dev/null

curl -s -X POST http://127.0.0.1:8000/api/ai/classify-image/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/tmp/big.jpg;type=image/jpeg" \
  | python -m json.tool
```

### 5.4 Classification history (GET)

```bash
curl -s http://127.0.0.1:8000/api/ai/classify-image/ \
  -H "Authorization: Bearer $TOKEN" \
  | python -m json.tool
```

---

## 6. classification_id → crop_type Flow

This tests the downstream integration where a prior classification result
auto-populates `crop_type` when listing a product.

### Step 1 — Get a classification_id

Either from a real classification response, or insert one directly via the
Django shell (see Section 7).

### Step 2 — Create a product using the classification_id

```bash
curl -s -X POST http://127.0.0.1:8000/api/products/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fresh Tomatoes",
    "description": "Organic tomatoes from the farm.",
    "quantity": "200.00",
    "unit": "kg",
    "price_per_unit": "350.00",
    "location": "Ibadan, Nigeria",
    "classification_id": "<uuid-from-step-1>"
  }' | python -m json.tool
```

Expected (HTTP 201) — `crop_type` is auto-populated from the top label:

```json
{
  "id": "...",
  "crop_type": "Tomato",
  ...
}
```

### Step 3 — Test ownership enforcement (HTTP 403)

Log in as a different user, get their token, then try to use the first user's
`classification_id`:

```bash
# Register second user
curl -s -X POST http://127.0.0.1:8000/api/users/register/ \
  -H "Content-Type: application/json" \
  -d '{"email": "farmer2@test.com", "password": "securepass123", "role": "farmer"}'

# Get token for second user
TOKEN2=$(curl -s -X POST http://127.0.0.1:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"email": "farmer2@test.com", "password": "securepass123"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['access'])")

# Try to use farmer1's classification_id — should return 403
curl -s -X POST http://127.0.0.1:8000/api/products/ \
  -H "Authorization: Bearer $TOKEN2" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Stolen Crop",
    "description": "...",
    "quantity": "10.00",
    "unit": "kg",
    "price_per_unit": "100.00",
    "location": "Lagos",
    "classification_id": "<farmer1-classification-uuid>"
  }' | python -m json.tool
```

### Step 4 — Test non-existent classification_id (HTTP 404)

```bash
curl -s -X POST http://127.0.0.1:8000/api/products/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "description": "...",
    "quantity": "10.00",
    "unit": "kg",
    "price_per_unit": "100.00",
    "location": "Lagos",
    "classification_id": "00000000-0000-0000-0000-000000000000"
  }' | python -m json.tool
```

---

## 7. Django Shell — Direct Service Testing

Use this to test service logic without HTTP overhead, or to seed data for
manual HTTP tests.

```bash
python manage.py shell
```

### 7.1 Seed an ImageClassification record

```python
from users.models import User, Role
from ai.models import ImageClassification, ImageSource

# Get or create a farmer
user, _ = User.objects.get_or_create(
    email="farmer@test.com",
    defaults={"role": Role.FARMER}
)

# Create a classification record directly
cls_record = ImageClassification.objects.create(
    user=user,
    image_source=ImageSource.UPLOAD,
    labels=[
        {"label": "Tomato", "confidence": 0.9821},
        {"label": "Vegetable", "confidence": 0.8743},
    ],
)

print(f"classification_id: {cls_record.id}")
print(f"top label: {cls_record.labels[0]['label']}")
```

### 7.2 Test PredictionService with a mock model

```python
from unittest.mock import MagicMock
import numpy as np
from decimal import Decimal
from ai.services import PredictionService
from users.models import User

user = User.objects.get(email="farmer@test.com")

# Inject a mock model
mock_model = MagicMock()
mock_model.predict.return_value = np.array([[500.0]])
PredictionService._model = mock_model

result = PredictionService.predict(
    crop_type="Tomato",
    quantity=Decimal("50.00"),
    unit="kg",
    location="Lagos",
    season="dry",
    user_id=user.id,
)

print(result)
# {'predicted_price': Decimal('500.00'), 'lower_bound': Decimal('450.00'),
#  'upper_bound': Decimal('550.00'), 'model_version': 'v1.0'}

# Reset singleton
PredictionService._model = None
```

### 7.3 Test ClassificationService with a mock Vision API

```python
from unittest.mock import MagicMock, patch
from ai.services import ClassificationService
from users.models import User
import os

user = User.objects.get(email="farmer@test.com")

mock_annotations = [
    MagicMock(description="Tomato", score=0.9821),
    MagicMock(description="Vegetable", score=0.8743),
]
mock_response = MagicMock()
mock_response.error.message = ""
mock_response.label_annotations = mock_annotations

mock_client = MagicMock()
mock_client.label_detection.return_value = mock_response

with patch.dict(os.environ, {"GOOGLE_APPLICATION_CREDENTIALS": "/fake/creds.json"}):
    with patch("ai.services.vision") as mock_vision:
        mock_vision.ImageAnnotatorClient.return_value = mock_client
        mock_vision.Image.return_value = MagicMock()

        result = ClassificationService.classify(
            user_id=user.id,
            image_bytes=b"fake-image-bytes",
        )

print(result)
# {'classification_id': UUID('...'), 'labels': [{'label': 'Tomato', 'confidence': 0.9821}, ...],
#  'success': True, 'created_at': datetime(...)}
```

### 7.4 Inspect persisted records

```python
from ai.models import PricePrediction, ImageClassification
from users.models import User

user = User.objects.get(email="farmer@test.com")

# All predictions for this user
for p in PricePrediction.objects.filter(user=user):
    print(p)

# All classifications for this user
for c in ImageClassification.objects.filter(user=user):
    print(c, c.labels)
```

---

## 8. Swagger UI

The project ships with a dark-mode Swagger UI. With the dev server running:

```
http://127.0.0.1:8000/api/docs/
```

1. Click **Authorize** and enter `Bearer <your_token>`
2. Find the `/api/ai/predict-price/` and `/api/ai/classify-image/` endpoints
3. Use **Try it out** to send requests interactively

---

## 9. Known Limitations in the Current State

| Limitation | Reason | Workaround |
|---|---|---|
| Price prediction returns 503 | TensorFlow not installed in `demo-hack-env` | Mock the model in tests or install `tensorflow` |
| Image classification returns 503 | `GOOGLE_APPLICATION_CREDENTIALS` not set | Set the env var to a real service account JSON path |
| DB tests fail without Postgres | Tests use `@pytest.mark.django_db` | Start PostgreSQL on `127.0.0.1:5432` |
| `AiConfig.ready()` logs a warning | Model file `ai/model/price_model.keras` doesn't exist | Expected — server still starts normally |

---

## 10. Quick Reference

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/users/register/` | POST | None | Create a user |
| `/api/auth/token/` | POST | None | Get JWT tokens |
| `/api/ai/predict-price/` | POST | Bearer | Submit prediction request |
| `/api/ai/predict-price/` | GET | Bearer | Get prediction history |
| `/api/ai/classify-image/` | POST | Bearer | Classify image (file or URL) |
| `/api/ai/classify-image/` | GET | Bearer | Get classification history |
| `/api/products/` | POST | Bearer (farmer) | Create product (with optional `classification_id`) |

Valid `unit` values: `kg`, `tonnes`, `bags`, `crates`, `pieces`

Valid `season` values: `dry`, `wet`, `harmattan`, `off-season`
