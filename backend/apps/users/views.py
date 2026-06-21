from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import User, AccessibilityPreferences
from .serializers import UserSerializer, AccessibilityPreferencesSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

class AccessibilityPreferencesViewSet(viewsets.ModelViewSet):
    queryset = AccessibilityPreferences.objects.all()
    serializer_class = AccessibilityPreferencesSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        user_id = self.request.query_params.get('user_id') or self.request.headers.get('X-User-ID')
        if user_id:
            return self.queryset.filter(user_id=user_id)
        return self.queryset

    def list(self, request, *args, **kwargs):
        """
        Intercept GET /api/users/preferences/ to automatically resolve and return 
        the profile settings matching the user_id header.
        """
        user_id = request.headers.get('X-User-ID') or request.query_params.get('user_id')
        if not user_id:
            return Response({'error': 'X-User-ID header or user_id query parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Dynamically get or create preferences link for this user
            user = User.objects.get(id=user_id)
            pref, created = AccessibilityPreferences.objects.get_or_create(user=user)
            serializer = self.get_serializer(pref)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, *args, **kwargs):
        """
        Provide collection-level PUT support to easily sync preferences from client.
        Maps to PUT /api/users/preferences/
        """
        user_id = request.headers.get('X-User-ID')
        if not user_id:
            return Response({'error': 'X-User-ID header is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)
            pref, created = AccessibilityPreferences.objects.get_or_create(user=user)
            serializer = self.get_serializer(pref, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
