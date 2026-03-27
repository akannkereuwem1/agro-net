"""
Views for the AI app.

Provides HTTP handling for price prediction and image classification.
Views are intentionally thin — all business logic lives in the service layer.
"""

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiParameter,
    OpenApiResponse,
    extend_schema,
    inline_serializer,
)
from rest_framework import serializers as drf_serializers
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
    ClassifyImageResponseSerializer,
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


@extend_schema(
    methods=["POST"],
    tags=["AI"],
    summary="Request a price prediction",
    description="Submit produce details to get a Gemini-powered NGN price estimate.\n\n**unit:** kg, tonnes, bags, crates, pieces\n\n**season:** dry, wet, harmattan, off-season",
    request=PricePredictionRequestSerializer,
    responses={
        200: inline_serializer(
            name="PricePredictionSuccess",
            fields={
                "success": drf_serializers.BooleanField(),
                "predicted_price": drf_serializers.DecimalField(max_digits=12, decimal_places=2),
                "lower_bound": drf_serializers.DecimalField(max_digits=12, decimal_places=2),
                "upper_bound": drf_serializers.DecimalField(max_digits=12, decimal_places=2),
                "model_version": drf_serializers.CharField(),
            },
        ),
        400: OpenApiResponse(description="Validation error"),
        401: OpenApiResponse(description="Not authenticated"),
        500: OpenApiResponse(description="Inference failed"),
        503: OpenApiResponse(description="Service unavailable"),
    },
    examples=[
        OpenApiExample(
            "Example request",
            request_only=True,
            value={"crop_type": "Tomato", "quantity": "100.00", "unit": "kg", "location": "Lagos, Nigeria", "season": "dry"},
        ),
        OpenApiExample(
            "Example response",
            response_only=True,
            status_codes=["200"],
            value={"success": True, "predicted_price": "450.00", "lower_bound": "405.00", "upper_bound": "495.00", "model_version": "gemini-1.5-flash"},
        ),
    ],
)
@extend_schema(
    methods=["GET"],
    tags=["AI"],
    summary="Get prediction history",
    description="Paginated list of the authenticated user's past predictions, newest first.",
    parameters=[OpenApiParameter("page", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False)],
    responses={
        200: PricePredictionHistorySerializer(many=True),
        401: OpenApiResponse(description="Not authenticated"),
    },
)


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


@extend_schema(
    methods=["POST"],
    tags=["AI"],
    summary="Classify an agricultural image",
    description="Upload an image file (multipart/form-data) **or** provide an HTTPS URL. Exactly one must be supplied.\n\n**Accepted MIME types:** image/jpeg, image/png, image/webp, image/gif\n\n**Max file size:** 10 MB\n\n**image_url must use HTTPS.**\n\nThe returned `classification_id` can be passed to `POST /api/products/` to auto-populate `crop_type`.",
    request=ClassifyImageRequestSerializer,
    responses={
        200: ClassifyImageResponseSerializer,
        400: OpenApiResponse(description="Both inputs absent/present, or non-HTTPS URL"),
        401: OpenApiResponse(description="Not authenticated"),
        413: OpenApiResponse(description="File exceeds 10 MB"),
        415: OpenApiResponse(description="Unsupported MIME type"),
        422: OpenApiResponse(description="URL unreachable or image unrecognisable"),
        503: OpenApiResponse(description="Vision API unavailable or credentials missing"),
    },
    examples=[
        OpenApiExample("Via URL", request_only=True, value={"image_url": "https://example.com/tomato.jpg"}),
        OpenApiExample(
            "Success",
            response_only=True,
            status_codes=["200"],
            value={"success": True, "classification_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "labels": [{"label": "Tomato", "confidence": 0.9821}], "created_at": "2026-03-25T14:00:00Z"},
        ),
    ],
)
@extend_schema(
    methods=["GET"],
    tags=["AI"],
    summary="Get classification history",
    description="Paginated list of the authenticated user's past classifications, newest first.",
    parameters=[OpenApiParameter("page", OpenApiTypes.INT, OpenApiParameter.QUERY, required=False)],
    responses={
        200: ClassificationHistorySerializer(many=True),
        401: OpenApiResponse(description="Not authenticated"),
    },
)
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
