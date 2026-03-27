from decimal import Decimal

from rest_framework import serializers

from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    """
    Serializer for the Product model.

    The `farmer` field is read-only and auto-assigned from
    the authenticated request user in the view/service layer.

    The optional write-only `classification_id` field allows a farmer to
    auto-populate `crop_type` from a prior image classification result.
    It is never stored on the Product model.
    """

    farmer_email = serializers.EmailField(source='farmer.email', read_only=True)
    classification_id = serializers.UUIDField(
        write_only=True,
        required=False,
        allow_null=True,
        help_text=(
            "Optional UUID of an ImageClassification record. When provided, "
            "crop_type is auto-populated from the top classification label."
        ),
    )

    class Meta:
        model = Product
        fields = [
            'id',
            'farmer',
            'farmer_email',
            'title',
            'description',
            'crop_type',
            'quantity',
            'unit',
            'price_per_unit',
            'location',
            'image_url',
            'is_available',
            'classification_id',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'farmer', 'farmer_email', 'created_at', 'updated_at']
        extra_kwargs = {
            'crop_type': {'required': False, 'allow_blank': True},
        }

    def validate(self, attrs: dict) -> dict:
        """Require crop_type unless classification_id is provided (full create only)."""
        if not self.partial:
            has_classification = bool(attrs.get('classification_id'))
            has_crop_type = bool(attrs.get('crop_type', '').strip())
            if not has_classification and not has_crop_type:
                raise serializers.ValidationError(
                    {'crop_type': 'This field is required when classification_id is not provided.'}
                )
        return attrs

    def validate_quantity(self, value: Decimal) -> Decimal:
        """Quantity must be greater than zero."""
        if value <= 0:
            raise serializers.ValidationError('Quantity must be greater than zero.')
        return value

    def validate_price_per_unit(self, value: Decimal) -> Decimal:
        """Price per unit must be greater than zero."""
        if value <= 0:
            raise serializers.ValidationError('Price per unit must be greater than zero.')
        return value
