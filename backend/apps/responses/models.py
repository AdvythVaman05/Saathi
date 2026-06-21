import uuid
from django.db import models
from apps.users.models import User
from apps.surveys.models import Survey, Question

class Session(models.Model):
    STATUS_CHOICES = [
        ('started', 'Started'),
        ('paused', 'Paused'),
        ('completed', 'Completed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name='sessions')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='sessions')
    current_question = models.ForeignKey(Question, on_delete=models.SET_NULL, null=True, blank=True)
    language = models.CharField(max_length=10, default='en')
    accessibility_mode = models.CharField(max_length=50, default='assisted')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='started')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'responses_session'

class SessionAnswer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    answer_value = models.JSONField() # JSON payload mapping the response value(s)
    is_confirmed = models.BooleanField(default=False)
    confidence_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'responses_sessionanswer'
        unique_together = ('session', 'question')

class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='logs')
    action = models.CharField(max_length=100) # Event type string (standardised)
    payload = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'responses_auditlog'
        ordering = ['created_at']
