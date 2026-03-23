"""
Integration tests for GET /api/products/my/

Covers:
  - Core integration cases (Task 5.1)
  - Property-based tests using Hypothesis (Tasks 5.2 – 5.9)

Feature: farmer-product-listing
"""

import uuid
from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.urls import reverse, resolve
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from products.models import Product, Unit
from users.models import Role, User

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

URL = '/api/products/my/'

PRODUCT_FIELDS = {
    'id', 'farmer', 'farmer_email', 'title', 'description', 'crop_type',
    'quantity', 'unit', 'price_per_unit', 'location', 'image_url',
    'is_available', 'created_at', 'updated_at',
}


def make_user(email: str, role: str = Role.FARMER) -> User:
    return User.objects.create_user(email=email, password='pass1234', role=role)


def auth_header(user: User) -> dict:
    token = RefreshToken.for_user(user)
    return {'HTTP_AUTHORIZATION': f'Bearer {token.access_token}'}


def make_product(farmer: User, **kwargs) -> Product:
    defaults = dict(
        title='Tomatoes',
        description='Fresh tomatoes',
        crop_type='tomato',
        quantity=Decimal('50.00'),
        unit=Unit.KG,
        price_per_unit=Decimal('300.00'),
        location='Lagos',
        is_available=True,
    )
    defaults.update(kwargs)
    return Product.objects.create(farmer=farmer, **defaults)


# ---------------------------------------------------------------------------
# 5.1  Core integration test cases
# ---------------------------------------------------------------------------

class FarmerProductListAuthTests(APITestCase):
    """Authentication and authorisation gate tests."""

    def setUp(self) -> None:
        self.farmer = make_user('farmer@test.com', Role.FARMER)
        self.buyer = make_user('buyer@test.com', Role.BUYER)

    # Requirements: 3.1
    def test_unauthenticated_returns_401(self) -> None:
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # Requirements: 3.2
    def test_buyer_returns_403(self) -> None:
        response = self.client.get(URL, **auth_header(self.buyer))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # Requirements: 1.1, 3.3
    def test_farmer_returns_200(self) -> None:
        response = self.client.get(URL, **auth_header(self.farmer))
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class FarmerProductListContentTests(APITestCase):
    """Content, isolation, ordering, and serialisation tests."""

    def setUp(self) -> None:
        self.farmer_a = make_user('farmer_a@test.com', Role.FARMER)
        self.farmer_b = make_user('farmer_b@test.com', Role.FARMER)

    # Requirements: 4.1
    def test_farmer_with_no_products_returns_empty(self) -> None:
        response = self.client.get(URL, **auth_header(self.farmer_a))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)
        self.assertIsNone(response.data['next'])
        self.assertIsNone(response.data['previous'])
        self.assertEqual(response.data['results'], [])

    # Requirements: 3.3, 3.4
    def test_farmer_sees_only_own_products(self) -> None:
        p_a = make_product(self.farmer_a, title='Farmer A Yam')
        make_product(self.farmer_b, title='Farmer B Corn')

        response = self.client.get(URL, **auth_header(self.farmer_a))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], str(p_a.id))

    # Requirements: 1.3
    def test_both_available_and_unavailable_products_returned(self) -> None:
        make_product(self.farmer_a, title='Available', is_available=True)
        make_product(self.farmer_a, title='Unavailable', is_available=False)

        response = self.client.get(URL, **auth_header(self.farmer_a))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)
        availabilities = {r['is_available'] for r in response.data['results']}
        self.assertIn(True, availabilities)
        self.assertIn(False, availabilities)

    # Requirements: 1.4
    def test_results_ordered_newest_first(self) -> None:
        now = timezone.now()
        p_old = make_product(self.farmer_a, title='Old')
        p_old.created_at = now - timedelta(days=2)
        p_old.save()

        p_new = make_product(self.farmer_a, title='New')
        p_new.created_at = now
        p_new.save()

        response = self.client.get(URL, **auth_header(self.farmer_a))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [r['id'] for r in response.data['results']]
        self.assertEqual(ids[0], str(p_new.id))
        self.assertEqual(ids[1], str(p_old.id))

    # Requirements: 1.5
    def test_response_includes_all_serializer_fields(self) -> None:
        make_product(self.farmer_a)
        response = self.client.get(URL, **auth_header(self.farmer_a))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        result_keys = set(response.data['results'][0].keys())
        self.assertEqual(result_keys, PRODUCT_FIELDS)

    # Requirements: 5.3
    def test_url_resolves_correctly(self) -> None:
        match = resolve('/api/products/my/')
        self.assertEqual(match.url_name, 'farmer-product-list')


class FarmerProductListPaginationTests(APITestCase):
    """Pagination edge-case tests."""

    def setUp(self) -> None:
        self.farmer = make_user('farmer_page@test.com', Role.FARMER)

    def test_page_1_has_at_most_20_items(self) -> None:
        for i in range(25):
            make_product(self.farmer, title=f'Product {i}')

        response = self.client.get(URL, **auth_header(self.farmer))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 25)
        self.assertEqual(len(response.data['results']), 20)
        self.assertIsNotNone(response.data['next'])

    def test_page_2_returns_remaining_items(self) -> None:
        for i in range(25):
            make_product(self.farmer, title=f'Product {i}')

        response = self.client.get(URL + '?page=2', **auth_header(self.farmer))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 5)
        self.assertIsNone(response.data['next'])


# ---------------------------------------------------------------------------
# Property-based tests (Hypothesis)
# ---------------------------------------------------------------------------

try:
    from hypothesis import given, settings, HealthCheck
    from hypothesis import strategies as st
    from hypothesis.extra.django import TestCase as HypothesisTestCase
    HYPOTHESIS_AVAILABLE = True
except ImportError:
    HYPOTHESIS_AVAILABLE = False

import unittest


@unittest.skipUnless(HYPOTHESIS_AVAILABLE, 'hypothesis not installed')
class FarmerProductListPropertyTests(HypothesisTestCase):
    """
    Property-based tests for GET /api/products/my/

    Each test is tagged with the property it validates.
    """

    def _make_farmer(self, suffix: str) -> User:
        email = f'pbt_farmer_{suffix}_{uuid.uuid4().hex[:6]}@test.com'
        return make_user(email, Role.FARMER)

    def _make_buyer(self, suffix: str) -> User:
        email = f'pbt_buyer_{suffix}_{uuid.uuid4().hex[:6]}@test.com'
        return make_user(email, Role.BUYER)

    def _get_all_results(self, farmer: User) -> list:
        """Paginate through all pages and collect every result."""
        results = []
        url = URL
        while url:
            response = self.client.get(url, **auth_header(farmer))
            results.extend(response.data['results'])
            url = response.data.get('next')
            if url:
                # strip host so APIClient can handle it
                from urllib.parse import urlparse
                parsed = urlparse(url)
                url = parsed.path + ('?' + parsed.query if parsed.query else '')
        return results

    # Feature: farmer-product-listing, Property 1: Farmer receives only their own products
    @given(st.integers(min_value=1, max_value=15))
    @settings(max_examples=10, suppress_health_check=[HealthCheck.too_slow])
    def test_property_1_farmer_only_sees_own_products(self, num_products: int) -> None:
        farmer = self._make_farmer('p1')
        other = self._make_farmer('p1_other')
        for i in range(num_products):
            make_product(farmer, title=f'My product {i}')
        make_product(other, title='Other farmer product')

        results = self._get_all_results(farmer)
        self.assertEqual(len(results), num_products)
        for r in results:
            self.assertEqual(r['farmer'], str(farmer.id))

    # Feature: farmer-product-listing, Property 2: Data isolation between farmers
    @given(st.integers(min_value=1, max_value=10), st.integers(min_value=1, max_value=10))
    @settings(max_examples=10, suppress_health_check=[HealthCheck.too_slow])
    def test_property_2_data_isolation_between_farmers(self, n_a: int, n_b: int) -> None:
        farmer_a = self._make_farmer('p2a')
        farmer_b = self._make_farmer('p2b')
        for i in range(n_a):
            make_product(farmer_a, title=f'A product {i}')
        for i in range(n_b):
            make_product(farmer_b, title=f'B product {i}')

        results_a = self._get_all_results(farmer_a)
        farmer_b_id = str(farmer_b.id)
        for r in results_a:
            self.assertNotEqual(r['farmer'], farmer_b_id)

    # Feature: farmer-product-listing, Property 3: Both available and unavailable products are returned
    @given(
        st.integers(min_value=1, max_value=8),
        st.integers(min_value=1, max_value=8),
    )
    @settings(max_examples=10, suppress_health_check=[HealthCheck.too_slow])
    def test_property_3_available_and_unavailable_both_returned(
        self, n_available: int, n_unavailable: int
    ) -> None:
        farmer = self._make_farmer('p3')
        for i in range(n_available):
            make_product(farmer, title=f'Avail {i}', is_available=True)
        for i in range(n_unavailable):
            make_product(farmer, title=f'Unavail {i}', is_available=False)

        results = self._get_all_results(farmer)
        availabilities = {r['is_available'] for r in results}
        self.assertIn(True, availabilities)
        self.assertIn(False, availabilities)

    # Feature: farmer-product-listing, Property 4: Results are ordered newest-first
    @given(st.integers(min_value=2, max_value=10))
    @settings(max_examples=10, suppress_health_check=[HealthCheck.too_slow])
    def test_property_4_results_ordered_newest_first(self, n: int) -> None:
        farmer = self._make_farmer('p4')
        now = timezone.now()
        for i in range(n):
            p = make_product(farmer, title=f'Product {i}')
            p.created_at = now - timedelta(hours=i)
            p.save()

        results = self._get_all_results(farmer)
        timestamps = [r['created_at'] for r in results]
        self.assertEqual(timestamps, sorted(timestamps, reverse=True))

    # Feature: farmer-product-listing, Property 5: Response contains all serializer fields
    @given(st.integers(min_value=1, max_value=5))
    @settings(max_examples=10, suppress_health_check=[HealthCheck.too_slow])
    def test_property_5_response_contains_all_serializer_fields(self, n: int) -> None:
        farmer = self._make_farmer('p5')
        for i in range(n):
            make_product(farmer, title=f'Product {i}')

        results = self._get_all_results(farmer)
        for r in results:
            self.assertEqual(set(r.keys()), PRODUCT_FIELDS)

    # Feature: farmer-product-listing, Property 6: Page size is at most 20
    @given(st.integers(min_value=1, max_value=100))
    @settings(max_examples=10, suppress_health_check=[HealthCheck.too_slow])
    def test_property_6_page_size_at_most_20(self, n: int) -> None:
        farmer = self._make_farmer('p6')
        for i in range(n):
            make_product(farmer, title=f'Product {i}')

        response = self.client.get(URL, **auth_header(farmer))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLessEqual(len(response.data['results']), 20)

    # Feature: farmer-product-listing, Property 7: Page navigation is consistent
    @given(st.integers(min_value=21, max_value=60))
    @settings(max_examples=5, suppress_health_check=[HealthCheck.too_slow])
    def test_property_7_page_navigation_consistent(self, n: int) -> None:
        farmer = self._make_farmer('p7')
        for i in range(n):
            make_product(farmer, title=f'Product {i}')

        # First page to get total count
        first = self.client.get(URL, **auth_header(farmer))
        total_count = first.data['count']

        all_results = self._get_all_results(farmer)
        all_ids = [r['id'] for r in all_results]

        self.assertEqual(len(all_results), total_count)
        self.assertEqual(len(all_ids), len(set(all_ids)), 'Duplicate IDs found across pages')

    # Feature: farmer-product-listing, Property 8: Buyers are forbidden
    @given(st.integers(min_value=0, max_value=5))
    @settings(max_examples=10, suppress_health_check=[HealthCheck.too_slow])
    def test_property_8_buyers_are_forbidden(self, _: int) -> None:
        buyer = self._make_buyer('p8')
        response = self.client.get(URL, **auth_header(buyer))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
