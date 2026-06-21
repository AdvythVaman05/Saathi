from rest_framework import serializers
from .models import Session, SessionAnswer, AuditLog

class SessionAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionAnswer
        fields = '__all__'

class SessionSerializer(serializers.ModelSerializer):
    answers = SessionAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = Session
        fields = '__all__'

class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'
