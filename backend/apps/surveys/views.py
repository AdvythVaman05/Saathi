from rest_framework import viewsets, permissions
from .models import Survey, Question
from .serializers import SurveySerializer, QuestionSerializer
from apps.responses.throttles import SurveyAnonRateThrottle

class SurveyViewSet(viewsets.ModelViewSet):
    queryset = Survey.objects.filter(is_active=True)
    serializer_class = SurveySerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [SurveyAnonRateThrottle]

class QuestionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [SurveyAnonRateThrottle]
