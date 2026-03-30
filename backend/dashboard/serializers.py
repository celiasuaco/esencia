from product.serializers import ProductSerializer
from rest_framework import serializers


class ShowcaseSerializer(serializers.Serializer):
    last_units = ProductSerializer(many=True)
    best_sellers = ProductSerializer(many=True)
