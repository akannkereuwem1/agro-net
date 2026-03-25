"""AppConfig for the AI app."""

import logging

from django.apps import AppConfig

logger = logging.getLogger(__name__)


class AiConfig(AppConfig):
    """Django AppConfig for the ai app."""

    name = "ai"

    def ready(self) -> None:
        """Load the TF price prediction model once at Django startup."""
        from .exceptions import ModelNotAvailableError
        from .services import PredictionService

        try:
            PredictionService.load_model()
        except ModelNotAvailableError as exc:
            logger.warning(
                "AI price prediction model could not be loaded at startup: %s. "
                "Prediction requests will return HTTP 503 until the model is available.",
                exc,
            )
        except Exception as exc:
            logger.warning(
                "Unexpected error loading AI model at startup: %s",
                exc,
            )
