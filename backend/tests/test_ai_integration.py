"""
Integration tests for the AI price prediction and image classification features.

Uses Django REST Framework's APITestCase and JWT authentication.
All external services (Gemini API, Vision API, requests.get) are mocked.

Covers Requirements: 1.3, 2.2, 2.3, 2.4, 4.3, 5.1, 5.2, 8.4, 9.4,
                     10.3, 10.4, 10.5, 10.6, 12.3, 13.2, 13.3
"""

import io
import json
import os
import uuid
from unittest.mock import MagicMock, patch

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from ai.exceptions import (
    InvalidImageContentError,
    ModelNotAvailableError,
    RemoteImageFetchError,
    VisionAPIConfigError,
    VisionAPIError,
)
from ai.models import ImageClassification, ImageSource
from ai.services import ClassificationService, PredictionService
from users.models import Role, User


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

PREDICT_URL = "/api/ai/predict-price/"
CLASSIFY_URL = "/api/ai/classify-image/"
PRODUCTS_URL = "/api/products/"

VALID_PREDICTION_PAYLOAD = {
    "crop_type": "Tomato",
    "quantity": "50.00",
    "unit": "kg",
    "location": "Lagos, Nigeria",
    "season": "dry",
}

VALID_PRODUCT_PAYLOAD = {
    "title": "Fresh Tomatoes",
    "description": "Organic tomatoes from the farm.",
    "quantity": "200.00",
    "unit": "kg",
    "price_per_unit": "350.00",
    "location": "Ibadan, Nigeria",
}


def _make_small_image() -> SimpleUploadedFile:
    """Return a minimal valid JPEG upload for tests."""
    return SimpleUploadedFile(
        name="test.jpg",
        content=io.BytesIO(b"\xff\xd8\xff\xe0" + b"\x00" * 16).getvalue(),
        content_type="image/jpeg",
    )


# ===========================================================================
# Class 1: PricePredictionIntegrationTests
# ===========================================================================


@pytest.mark.django_db
class PricePredictionIntegrationTests(APITestCase):
    """
    Integration tests for POST /api/ai/predict-price/ and
    GET /api/ai/predict-price/.

    Validates: Requirements 1.3, 2.2, 2.3, 2.4, 4.3, 5.1, 5.2
    """

    def setUp(self) -> None:
        """Create a farmer user and reset the PredictionService singleton."""
        self.farmer = User.objects.create_user(
            email="farmer@integration.test",
            password="securepass123",
            role=Role.FARMER,
        )
        # Always start with a clean model state
        PredictionService._model = None

    def tearDown(self) -> None:
        """Reset the PredictionService singleton after each test."""
        PredictionService._model = None

    def _auth_header(self, user: User) -> dict:
        """Return a Bearer token Authorization header for the given user."""
        token = RefreshToken.for_user(user)
        return {"HTTP_AUTHORIZATION": f"Bearer {token.access_token}"}

    # ── Authentication ───────────────────────────────────────────────────────

    def test_unauthenticated_post_returns_401(self) -> None:
        """POST without auth token must return 401. Validates: Req 5.1"""
        response = self.client.post(PREDICT_URL, VALID_PREDICTION_PAYLOAD, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_get_returns_401(self) -> None:
        """GET without auth token must return 401. Validates: Req 5.2"""
        response = self.client.get(PREDICT_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ── Service Error Handling ───────────────────────────────────────────────

    def test_model_not_found_returns_503(self) -> None:
        """
        When GEMINI_API_KEY is missing, load_model raises ModelNotAvailableError
        and POST must return 503 with the correct message.
        Validates: Req 2.3
        """
        PredictionService._model = None

        with patch.object(
            PredictionService,
            "load_model",
            side_effect=ModelNotAvailableError("GEMINI_API_KEY is not set"),
        ):
            response = self.client.post(
                PREDICT_URL,
                VALID_PREDICTION_PAYLOAD,
                format="json",
                **self._auth_header(self.farmer),
            )

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        body = response.json()
        self.assertIn("prediction model is not available", str(body).lower())

    def test_inference_failure_returns_500(self) -> None:
        """
        When Gemini generate_content raises an Exception, POST must return 500
        with the message 'prediction failed'.
        Validates: Req 2.4
        """
        mock_gemini = MagicMock()
        mock_gemini.generate_content.side_effect = Exception("Gemini API error")
        PredictionService._model = mock_gemini

        response = self.client.post(
            PREDICT_URL,
            VALID_PREDICTION_PAYLOAD,
            format="json",
            **self._auth_header(self.farmer),
        )

        self.assertEqual(response.status_code, 500)
        body = response.json()
        self.assertIn("prediction failed", str(body).lower())

    # ── Successful Prediction ────────────────────────────────────────────────

    def test_valid_prediction_returns_200(self) -> None:
        """
        A valid POST with a mocked Gemini response must return 200 with
        predicted_price, lower_bound, upper_bound, model_version, success: true.
        Validates: Req 1.3, 2.2
        """
        mock_gemini = MagicMock()
        mock_gemini.generate_content.return_value.text = json.dumps({
            "predicted_price": 500.00,
            "lower_bound": 450.00,
            "upper_bound": 550.00,
        })
        PredictionService._model = mock_gemini

        response = self.client.post(
            PREDICT_URL,
            VALID_PREDICTION_PAYLOAD,
            format="json",
            **self._auth_header(self.farmer),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertTrue(body.get("success"))
        self.assertIn("predicted_price", body)
        self.assertIn("lower_bound", body)
        self.assertIn("upper_bound", body)
        self.assertIn("model_version", body)

    def test_model_loaded_exactly_once(self) -> None:
        """
        Calling load_model() once with a mocked genai must set _model and call
        genai.GenerativeModel exactly once.
        Validates: Req 2.2 (singleton pattern)
        """
        PredictionService._model = None

        mock_model_instance = MagicMock()

        with patch("ai.services.genai") as mock_genai:
            mock_genai.GenerativeModel.return_value = mock_model_instance
            with patch.dict(os.environ, {"GEMINI_API_KEY": "test-key"}):
                PredictionService.load_model()

            self.assertIsNotNone(PredictionService._model)
            mock_genai.GenerativeModel.assert_called_once()

    def test_ai_model_path_env_var_default(self) -> None:
        """
        When GEMINI_MODEL is unset, load_model() must use 'gemini-1.5-flash'.
        Validates: Req 2.2
        """
        PredictionService._model = None
        env = {k: v for k, v in os.environ.items() if k not in ("GEMINI_MODEL", "GEMINI_API_KEY")}
        env["GEMINI_API_KEY"] = "test-key"

        with patch.dict(os.environ, env, clear=True):
            with patch("ai.services.genai") as mock_genai:
                mock_genai.GenerativeModel.return_value = MagicMock()
                PredictionService.load_model()
                mock_genai.GenerativeModel.assert_called_once_with("gemini-1.5-flash")

    def test_ai_model_path_env_var_override(self) -> None:
        """
        When GEMINI_MODEL=gemini-1.5-pro, load_model() must use that model.
        Validates: Req 2.2
        """
        PredictionService._model = None

        with patch.dict(os.environ, {"GEMINI_API_KEY": "test-key", "GEMINI_MODEL": "gemini-1.5-pro"}):
            with patch("ai.services.genai") as mock_genai:
                mock_genai.GenerativeModel.return_value = MagicMock()
                PredictionService.load_model()
                mock_genai.GenerativeModel.assert_called_once_with("gemini-1.5-pro")

    # ── Environment Variable: AI_MODEL_VERSION ───────────────────────────────

    def test_ai_model_version_default(self) -> None:
        """
        When AI_MODEL_VERSION and GEMINI_MODEL are unset, predict() must
        return model_version='gemini-1.5-flash'.
        Validates: Req 2.2
        """
        mock_gemini = MagicMock()
        mock_gemini.generate_content.return_value.text = json.dumps({
            "predicted_price": 100.00, "lower_bound": 90.00, "upper_bound": 110.00,
        })
        PredictionService._model = mock_gemini

        env = {k: v for k, v in os.environ.items() if k not in ("AI_MODEL_VERSION", "GEMINI_MODEL")}
        with patch.dict(os.environ, env, clear=True):
            result = PredictionService.predict(
                crop_type="Maize", quantity="10.00", unit="kg",
                location="Kano", season="wet", user_id=self.farmer.id,
            )

        self.assertEqual(result["model_version"], "gemini-1.5-flash")

    def test_ai_model_version_override(self) -> None:
        """
        When AI_MODEL_VERSION=v2.5, predict() must return model_version='v2.5'.
        Validates: Req 2.2
        """
        mock_gemini = MagicMock()
        mock_gemini.generate_content.return_value.text = json.dumps({
            "predicted_price": 100.00, "lower_bound": 90.00, "upper_bound": 110.00,
        })
        PredictionService._model = mock_gemini

        with patch.dict(os.environ, {"AI_MODEL_VERSION": "v2.5"}):
            result = PredictionService.predict(
                crop_type="Maize", quantity="10.00", unit="kg",
                location="Kano", season="wet", user_id=self.farmer.id,
            )

        self.assertEqual(result["model_version"], "v2.5")

    # ── History ──────────────────────────────────────────────────────────────

    def test_empty_prediction_history_returns_200(self) -> None:
        """
        GET with no prediction records must return 200 with an empty results list.
        Validates: Req 4.3
        """
        response = self.client.get(PREDICT_URL, **self._auth_header(self.farmer))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        results = body.get("results", body)
        self.assertEqual(results, [])


# ===========================================================================
# Class 2: ImageClassificationIntegrationTests
# ===========================================================================


@pytest.mark.django_db
class ImageClassificationIntegrationTests(APITestCase):
    """
    Integration tests for POST /api/ai/classify-image/ and
    GET /api/ai/classify-image/.

    Validates: Requirements 8.4, 9.4, 10.3, 10.4, 10.5, 10.6, 12.3
    """

    def setUp(self) -> None:
        """Create a farmer user."""
        self.farmer = User.objects.create_user(
            email="farmer_cls@integration.test",
            password="securepass123",
            role=Role.FARMER,
        )

    def _auth_header(self, user: User) -> dict:
        """Return a Bearer token Authorization header for the given user."""
        token = RefreshToken.for_user(user)
        return {"HTTP_AUTHORIZATION": f"Bearer {token.access_token}"}

    # ── Authentication ───────────────────────────────────────────────────────

    def test_unauthenticated_post_returns_401(self) -> None:
        """POST without auth token must return 401. Validates: Req 8.4"""
        response = self.client.post(CLASSIFY_URL, {}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_get_returns_401(self) -> None:
        """GET without auth token must return 401. Validates: Req 8.4"""
        response = self.client.get(CLASSIFY_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ── Input Validation ─────────────────────────────────────────────────────

    def test_both_inputs_absent_returns_400(self) -> None:
        """
        POST with neither image nor image_url must return 400.
        Validates: Req 9.4
        """
        response = self.client.post(
            CLASSIFY_URL,
            {},
            format="multipart",
            **self._auth_header(self.farmer),
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_both_inputs_present_returns_400(self) -> None:
        """
        POST with both image and image_url must return 400.
        Validates: Req 9.4
        """
        image = _make_small_image()
        response = self.client.post(
            CLASSIFY_URL,
            {"image": image, "image_url": "https://example.com/img.jpg"},
            format="multipart",
            **self._auth_header(self.farmer),
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ── Service Error Handling ───────────────────────────────────────────────

    def test_vision_api_down_returns_503(self) -> None:
        """
        When _call_vision_api raises VisionAPIError, POST must return 503
        with 'image classification service is unavailable'.
        Validates: Req 10.3
        """
        image = _make_small_image()

        with patch.object(
            ClassificationService,
            "_call_vision_api",
            side_effect=VisionAPIError("Vision API unreachable"),
        ):
            response = self.client.post(
                CLASSIFY_URL,
                {"image": image},
                format="multipart",
                **self._auth_header(self.farmer),
            )

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        body = response.json()
        self.assertIn("image classification service is unavailable", str(body).lower())

    def test_missing_credentials_returns_503(self) -> None:
        """
        When _call_vision_api raises VisionAPIConfigError, POST must return 503.
        Validates: Req 10.4
        """
        image = _make_small_image()

        with patch.object(
            ClassificationService,
            "_call_vision_api",
            side_effect=VisionAPIConfigError("credentials not set"),
        ):
            response = self.client.post(
                CLASSIFY_URL,
                {"image": image},
                format="multipart",
                **self._auth_header(self.farmer),
            )

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)

    def test_unrecognisable_image_returns_422(self) -> None:
        """
        When _call_vision_api raises InvalidImageContentError, POST must return
        422 with 'image could not be processed by the classification service'.
        Validates: Req 10.5
        """
        image = _make_small_image()

        with patch.object(
            ClassificationService,
            "_call_vision_api",
            side_effect=InvalidImageContentError("unrecognisable content"),
        ):
            response = self.client.post(
                CLASSIFY_URL,
                {"image": image},
                format="multipart",
                **self._auth_header(self.farmer),
            )

        self.assertEqual(response.status_code, 422)
        body = response.json()
        self.assertIn(
            "image could not be processed by the classification service",
            str(body).lower(),
        )

    def test_url_timeout_returns_422(self) -> None:
        """
        When _fetch_remote_image raises RemoteImageFetchError, POST with
        image_url must return 422 with 'could not fetch image from the provided URL'.
        Validates: Req 10.6
        """
        with patch.object(
            ClassificationService,
            "_fetch_remote_image",
            side_effect=RemoteImageFetchError("timeout"),
        ):
            response = self.client.post(
                CLASSIFY_URL,
                {"image_url": "https://example.com/slow.jpg"},
                format="json",
                **self._auth_header(self.farmer),
            )

        self.assertEqual(response.status_code, 422)
        body = response.json()
        self.assertIn("could not fetch image from the provided url", str(body).lower())

    # ── Successful Classification ────────────────────────────────────────────

    def test_empty_labels_returns_200(self) -> None:
        """
        When _call_vision_api returns [], POST must return 200 with labels: [].
        Validates: Req 10.3
        """
        image = _make_small_image()

        with patch.object(ClassificationService, "_call_vision_api", return_value=[]):
            response = self.client.post(
                CLASSIFY_URL,
                {"image": image},
                format="multipart",
                **self._auth_header(self.farmer),
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertEqual(body.get("labels"), [])

    def test_valid_classification_returns_200(self) -> None:
        """
        When _call_vision_api returns a label list, POST must return 200 with
        classification_id, labels, and success: true.
        Validates: Req 8.4, 10.3
        """
        image = _make_small_image()
        mock_labels = [{"label": "Tomato", "confidence": 0.95}]

        with patch.object(
            ClassificationService, "_call_vision_api", return_value=mock_labels
        ):
            response = self.client.post(
                CLASSIFY_URL,
                {"image": image},
                format="multipart",
                **self._auth_header(self.farmer),
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        self.assertTrue(body.get("success"))
        self.assertIn("classification_id", body)
        self.assertIn("labels", body)
        self.assertEqual(body["labels"], mock_labels)

    # ── History ──────────────────────────────────────────────────────────────

    def test_empty_classification_history_returns_200(self) -> None:
        """
        GET with no classification records must return 200 with empty results.
        Validates: Req 12.3
        """
        response = self.client.get(CLASSIFY_URL, **self._auth_header(self.farmer))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        body = response.json()
        results = body.get("results", body)
        self.assertEqual(results, [])


# ===========================================================================
# Class 3: ClassificationIdIntegrationTests
# ===========================================================================


@pytest.mark.django_db
class ClassificationIdIntegrationTests(APITestCase):
    """
    Integration tests for the classification_id → crop_type flow in
    POST /api/products/.

    Validates: Requirements 13.2, 13.3
    """

    def setUp(self) -> None:
        """
        Create two farmer users and an ImageClassification record owned by farmer_a.
        """
        self.farmer_a = User.objects.create_user(
            email="farmer_a@integration.test",
            password="securepass123",
            role=Role.FARMER,
        )
        self.farmer_b = User.objects.create_user(
            email="farmer_b@integration.test",
            password="securepass123",
            role=Role.FARMER,
        )
        self.classification = ImageClassification.objects.create(
            user=self.farmer_a,
            image_source=ImageSource.UPLOAD,
            labels=[
                {"label": "Tomato", "confidence": 0.95},
                {"label": "Vegetable", "confidence": 0.80},
            ],
        )

    def _auth_header(self, user: User) -> dict:
        """Return a Bearer token Authorization header for the given user."""
        token = RefreshToken.for_user(user)
        return {"HTTP_AUTHORIZATION": f"Bearer {token.access_token}"}

    def _product_payload(self, **overrides) -> dict:
        """Return a valid product payload, optionally overriding fields."""
        payload = dict(VALID_PRODUCT_PAYLOAD)
        payload.update(overrides)
        return payload

    # ── classification_id Validation ─────────────────────────────────────────

    def test_classification_id_not_found_returns_404(self) -> None:
        """
        POST to /api/products/ with a non-existent classification_id UUID
        must return 404 with 'classification record not found'.
        Validates: Req 13.2
        """
        payload = self._product_payload(
            classification_id=str(uuid.uuid4()),
        )
        response = self.client.post(
            PRODUCTS_URL,
            payload,
            format="json",
            **self._auth_header(self.farmer_a),
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        body = response.json()
        self.assertIn("classification record not found", str(body).lower())

    def test_classification_id_wrong_owner_returns_403(self) -> None:
        """
        farmer_b using farmer_a's classification_id must return 403 with
        'classification record does not belong to this user'.
        Validates: Req 13.2
        """
        payload = self._product_payload(
            classification_id=str(self.classification.id),
        )
        response = self.client.post(
            PRODUCTS_URL,
            payload,
            format="json",
            **self._auth_header(self.farmer_b),
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        body = response.json()
        self.assertIn(
            "classification record does not belong to this user",
            str(body).lower(),
        )

    def test_classification_id_auto_populates_crop_type(self) -> None:
        """
        farmer_a using their own classification_id must create a product with
        crop_type equal to the top label from the classification.
        Validates: Req 13.3
        """
        payload = self._product_payload(
            classification_id=str(self.classification.id),
        )
        response = self.client.post(
            PRODUCTS_URL,
            payload,
            format="json",
            **self._auth_header(self.farmer_a),
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        body = response.json()
        # Top label from classification is "Tomato"
        self.assertEqual(body.get("crop_type"), "Tomato")
