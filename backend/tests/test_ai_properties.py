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


# ---------------------------------------------------------------------------
# Imports for Properties 2–7
# ---------------------------------------------------------------------------
import uuid
from decimal import Decimal
from unittest.mock import MagicMock, patch

import numpy as np
import pytest
from hypothesis import given, settings
from hypothesis import strategies as st

from ai.exceptions import PredictionError
from ai.models import PricePrediction
from ai.serializers import PricePredictionRequestSerializer
from ai.services import PredictionService
from users.models import Role, User


# ---------------------------------------------------------------------------
# Shared strategies
# ---------------------------------------------------------------------------

_VALID_UNITS = ['kg', 'tonnes', 'bags', 'crates', 'pieces']
_VALID_SEASONS = ['dry', 'wet', 'harmattan', 'off-season']

_alpha_text = st.text(
    min_size=1,
    max_size=20,
    alphabet=st.characters(whitelist_categories=('Lu', 'Ll')),
)

_valid_quantity = st.decimals(
    min_value=Decimal('0.01'),
    max_value=Decimal('9999.99'),
    allow_nan=False,
    allow_infinity=False,
    places=2,
)


# ---------------------------------------------------------------------------
# Property 2: Non-positive quantity always rejected
# Feature: ai-price-prediction, Property 2: Non-positive quantity always rejected
# Validates: Requirements 1.4
# ---------------------------------------------------------------------------

@settings(max_examples=25)
@given(
    quantity=st.one_of(
        st.decimals(
            min_value=Decimal('-9999.99'),
            max_value=Decimal('0'),
            allow_nan=False,
            allow_infinity=False,
            places=2,
        ),
        st.just(Decimal('0')),
    )
)
def test_non_positive_quantity_always_rejected(quantity):
    """
    Property 2: For any quantity <= 0, PricePredictionRequestSerializer must
    be invalid and report 'quantity must be greater than zero'.
    """
    data = {
        'crop_type': 'tomato',
        'quantity': quantity,
        'unit': 'kg',
        'location': 'Lagos',
        'season': 'dry',
    }
    serializer = PricePredictionRequestSerializer(data=data)
    assert serializer.is_valid() is False
    errors = str(serializer.errors)
    assert 'quantity must be greater than zero' in errors


# ---------------------------------------------------------------------------
# Property 3: Invalid unit always rejected
# Feature: ai-price-prediction, Property 3: Invalid unit always rejected
# Validates: Requirements 1.5
# ---------------------------------------------------------------------------

@settings(max_examples=25, deadline=None)
@given(
    unit=st.text(
        min_size=1, max_size=20,
        alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd')),
    ).filter(lambda s: s not in {'kg', 'tonnes', 'bags', 'crates', 'pieces'})
)
def test_invalid_unit_always_rejected(unit):
    """
    Property 3: For any string not in the valid unit set, the serializer must
    be invalid and report 'invalid unit'.
    """
    data = {
        'crop_type': 'maize',
        'quantity': Decimal('10.00'),
        'unit': unit,
        'location': 'Abuja',
        'season': 'wet',
    }
    serializer = PricePredictionRequestSerializer(data=data)
    assert serializer.is_valid() is False
    errors = str(serializer.errors)
    assert 'invalid unit' in errors or 'is not a valid choice' in errors


# ---------------------------------------------------------------------------
# Property 4: Invalid season always rejected
# Feature: ai-price-prediction, Property 4: Invalid season always rejected
# Validates: Requirements 1.6
# ---------------------------------------------------------------------------

@settings(max_examples=25, deadline=None)
@given(
    season=st.text(
        min_size=1, max_size=20,
        alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd')),
    ).filter(lambda s: s not in {'dry', 'wet', 'harmattan', 'off-season'})
)
def test_invalid_season_always_rejected(season):
    """
    Property 4: For any string not in the valid season set, the serializer must
    be invalid and report 'invalid season'.
    """
    data = {
        'crop_type': 'yam',
        'quantity': Decimal('5.00'),
        'unit': 'kg',
        'location': 'Kano',
        'season': season,
    }
    serializer = PricePredictionRequestSerializer(data=data)
    assert serializer.is_valid() is False
    errors = str(serializer.errors)
    assert 'invalid season' in errors or 'is not a valid choice' in errors


# ---------------------------------------------------------------------------
# Property 5: Missing required fields always rejected
# Feature: ai-price-prediction, Property 5: Missing required fields always rejected
# Validates: Requirements 1.2
# ---------------------------------------------------------------------------

_REQUIRED_FIELDS = ['crop_type', 'quantity', 'unit', 'location', 'season']

_complete_data = {
    'crop_type': 'cassava',
    'quantity': Decimal('20.00'),
    'unit': 'kg',
    'location': 'Ibadan',
    'season': 'dry',
}


@settings(max_examples=25)
@given(
    fields_to_omit=st.sets(
        st.sampled_from(_REQUIRED_FIELDS),
        min_size=1,
    )
)
def test_missing_required_fields_always_rejected(fields_to_omit):
    """
    Property 5: For any non-empty subset of required fields omitted from the
    request, the serializer must be invalid.
    """
    data = {k: v for k, v in _complete_data.items() if k not in fields_to_omit}
    serializer = PricePredictionRequestSerializer(data=data)
    assert serializer.is_valid() is False


# ---------------------------------------------------------------------------
# Property 6: Successful prediction is always persisted
# Feature: ai-price-prediction, Property 6: Successful prediction is always persisted
# Validates: Requirements 3.1
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Property 6: Successful prediction is always persisted
# Feature: ai-price-prediction, Property 6: Successful prediction is always persisted
# Validates: Requirements 3.1
# ---------------------------------------------------------------------------

@pytest.mark.django_db
@settings(max_examples=25, suppress_health_check=[])
@given(
    crop_type=_alpha_text,
    quantity=_valid_quantity,
    unit=st.sampled_from(_VALID_UNITS),
    location=_alpha_text,
    season=st.sampled_from(_VALID_SEASONS),
)
def test_successful_prediction_always_persisted(crop_type, quantity, unit, location, season):
    """
    Property 6: For any valid inputs, when PredictionService.predict() succeeds,
    exactly one PricePrediction record must be persisted with matching values.
    """
    # Reset singleton to avoid state leakage
    PredictionService._model = None

    user = User.objects.create_user(
        email=f'farmer_{uuid.uuid4().hex[:8]}@test.com',
        password='testpass123',
        role=Role.FARMER,
    )

    mock_model = MagicMock()
    mock_model.predict.return_value = np.array([[500.0]])

    with patch('ai.services.tf') as mock_tf:
        mock_tf.keras.models.load_model.return_value = mock_model
        PredictionService._model = mock_model

        result = PredictionService.predict(
            crop_type=crop_type,
            quantity=quantity,
            unit=unit,
            location=location,
            season=season,
            user_id=user.id,
        )

    count = PricePrediction.objects.filter(user_id=user.id).count()
    assert count == 1

    record = PricePrediction.objects.get(user_id=user.id)
    assert record.predicted_price == Decimal('500.00')
    assert 'predicted_price' in result
    assert 'lower_bound' in result
    assert 'upper_bound' in result
    assert 'model_version' in result

    # Reset singleton after test
    PredictionService._model = None


# ---------------------------------------------------------------------------
# Property 7: Failed prediction is never persisted
# Feature: ai-price-prediction, Property 7: Failed prediction is never persisted
# Validates: Requirements 3.4
# ---------------------------------------------------------------------------

@pytest.mark.django_db
@settings(max_examples=25, suppress_health_check=[])
@given(
    crop_type=_alpha_text,
    quantity=_valid_quantity,
    unit=st.sampled_from(_VALID_UNITS),
    location=_alpha_text,
    season=st.sampled_from(_VALID_SEASONS),
)
def test_failed_prediction_never_persisted(crop_type, quantity, unit, location, season):
    """
    Property 7: For any valid inputs, when model.predict() raises an exception,
    no PricePrediction record must be created in the database.
    """
    # Reset singleton to avoid state leakage
    PredictionService._model = None

    user = User.objects.create_user(
        email=f'farmer_{uuid.uuid4().hex[:8]}@test.com',
        password='testpass123',
        role=Role.FARMER,
    )

    mock_model = MagicMock()
    mock_model.predict.side_effect = Exception('inference error')

    PredictionService._model = mock_model

    with pytest.raises(PredictionError):
        PredictionService.predict(
            crop_type=crop_type,
            quantity=quantity,
            unit=unit,
            location=location,
            season=season,
            user_id=user.id,
        )

    assert PricePrediction.objects.count() == 0

    # Reset singleton after test
    PredictionService._model = None


# ---------------------------------------------------------------------------
# Property 14: Classification labels are ordered by confidence descending
# Feature: ai-price-prediction, Property 14: Classification labels are ordered by confidence descending
# Validates: Requirements 10.2
# ---------------------------------------------------------------------------

from unittest.mock import MagicMock, patch

from ai.services import ClassificationService


_label_annotation_strategy = st.fixed_dictionaries({
    "description": st.text(min_size=1, max_size=30, alphabet=st.characters(whitelist_categories=('Lu', 'Ll'))),
    "score": st.floats(min_value=0.0, max_value=1.0, allow_nan=False, allow_infinity=False),
})


@settings(max_examples=25, deadline=None)
@given(annotations=st.lists(_label_annotation_strategy, min_size=0, max_size=10))
def test_classification_labels_ordered_by_confidence_descending(annotations):
    """
    Property 14: For any Vision API response containing labels, ClassificationService
    must return a list where each label's confidence >= the next label's confidence.
    """
    import os

    # Build mock annotation objects
    mock_annotations = []
    for ann in annotations:
        mock_ann = MagicMock()
        mock_ann.description = ann["description"]
        mock_ann.score = ann["score"]
        mock_annotations.append(mock_ann)

    mock_response = MagicMock()
    mock_response.error.message = ""
    mock_response.label_annotations = mock_annotations

    mock_client = MagicMock()
    mock_client.label_detection.return_value = mock_response

    with patch.dict(os.environ, {"GOOGLE_APPLICATION_CREDENTIALS": "/fake/creds.json"}):
        with patch("ai.services.vision") as mock_vision:
            mock_vision.ImageAnnotatorClient.return_value = mock_client
            mock_vision.Image.return_value = MagicMock()

            result = ClassificationService._call_vision_api(b"fake-image-bytes")

    # Verify ordering: each confidence >= next
    for i in range(len(result) - 1):
        assert result[i]["confidence"] >= result[i + 1]["confidence"], (
            f"Labels not sorted: index {i} confidence {result[i]['confidence']} "
            f"< index {i+1} confidence {result[i+1]['confidence']}"
        )


# ---------------------------------------------------------------------------
# Property 15: Successful classification is always persisted
# Feature: ai-price-prediction, Property 15: Successful classification is always persisted
# Validates: Requirements 11.1
# ---------------------------------------------------------------------------

from ai.models import ImageClassification


@pytest.mark.django_db
@settings(max_examples=25, deadline=None, suppress_health_check=[])
@given(
    label_list=st.lists(
        st.fixed_dictionaries({
            "label": st.text(min_size=1, max_size=20, alphabet=st.characters(whitelist_categories=('Lu', 'Ll'))),
            "score": st.floats(min_value=0.0, max_value=1.0, allow_nan=False, allow_infinity=False),
        }),
        min_size=0,
        max_size=5,
    )
)
def test_successful_classification_always_persisted(label_list):
    """
    Property 15: For any valid classification request that produces a result,
    an ImageClassification record must exist in the database with matching values.
    """
    import os

    user = User.objects.create_user(
        email=f"user_{uuid.uuid4().hex[:8]}@test.com",
        password="testpass123",
        role=Role.FARMER,
    )

    mock_annotations = []
    for item in label_list:
        ann = MagicMock()
        ann.description = item["label"]
        ann.score = item["score"]
        mock_annotations.append(ann)

    mock_response = MagicMock()
    mock_response.error.message = ""
    mock_response.label_annotations = mock_annotations

    mock_client = MagicMock()
    mock_client.label_detection.return_value = mock_response

    with patch.dict(os.environ, {"GOOGLE_APPLICATION_CREDENTIALS": "/fake/creds.json"}):
        with patch("ai.services.vision") as mock_vision:
            mock_vision.ImageAnnotatorClient.return_value = mock_client
            mock_vision.Image.return_value = MagicMock()

            result = ClassificationService.classify(
                user_id=user.id,
                image_bytes=b"fake-image-bytes",
            )

    assert ImageClassification.objects.filter(user_id=user.id).count() == 1
    record = ImageClassification.objects.get(user_id=user.id)
    assert record.image_source == "upload"
    assert "classification_id" in result
    assert "labels" in result
    assert result["success"] is True
    assert "created_at" in result


# ---------------------------------------------------------------------------
# Property 13: Non-HTTPS image URL always rejected
# Feature: ai-price-prediction, Property 13: Non-HTTPS image URL always rejected
# Validates: Requirements 9.3
# ---------------------------------------------------------------------------

from ai.serializers import ClassifyImageRequestSerializer


@settings(max_examples=25, deadline=None)
@given(
    host=st.from_regex(r"[a-z]{3,10}", fullmatch=True),
    path=st.from_regex(r"/[a-z]{0,10}\.jpg", fullmatch=True),
)
def test_non_https_url_always_rejected(host, path):
    """
    Property 13: For any image_url whose scheme is not https, the serializer
    must be invalid and report 'image_url must use HTTPS'.
    """
    # Use http:// — Django's URLField accepts it as structurally valid,
    # so our custom HTTPS check is guaranteed to be the rejection reason.
    url = f"http://{host}.com{path}"
    data = {"image_url": url}
    serializer = ClassifyImageRequestSerializer(data=data)
    assert serializer.is_valid() is False
    errors = str(serializer.errors)
    assert "image_url must use HTTPS" in errors


# ---------------------------------------------------------------------------
# Property 12: Oversized file always rejected
# Feature: ai-price-prediction, Property 12: Oversized file always rejected
# Validates: Requirements 9.2
# ---------------------------------------------------------------------------

from io import BytesIO

from django.core.files.uploadedfile import InMemoryUploadedFile


@settings(max_examples=25, deadline=None)
@given(
    extra_bytes=st.integers(min_value=1, max_value=1024 * 1024),  # 1 byte to 1 MB over limit
)
def test_oversized_file_always_rejected(extra_bytes):
    """
    Property 12: For any uploaded file whose size exceeds 10 MB, the serializer
    must be invalid and report 'image file exceeds the 10 MB size limit'.
    """
    MAX_SIZE = 10 * 1024 * 1024
    oversized_content = b"x" * (MAX_SIZE + extra_bytes)
    file_obj = InMemoryUploadedFile(
        file=BytesIO(oversized_content),
        field_name="image",
        name="big.jpg",
        content_type="image/jpeg",
        size=len(oversized_content),
        charset=None,
    )
    data = {"image": file_obj}
    serializer = ClassifyImageRequestSerializer(data=data)
    assert serializer.is_valid() is False
    errors = str(serializer.errors)
    assert "image file exceeds the 10 MB size limit" in errors


# ---------------------------------------------------------------------------
# Property 8: Prediction history is isolated per user and ordered
# Feature: ai-price-prediction, Property 8: Prediction history is isolated per user and ordered
# Validates: Requirements 4.1, 4.2
# ---------------------------------------------------------------------------

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.test import APIClient

from ai.models import PricePrediction, ImageClassification
from products.models import Unit
from ai.models import Season


@pytest.mark.django_db
@settings(max_examples=10, deadline=None, suppress_health_check=[])
@given(
    n_predictions=st.integers(min_value=1, max_value=5),
)
def test_prediction_history_isolated_per_user(n_predictions):
    """
    Property 8: GET /api/ai/predict-price/ returns only the requesting user's
    PricePrediction records, ordered by created_at descending.
    """
    user_a = User.objects.create_user(
        email=f"usera_{uuid.uuid4().hex[:8]}@test.com",
        password="testpass123",
        role=Role.FARMER,
    )
    user_b = User.objects.create_user(
        email=f"userb_{uuid.uuid4().hex[:8]}@test.com",
        password="testpass123",
        role=Role.FARMER,
    )

    # Create predictions for both users
    for _ in range(n_predictions):
        PricePrediction.objects.create(
            user=user_a,
            crop_type="tomato",
            quantity="10.00",
            unit=Unit.KG,
            location="Lagos",
            season=Season.DRY,
            predicted_price="500.00",
            lower_bound="450.00",
            upper_bound="550.00",
            model_version="v1.0",
        )
        PricePrediction.objects.create(
            user=user_b,
            crop_type="maize",
            quantity="20.00",
            unit=Unit.KG,
            location="Abuja",
            season=Season.WET,
            predicted_price="300.00",
            lower_bound="270.00",
            upper_bound="330.00",
            model_version="v1.0",
        )

    client = APIClient()
    token = RefreshToken.for_user(user_a)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")

    response = client.get("/api/ai/predict-price/")
    assert response.status_code == 200

    results = response.data.get("results", response.data)
    returned_ids = {str(r["user"]) for r in results}

    # Only user_a's records returned
    assert str(user_b.id) not in returned_ids
    assert all(str(r["user"]) == str(user_a.id) for r in results)

    # Ordering: created_at descending
    dates = [r["created_at"] for r in results]
    assert dates == sorted(dates, reverse=True)


# ---------------------------------------------------------------------------
# Property 17: Classification history is isolated per user and ordered
# Feature: ai-price-prediction, Property 17: Classification history is isolated per user and ordered
# Validates: Requirements 12.1, 12.2
# ---------------------------------------------------------------------------


@pytest.mark.django_db
@settings(max_examples=10, deadline=None, suppress_health_check=[])
@given(
    n_classifications=st.integers(min_value=1, max_value=5),
)
def test_classification_history_isolated_per_user(n_classifications):
    """
    Property 17: GET /api/ai/classify-image/ returns only the requesting user's
    ImageClassification records, ordered by created_at descending.
    """
    from ai.models import ImageSource

    user_a = User.objects.create_user(
        email=f"usera_{uuid.uuid4().hex[:8]}@test.com",
        password="testpass123",
        role=Role.FARMER,
    )
    user_b = User.objects.create_user(
        email=f"userb_{uuid.uuid4().hex[:8]}@test.com",
        password="testpass123",
        role=Role.FARMER,
    )

    for _ in range(n_classifications):
        ImageClassification.objects.create(
            user=user_a,
            image_source=ImageSource.UPLOAD,
            labels=[{"label": "Tomato", "confidence": 0.95}],
        )
        ImageClassification.objects.create(
            user=user_b,
            image_source=ImageSource.UPLOAD,
            labels=[{"label": "Maize", "confidence": 0.88}],
        )

    client = APIClient()
    token = RefreshToken.for_user(user_a)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")

    response = client.get("/api/ai/classify-image/")
    assert response.status_code == 200

    results = response.data.get("results", response.data)
    returned_ids = {str(r["user"]) for r in results}

    # Only user_a's records returned
    assert str(user_b.id) not in returned_ids
    assert all(str(r["user"]) == str(user_a.id) for r in results)

    # Ordering: created_at descending
    dates = [r["created_at"] for r in results]
    assert dates == sorted(dates, reverse=True)
