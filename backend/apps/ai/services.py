"""
Service layer for the AI app.

Contains PredictionService (Gemini-powered price prediction) and
ClassificationService (Google Cloud Vision image classification).
"""

import json
import logging
import os
import re
from decimal import Decimal
from uuid import UUID

import requests

try:
    import google.generativeai as genai
except ImportError:
    genai = None  # type: ignore[assignment]

try:
    from google.cloud import vision
except ImportError:
    vision = None  # type: ignore[assignment]

from .exceptions import (
    InvalidImageContentError,
    ModelNotAvailableError,
    PredictionError,
    RemoteImageFetchError,
    VisionAPIConfigError,
    VisionAPIError,
)
from .models import PricePrediction

logger = logging.getLogger(__name__)

_GEMINI_PROMPT = """You are an agricultural commodity price analyst specializing in Nigerian markets.

Your task is to estimate a realistic **current market price per unit (NGN)** for a given agricultural product using implicit knowledge of:

- Regional price variations across Nigeria (urban vs rural, North vs South)
- Seasonal supply and demand effects (harvest vs off-season)
- Inflation trends and recent food price movements in Nigeria
- Perishability and storage constraints of the crop
- Market type differences (farm gate, wholesale, retail open market)

You must internally simulate a reasoning process that considers:
1. Typical baseline price of the crop in Nigeria
2. Adjustments based on location (transport/logistics costs, demand density)
3. Adjustments based on season (scarcity vs abundance)
4. Quantity effects (bulk pricing vs small unit retail)
5. Volatility (recent fluctuations in Nigerian food markets)

Produce details:
- Crop type: {crop_type}
- Quantity: {quantity} {unit}
- Market location: {location}
- Season: {season}

Output STRICTLY a JSON object with no explanation:
{"predicted_price": 0.00, "lower_bound": 0.00, "upper_bound": 0.00}

Constraints:
- predicted_price = realistic price per unit in NGN (not total price)
- lower_bound = predicted_price * 0.9
- upper_bound = predicted_price * 1.1
- Round all values to 2 decimal places
- All values must be positive
- Do NOT output text outside JSON
"""


class PredictionService:
    """
    Handles price prediction using the Google Gemini generative AI API.

    ``load_model()`` validates the API key and initialises the Gemini client.
    ``predict()`` sends a structured prompt and parses the JSON response.
    No TensorFlow or .keras file is required.
    """

    _model = None  # holds the genai.GenerativeModel instance after load_model()

    @classmethod
    def load_model(cls) -> None:
        """
        Initialise the Gemini client using the ``GEMINI_API_KEY`` env var.

        Raises:
            ModelNotAvailableError: If ``GEMINI_API_KEY`` is not set or
                ``google-generativeai`` is not installed.
        """
        if genai is None:
            raise ModelNotAvailableError(
                "google-generativeai is not installed. "
                "Run: uv add google-generativeai"
            )

        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise ModelNotAvailableError(
                "GEMINI_API_KEY environment variable is not set."
            )

        genai.configure(api_key=api_key)
        model_name = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
        cls._model = genai.GenerativeModel(model_name)
        logger.info("PredictionService: Gemini model '%s' initialised.", model_name)

    @classmethod
    def predict(
        cls,
        crop_type: str,
        quantity: Decimal,
        unit: str,
        location: str,
        season: str,
        user_id: UUID,
    ) -> dict:
        """
        Request a price prediction from Gemini and persist the result.

        Sends a structured prompt to the Gemini API, parses the JSON response,
        persists a ``PricePrediction`` record, and returns the result dict.

        Args:
            crop_type: Type of agricultural produce (e.g. ``"Tomato"``).
            quantity: Quantity of produce (must be > 0).
            unit: Measurement unit (e.g. ``"kg"``).
            location: Geographic market location.
            season: Agricultural season.
            user_id: UUID of the requesting user.

        Returns:
            A dict with keys ``predicted_price``, ``lower_bound``,
            ``upper_bound``, and ``model_version``.

        Raises:
            ModelNotAvailableError: If ``load_model()`` has not been called.
            PredictionError: If the Gemini API call fails or returns
                unparseable output.
        """
        if cls._model is None:
            raise ModelNotAvailableError(
                "Prediction model is not loaded. Call load_model() first."
            )

        prompt = _GEMINI_PROMPT.format(
            crop_type=crop_type,
            quantity=quantity,
            unit=unit,
            location=location,
            season=season,
        )

        try:
            response = cls._model.generate_content(prompt)
            raw_text = response.text.strip()

            # Strip markdown code fences if the model wraps the JSON
            raw_text = re.sub(r"```(?:json)?", "", raw_text).strip().rstrip("`")

            data = json.loads(raw_text)
            predicted_price = Decimal(str(data["predicted_price"])).quantize(Decimal("0.01"))
            lower_bound = Decimal(str(data["lower_bound"])).quantize(Decimal("0.01"))
            upper_bound = Decimal(str(data["upper_bound"])).quantize(Decimal("0.01"))

        except Exception as exc:
            logger.error("Gemini prediction failed: %s", exc, exc_info=True)
            raise PredictionError("Prediction failed.") from exc

        model_version = os.environ.get(
            "AI_MODEL_VERSION",
            os.environ.get("GEMINI_MODEL", "gemini-1.5-flash"),
        )

        PricePrediction.objects.create(
            user_id=user_id,
            crop_type=crop_type,
            quantity=quantity,
            unit=unit,
            location=location,
            season=season,
            predicted_price=predicted_price,
            lower_bound=lower_bound,
            upper_bound=upper_bound,
            model_version=model_version,
        )

        return {
            "predicted_price": predicted_price,
            "lower_bound": lower_bound,
            "upper_bound": upper_bound,
            "model_version": model_version,
        }


class ClassificationService:
    """Handles Google Cloud Vision API image classification."""

    @staticmethod
    def _fetch_remote_image(url: str) -> bytes:
        """
        Fetch image bytes from a remote URL with a 5-second timeout.

        Args:
            url: Publicly accessible image URL.

        Returns:
            Raw image bytes from the response body.

        Raises:
            RemoteImageFetchError: On timeout or connection error.
        """
        try:
            response = requests.get(url, timeout=5)
            response.raise_for_status()
            return response.content
        except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as exc:
            raise RemoteImageFetchError(
                f"Could not fetch image from URL: {url}"
            ) from exc

    @staticmethod
    def _call_vision_api(image_bytes: bytes) -> list[dict]:
        """
        Call Google Vision API label_detection on image_bytes.

        Checks ``GOOGLE_APPLICATION_CREDENTIALS`` env var — raises
        ``VisionAPIConfigError`` if absent.  Calls
        ``vision.ImageAnnotatorClient().label_detection()``.

        Args:
            image_bytes: Raw bytes of the image to classify.

        Returns:
            Labels sorted by confidence descending as
            ``[{"label": str, "confidence": float}, ...]``.

        Raises:
            VisionAPIConfigError: If credentials env var is missing or
                ``google-cloud-vision`` is not installed.
            InvalidImageContentError: If the Vision API rejects the image
                content as unrecognisable (``InvalidArgument``).
            VisionAPIError: On any other Vision API failure.
        """
        credentials_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        if not credentials_path:
            raise VisionAPIConfigError(
                "GOOGLE_APPLICATION_CREDENTIALS environment variable is not set."
            )

        if vision is None:
            raise VisionAPIConfigError(
                "google-cloud-vision is not installed."
            )

        try:
            client = vision.ImageAnnotatorClient()
            image = vision.Image(content=image_bytes)
            response = client.label_detection(image=image)

            if response.error.message:
                raise VisionAPIError(response.error.message)

            labels = [
                {
                    "label": annotation.description,
                    "confidence": round(annotation.score, 4),
                }
                for annotation in response.label_annotations
            ]
            labels.sort(key=lambda x: x["confidence"], reverse=True)
            return labels

        except VisionAPIConfigError:
            raise
        except Exception as exc:
            exc_str = str(exc).lower()
            if "invalid" in exc_str or "unrecognized" in exc_str or "unsupported" in exc_str:
                raise InvalidImageContentError(str(exc)) from exc
            raise VisionAPIError(str(exc)) from exc

    @staticmethod
    def classify(
        user_id: UUID,
        image_bytes: bytes | None = None,
        image_url: str | None = None,
    ) -> dict:
        """
        Classify an image using the Vision API and persist the result.

        Accepts either raw ``image_bytes`` or a publicly accessible
        ``image_url``.  Fetches the remote image if a URL is provided.
        Persists an ``ImageClassification`` record on success only.

        Args:
            user_id: UUID of the requesting user.
            image_bytes: Raw image bytes (mutually exclusive with image_url).
            image_url: Publicly accessible HTTPS image URL (mutually exclusive
                with image_bytes).

        Returns:
            A dict with keys ``classification_id``, ``labels``, ``success``,
            and ``created_at``.

        Raises:
            RemoteImageFetchError: If the remote URL cannot be fetched.
            VisionAPIConfigError: If credentials are missing or the library is
                not installed.
            InvalidImageContentError: If the image content is unrecognisable.
            VisionAPIError: On any other Vision API failure.
        """
        from .models import ImageClassification, ImageSource

        if image_url:
            image_bytes = ClassificationService._fetch_remote_image(image_url)
            source = ImageSource.URL
        else:
            source = ImageSource.UPLOAD

        labels = ClassificationService._call_vision_api(image_bytes)

        record = ImageClassification.objects.create(
            user_id=user_id,
            image_source=source,
            image_url=image_url,
            labels=labels,
        )

        return {
            "classification_id": record.id,
            "labels": labels,
            "success": True,
            "created_at": record.created_at,
        }
