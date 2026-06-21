import uuid
from django.db import models

class Survey(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.JSONField() # JSONField for localized survey title
    description = models.JSONField() # JSONField for localized survey description
    is_active = models.BooleanField(default=True)
    default_language = models.CharField(max_length=10, default='en')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'surveys_survey'

class Question(models.Model):
    QUESTION_TYPES = [
        ('single_choice', 'Single Choice'),
        ('multi_choice', 'Multiple Choice'),
        ('text', 'Free Text'),
        ('scale', 'Rating Scale'),
        ('boolean', 'Yes/No'),
        ('ranking', 'Ranking'),
        ('matrix', 'Matrix Grid'),
        ('date', 'Date Input'),
        ('time', 'Time Input'),
        ('audio_response', 'Audio Dictation'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name='questions')
    order = models.IntegerField()
    question_text = models.JSONField() # Structure: {"en": "Text", "hi": "Text in Hindi"}
    question_type = models.CharField(max_length=50, choices=QUESTION_TYPES)
    options = models.JSONField(null=True, blank=True) # Options list
    routing_rules = models.JSONField(null=True, blank=True) # Branching skip logic
    required = models.BooleanField(default=True)

    class Meta:
        db_table = 'surveys_question'
        ordering = ['order']
        indexes = [
            models.Index(fields=['survey', 'order']),
        ]
