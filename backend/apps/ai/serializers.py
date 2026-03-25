"""
Serializers for the AI app.

Provides input validation and output serialisation for the price prediction
and image classification sub-features.
"""

from rest_framework import serializers

from products.models import Unit

from .models import ImageClassification, ImageSource, PricePrediction, Season

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

VALID_UNITS = [choice[0] for choice in Unit.choices]
VALID_SEASONS = [choice[0] for choice in Season.choices]
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB in bytes


# ---------------------------------------------------------------------------
# Price Prediction Serializers
# ---------------------------------------------------------------------------


class PricePredictionRequestSerializer(serializers.Serializer):
    """Validates incoming price prediction request data."""

    crop_type = serializers.CharField(allow_blank=False)
    quantity = serializers.DecimalField(max_digits=12, decimal_places=2)
    unit = serializers.ChoiceField(choices=Unit.choices)
    location = serializers.CharField(allow_blank=False)
    season = serializers.ChoiceField(choices=Season.choices)

    def validate_quantity(self, value):
        """Quantity must be strictly greater than zero."""
        if value <= 0:
            raise serializers.ValidationError("quantity must be greater than zero")
        return value

    def validate_unit(self, value):
        """Unit must be one of the recognised choices."""
        if value not in VALID_UNITS:
            raise serializers.ValidationError("invalid unit")
        return value

    def validate_season(self, value):
        """Season must be one of the recognised choices."""
        if value not in VALID_SEASONS:
            raise serializers.ValidationError("invalid season")
        return value


class PricePredictionResponseSerializer(serializers.Serializer):
    """Serialises a price prediction result for API output."""

    predicted_price = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )
    lower_bound = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )
    upper_bound = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )
    model_version = serializers.CharField(read_only=True)


class PricePredictionHistorySerializer(serializers.ModelSerializer):
    """Serialises PricePrediction records for list/history views."""

    class Meta:
        model = PricePrediction
        fields = "__all__"


# ---------------------------------------------------------------------------
# Image Classification Serializers
# ---------------------------------------------------------------------------


class ClassifyImageRequestSerializer(serializers.Serializer):
    """Validates incoming image classification request data."""

    image = serializers.FileField(required=False, allow_null=True)
    image_url = serializers.URLField(required=False, allow_null=True, allow_blank=True)

    def validate_image(self, value):
        """Enforce MIME type and file size constraints on uploaded images."""
        if value is None:
            return value

        content_type = getattr(value, "content_type", None)
        if content_type not in ALLOWED_MIME_TYPES:
            raise serializers.ValidationError("unsupported image format")

        if value.size > MAX_IMAGE_SIZE:
            raise serializers.ValidationError(
                "image file exceeds the 10 MB size limit"
            )

        return value

    def validate_image_url(self, value):
        """image_url must use the HTTPS scheme."""
        if value and not value.startswith("https"):
            raise serializers.ValidationError("image_url must use HTTPS")
        return value

    def validate(self, attrs):
        """Ensure exactly one of image or image_url is provided."""
        image = attrs.get("image")
        image_url = attrs.get("image_url")

        has_image = image is not None
        has_url = bool(image_url)

        if not has_image and not has_url:
            raise serializers.ValidationError(
                "either image file or image_url is required"
            )
        if has_image and has_url:
            raise serializers.ValidationError(
                "provide either image file or image_url, not both"
            )

        return attrs


class ClassifyImageResponseSerializer(serializers.Serializer):
    """Serialises an image classification result for API output."""

    classification_id = serializers.UUIDField(read_only=True)
    labels = serializers.ListField(child=serializers.DictField(), read_only=True)
    success = serializers.BooleanField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)

    def to_representation(self, instance):
        """Round confidence values in labels to 4 decimal places."""
        data = super().to_representation(instance)
        if data.get("labels"):
            data["labels"] = [
                {
                    **label,
                    "confidence": round(float(label["confidence"]), 4),
                }
                for label in data["labels"]
            ]
        return data


class ClassificationHistorySerializer(serializers.ModelSerializer):
    """Serialises ImageClassification records for list/history views."""

    class Meta:
        model = ImageClassification
        fields = "__all__"
