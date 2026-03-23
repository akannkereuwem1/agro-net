from django.urls import path
from .views import ProductListView, ProductDetailView, ProductImageUploadView, FarmerProductListView

urlpatterns = [
    path('', ProductListView.as_view(), name='product-list'),
    path('my/', FarmerProductListView.as_view(), name='farmer-product-list'),
    path('<uuid:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('<uuid:pk>/image/', ProductImageUploadView.as_view(), name='product-image'),
]
