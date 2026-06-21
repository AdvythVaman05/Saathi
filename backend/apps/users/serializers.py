from rest_framework import serializers
from .models import User, AccessibilityPreferences

class AccessibilityPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccessibilityPreferences
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    accessibility_preferences = AccessibilityPreferencesSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = '__all__'
