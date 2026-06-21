import uuid
from django.db import models

class User(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, null=True, blank=True)
    role = models.CharField(max_length=50, default='participant') # 'admin', 'participant'
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'users_user'

class AccessibilityPreferences(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='accessibility_preferences', db_column='user_id')
    speech_rate = models.DecimalField(max_digits=3, decimal_places=2, default=1.00)
    speech_volume = models.DecimalField(max_digits=3, decimal_places=2, default=1.00)
    text_scale = models.DecimalField(max_digits=3, decimal_places=2, default=1.00)
    high_contrast = models.BooleanField(default=False)
    reduced_motion = models.BooleanField(default=False)
    preferred_voice = models.CharField(max_length=100, default='default')
    preferred_language = models.CharField(max_length=10, default='en')

    class Meta:
        db_table = 'users_accessibilitypreferences'
