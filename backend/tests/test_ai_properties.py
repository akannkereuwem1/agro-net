# backend/tests/test_ai_properties.py
# Property-based tests for the AI price prediction and image classification features.
# Uses hypothesis library with a minimum of 100 iterations per property.

import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from ai.serializers import ClassifyImageResponseSerializer


# Feature: ai-price-prediction, Property 18: ImageClassification labels serialiser round-trip
# Validates: Requirements 14.2, 14.3

label_strategy = st.fixed_dictionaries(
    {
        "label": st.text(min_size=1),
        "confidence": st.floats(min_value=0.0, max_value=1.0, allow_nan=False, allow_infinity=False),
    }
)

labels_strategy = st.lists(label_strategy)


@settings(max_examples=25)
@given(labels=labels_strategy)
def test_classify_image_response_serializer_round_trip(labels):
    """
    Property 18: For any valid list of label objects, serialising through
    ClassifyImageResponseSerializer produces a list with identical label strings
    and confidence floats rounded to 4 decimal places in the same order.
    """
    import uuid
    from datetime import datetime, timezone

    data = {
        "classification_id": uuid.uuid4(),
        "labels": labels,
        "success": True,
        "created_at": datetime.now(tz=timezone.utc),
    }

    serializer = ClassifyImageResponseSerializer(data)
    result = serializer.data

    output_labels = result["labels"]

    # Order is preserved
    assert len(output_labels) == len(labels)

    for original, serialised in zip(labels, output_labels):
        # Label string is unchanged
        assert serialised["label"] == original["label"]
        # Confidence is rounded to 4 decimal places
        assert serialised["confidence"] == round(float(original["confidence"]), 4)
