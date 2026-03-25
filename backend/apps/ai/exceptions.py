"""Custom exceptions for the AI app (price prediction and image classification)."""


class ModelNotAvailableError(Exception):
    """Raised when the TensorFlow/Keras model file cannot be found or loaded."""


class PredictionError(Exception):
    """Raised when the TF model raises an exception during inference."""


class VisionAPIError(Exception):
    """Raised when the Google Vision API is unreachable or returns a non-success status."""


class VisionAPIConfigError(Exception):
    """Raised when GOOGLE_APPLICATION_CREDENTIALS is not configured."""


class InvalidImageContentError(Exception):
    """Raised when the Vision API cannot process the image content (unrecognisable or corrupt)."""


class RemoteImageFetchError(Exception):
    """Raised when an image_url cannot be fetched within the allowed timeout."""
