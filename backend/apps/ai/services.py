"""
Service layer for the AI app.

Contains PredictionService (TensorFlow/Keras price prediction) and
ClassificationService (Google Cloud Vision image classification).
"""

import logging
import os
from decimal import Decimal
from uuid import UUID

import numpy as np

try:
    import tensorflow as tf
except ImportError:
    tf = None  # type: ignore[assignment]

from .exceptions import ModelNotAvailableError, PredictionError
from .models import PricePrediction

logger = logging.getLogger(__name__)


class PredictionService:
    """
    Handles TensorFlow/Keras price prediction.

    The Keras model is loaded once at application startup via ``load_model()``
    and reused for all subsequent ``predict()`` calls.
    """

    _model = None  # class-level singleton

    @classmethod
    def load_model(cls) -> None:
        """
        Load the TF/Keras model from the path specified by ``AI_MODEL_PATH``.

        Reads the ``AI_MODEL_PATH`` environment variable (default:
        ``"ai/model/price_model.keras"``).  Stores the loaded model in
        ``cls._model`` for reuse.

        Raises:
            ModelNotAvailableError: If the model file does not exist or cannot
                be opened.
        """
        if tf is None:
            raise ModelNotAvailableError(
                "TensorFlow is not installed; cannot load the prediction model."
            )

        model_path = os.environ.get("AI_MODEL_PATH", "ai/model/price_model.keras")

        try:
            cls._model = tf.keras.models.load_model(model_path)
        except (OSError, FileNotFoundError) as exc:
            raise ModelNotAvailableError(
                f"Prediction model file not found at '{model_path}'."
            ) from exc

    @staticmethod
    def _encode_features(
        crop_type: str,
        unit: str,
        location: str,
        season: str,
    ) -> list[float]:
        """
        Encode categorical string inputs into a deterministic float vector.

        Each string is mapped to a float in [0.0, 1.0) using
        ``hash(value) % 1000 / 1000.0``.

        Args:
            crop_type: The type of agricultural produce (e.g. ``"tomato"``).
            unit: The measurement unit (e.g. ``"kg"``).
            location: The geographic location string.
            season: The agricultural season (e.g. ``"dry"``).

        Returns:
            A list of four floats: ``[crop_type_enc, unit_enc, location_enc,
            season_enc]``.
        """
        def _encode(value: str) -> float:
            return hash(value) % 1000 / 1000.0

        return [
            _encode(crop_type),
            _encode(unit),
            _encode(location),
            _encode(season),
        ]

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
        Run inference and persist the result.

        Encodes the categorical inputs, builds a ``(1, 5)`` feature vector,
        calls the loaded Keras model, computes a ±10 % confidence interval,
        persists a ``PricePrediction`` record, and returns a result dict.

        Args:
            crop_type: Type of agricultural produce.
            quantity: Quantity of produce (must be > 0).
            unit: Measurement unit.
            location: Geographic location.
            season: Agricultural season.
            user_id: UUID of the requesting user.

        Returns:
            A dict with keys ``predicted_price``, ``lower_bound``,
            ``upper_bound``, and ``model_version``.

        Raises:
            ModelNotAvailableError: If the model has not been loaded.
            PredictionError: If the model raises an exception during inference.
        """
        if cls._model is None:
            raise ModelNotAvailableError(
                "Prediction model is not loaded. Call load_model() first."
            )

        encoded = cls._encode_features(crop_type, unit, location, season)
        feature_vector = np.array([[float(quantity)] + encoded], dtype=np.float32)

        try:
            output = cls._model.predict(feature_vector)
        except Exception as exc:
            logger.error("Model inference failed: %s", exc, exc_info=True)
            raise PredictionError("Model inference failed.") from exc

        raw_price = output[0][0]
        predicted_price = Decimal(str(raw_price)).quantize(Decimal("0.01"))
        lower_bound = (predicted_price * Decimal("0.9")).quantize(Decimal("0.01"))
        upper_bound = (predicted_price * Decimal("1.1")).quantize(Decimal("0.01"))

        model_version = os.environ.get("AI_MODEL_VERSION", "v1.0")

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
