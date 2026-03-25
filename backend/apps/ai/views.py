"""
Views for the AI app.

Provides HTTP handling for price prediction and image classification.
Views are intentionally thin — all business logic lives in the service layer.
"""

from rest_framework import status
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .exceptions import (
    InvalidImageContentError,
    ModelNotAvailableError,
    PredictionError,
    RemoteImageFetchError,
    VisionAPIConfigError,
    VisionAPIError,
)
from .models import ImageClassification, PricePrediction
from .serializers import (
    ClassificationHistorySerializer,
    ClassifyImageRequestSerializer,
    PricePredictionHistorySerializer,
    PricePredictionRequestSerializer,
)
from .services import ClassificationService, PredictionService


# ---------------------------------------------------------------------------
# Local exception helpers
# ---------------------------------------------------------------------------


class ServiceUnavailable(APIException):
    """HTTP 503 Service Unavailable."""

    status_code = 503
    default_detail = "Service temporarily unavailable."
    default_code = "service_unavailable"


# ---------------------------------------------------------------------------
# Price Prediction View
# ---------------------------------------------------------------------------


class PricePredictionView(APIView):
    """
    POST  /api/ai/predict-price/  — Submit produce details, get predicted price.
    GET   /api/ai/predict-price/  — Retrieve paginated prediction history.
    """

    permission_classes = [IsAuthenticated]
    pagination_class = PageNumberPagination

    def post(self, request) -> Response:
        """
        Validate input, call PredictionService, return prediction result.

        Returns HTTP 200 on success, 400 on validation failure,
        503 if the model is unavailable, 500 on inference failure.
        """
        serializer = PricePredictionRequestSerializer(data=request.data)
        if not serializer.is_valid():
            raise ValidationError(serializer.errors)

        try:
            result = PredictionService.predict(
                **serializer.validated_data,
                user_id=request.user.id,
            )
        except ModelNotAvailableError:
            raise ServiceUnavailable("prediction model is not available")
        except PredictionError:
            exc = APIException("prediction failed")
            exc.status_code = 500
            raise exc

        return Response({"success": True, **result}, status=status.HTTP_200_OK)

    def get(self, request) -> Response:
        """
        Return paginated prediction history for the requesting user,
        ordered by created_at descending.
        """
        queryset = PricePrediction.objects.filter(user=request.user).order_by(
            "-created_at"
        )

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request, view=self)
        if page is not None:
            serializer = PricePredictionHistorySerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = PricePredictionHistorySerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Image Classification View
# ---------------------------------------------------------------------------


def _classify_image_error_response(exc: ValidationError) -> Response | None:
    """
    Inspect a DRF ValidationError raised by ClassifyImageRequestSerializer and
    return the appropriate HTTP response for MIME-type (415) and file-size (413)
    errors.  Returns None if the error should be treated as a plain 400.
    """
    errors = exc.detail if hasattr(exc, "detail") else {}

    # Flatten all error messages into a single string for inspection.
    flat = str(errors).lower()

    if "unsupported image format" in flat:
        return Response(
            {
                "success": False,
                "error": {
                    "status_code": 415,
                    "message": "unsupported image format",
                    "details": {},
                },
            },
            status=415,
        )

    if "image file exceeds" in flat:
        return Response(
            {
                "success": False,
                "error": {
                    "status_code": 413,
                    "message": "image file exceeds the 10 MB size limit",
                    "details": {},
                },
            },
            status=413,
        )

    return None


class ImageClassificationView(APIView):
    """
    POST  /api/ai/classify-image/  — Upload image or provide URL, get labels.
    GET   /api/ai/classify-image/  — Retrieve paginated classification history.
    """

    permission_classes = [IsAuthenticated]
    pagination_class = PageNumberPagination

    def post(self, request) -> Response:
        """
        Validate input, call ClassificationService, return classification result.

        Returns HTTP 200 on success.  Validation errors map to 400/413/415.
        Service errors map to 422 or 503.
        """
        serializer = ClassifyImageRequestSerializer(data=request.data)
        if not serializer.is_valid():
            validation_exc = ValidationError(serializer.errors)
            special = _classify_image_error_response(validation_exc)
            if special is not None:
                return special
            raise validation_exc

        validated = serializer.validated_data
        image_bytes: bytes | None = None
        image_url: str | None = None

        if validated.get("image"):
            image_bytes = validated["image"].read()
        else:
            image_url = validated.get("image_url")

        try:
            result = ClassificationService.classify(
                user_id=request.user.id,
                image_bytes=image_bytes,
                image_url=image_url,
            )
        except (VisionAPIError, VisionAPIConfigError):
            raise ServiceUnavailable("image classification service is unavailable")
        except InvalidImageContentError:
            return Response(
                {
                    "success": False,
                    "error": {
                        "status_code": 422,
                        "message": "image could not be processed by the classification service",
                        "details": {},
                    },
                },
                status=422,
            )
        except RemoteImageFetchError:
            return Response(
                {
                    "success": False,
                    "error": {
                        "status_code": 422,
                        "message": "could not fetch image from the provided URL",
                        "details": {},
                    },
                },
                status=422,
            )

        return Response(
            {
                "success": True,
                "classification_id": str(result["classification_id"]),
                "labels": result["labels"],
                "created_at": result["created_at"],
            },
            status=status.HTTP_200_OK,
        )

    def get(self, request) -> Response:
        """
        Return paginated classification history for the requesting user,
        ordered by created_at descending.
        """
        queryset = ImageClassification.objects.filter(user=request.user).order_by(
            "-created_at"
        )

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request, view=self)
        if page is not None:
            serializer = ClassificationHistorySerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = ClassificationHistorySerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
