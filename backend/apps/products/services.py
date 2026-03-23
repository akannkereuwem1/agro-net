from typing import Any

from django.db.models import QuerySet

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

    Args:
        farmer: The authenticated User instance (must have role='farmer').
        validated_data: Dictionary of validated fields from ProductSerializer.

    Returns:
        The newly created Product instance.
    """
    return Product.objects.create(farmer=farmer, **validated_data)
