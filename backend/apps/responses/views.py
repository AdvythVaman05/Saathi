from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Session, SessionAnswer, AuditLog
from .serializers import SessionSerializer, SessionAnswerSerializer, AuditLogSerializer
from .throttles import SurveyAnonRateThrottle, TelemetryAnonRateThrottle

class SessionViewSet(viewsets.ModelViewSet):
    queryset = Session.objects.all()
    serializer_class = SessionSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [SurveyAnonRateThrottle]

    @action(detail=False, methods=['post'], url_path='start')
    def start_session(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='resume')
    def resume_session(self, request):
        session_id = request.data.get('session_id')
        if not session_id:
            return Response({'error': 'session_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            instance = Session.objects.get(id=session_id)
            serializer = self.get_serializer(instance)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Session.DoesNotExist:
            return Response({'error': 'session not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'], url_path='pause')
    def pause_session(self, request):
        session_id = request.data.get('session_id')
        if not session_id:
            return Response({'error': 'session_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            instance = Session.objects.get(id=session_id)
            instance.status = 'paused'
            instance.save()
            serializer = self.get_serializer(instance)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Session.DoesNotExist:
            return Response({'error': 'session not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'], url_path='end')
    def end_session(self, request):
        session_id = request.data.get('session_id')
        if not session_id:
            return Response({'error': 'session_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            instance = Session.objects.get(id=session_id)
            instance.status = 'completed'
            from django.utils import timezone
            instance.completed_at = timezone.now()
            instance.save()
            serializer = self.get_serializer(instance)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Session.DoesNotExist:
            return Response({'error': 'session not found'}, status=status.HTTP_404_NOT_FOUND)

class SessionAnswerViewSet(viewsets.ModelViewSet):
    queryset = SessionAnswer.objects.all()
    serializer_class = SessionAnswerSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [SurveyAnonRateThrottle]

class AuditLogViewSet(viewsets.ModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [TelemetryAnonRateThrottle]
