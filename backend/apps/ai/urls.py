from django.urls import path

from .views import ImageClassificationView, PricePredictionView

urlpatterns = [
    path("classify-image/", ImageClassificationView.as_view(), name="ai-classify-image"),
    path("predict-price/", PricePredictionView.as_view(), name="ai-predict-price"),
]
