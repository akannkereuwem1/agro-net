"""
Data models for the AI app.

Defines PricePrediction and ImageClassification models used to persist
price prediction and image classification results respectively.
"""

from uuid import uuid4

from django.conf import settings
from django.db import models

from products.models import Unit


class Season(models.TextChoices):
    """Agricultural season choices for price prediction."""

    DRY = "dry", "Dry"
    WET = "wet", "Wet"
    HARMATTAN = "harmattan", "Harmattan"
    OFF_SEASON = "off-season", "Off-Season"


class ImageSource(models.TextChoices):
    """Source type for image classification input."""

    UPLOAD = "upload", "Upload"
    URL = "url", "URL"


class PricePrediction(models.Model):
    """
    Persists each price prediction request and its result.

    Stores the input features alongside the predicted price, confidence
    interval, and the model version that produced the estimate.
    """

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_index=True,
        related_name="price_predictions",
    )
    crop_type = models.CharField(max_length=100, db_index=True)
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    unit = models.CharField(max_length=20, choices=Unit.choices)
    location = models.CharField(max_length=255)
    season = models.CharField(max_length=20, choices=Season.choices)
    predicted_price = models.DecimalField(max_digits=12, decimal_places=2)
    lower_bound = models.DecimalField(max_digits=12, decimal_places=2)
    upper_bound = models.DecimalField(max_digits=12, decimal_places=2)
    model_version = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ai_price_predictions"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "crop_type"]),
        ]

    def __str__(self) -> str:
        return (
            f"PricePrediction({self.crop_type}, {self.quantity} {self.unit},"
            f" {self.predicted_price}, {self.model_version})"
        )


class ImageClassification(models.Model):
    """
    Persists each image classification request and its Vision API results.

    Stores the image source, optional URL, and the full ordered list of
    label objects returned by the Classification_Service.
    """

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_index=True,
        related_name="image_classifications",
    )
    image_source = models.CharField(max_length=10, choices=ImageSource.choices)
    image_url = models.URLField(max_length=500, blank=True, null=True)
    labels = models.JSONField()  # [{"label": str, "confidence": float}, ...]
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "ai_image_classifications"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user"]),
        ]

    def __str__(self) -> str:
        top_label = self.labels[0]["label"] if self.labels else "no labels"
        return f"ImageClassification({self.image_source}, top={top_label})"
