from typing import Any

from django.db.models import QuerySet
from rest_framework.exceptions import NotFound, PermissionDenied

from .models import Product


def get_farmer_products(farmer: Any) -> QuerySet:
    """
    Return all products owned by the given farmer, ordered newest first.

    Includes both available and unavailable products — no is_available filter applied.

    Args:
        farmer: The authenticated User instance (must have role='farmer').

    Returns:
        A QuerySet of Product instances belonging to the given farmer.
    """
    return Product.objects.filter(farmer=farmer).order_by('-created_at')


def create_product(farmer: Any, validated_data: dict) -> Product:
    """
    Create a new product listing for the given farmer.

    If ``classification_id`` is present in ``validated_data``, the corresponding
    ``ImageClassification`` record is looked up and its highest-confidence label
    is used to populate ``crop_type``.  The ``classification_id`` field is never
    stored on the ``Product`` model.

    Args:
        farmer: The authenticated User instance (must have role='farmer').
        validated_data: Dictionary of validated fields from ProductSerializer.

    Returns:
        The newly created Product instance.

    Raises:
        NotFound: If the provided ``classification_id`` does not exist.
        PermissionDenied: If the classification record belongs to a different user.
    """
    classification_id = validated_data.pop("classification_id", None)

    if classification_id is not None:
        from ai.models import ImageClassification

        try:
            classification = ImageClassification.objects.get(pk=classification_id)
        except ImageClassification.DoesNotExist:
            raise NotFound("classification record not found")

        if classification.user != farmer:
            raise PermissionDenied(
                "classification record does not belong to this user"
            )

        validated_data["crop_type"] = classification.labels[0]["label"]

    return Product.objects.create(farmer=farmer, **validated_data)
