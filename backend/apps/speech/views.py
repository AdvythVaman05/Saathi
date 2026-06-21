import os
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from openai import AsyncOpenAI

logger = logging.getLogger('apps.speech')

class TranscribeView(APIView):
    permission_classes = [permissions.AllowAny]

    async def post(self, request, *args, **kwargs):
        # 1. Receive audio file from request
        audio_file = request.FILES.get('audio')
        if not audio_file:
            logger.warning("Transcription request rejected: No audio file provided.")
            return Response({"error": "No audio file provided"}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Get API credentials and model configurations from environment variables
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            logger.error("GROQ_API_KEY environment variable is not configured.")
            return Response({"error": "Transcription service configuration error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Configurable Groq model with default fallback
        whisper_model = os.environ.get("GROQ_WHISPER_MODEL", "whisper-large-v3")

        # 3. Call Groq Whisper API (OpenAI SDK compatible)
        try:
            client = AsyncOpenAI(
                api_key=api_key,
                base_url="https://api.groq.com/openai/v1"
            )

            file_bytes = audio_file.read()
            file_name = audio_file.name or "audio.wav"

            logger.info(f"Uploading audio file '{file_name}' to Groq using model '{whisper_model}'...", extra={"event": "GROQ_TRANSCRIBE_START"})
            
            response = await client.audio.transcriptions.create(
                file=(file_name, file_bytes, "audio/wav"),
                model=whisper_model,
                response_format="verbose_json"
            )

            transcript = getattr(response, 'text', '')
            confidence = 0.95 # High default confidence for Whisper large

            logger.info(f"Groq Whisper transcription successful. Result: '{transcript}'", extra={"event": "GROQ_TRANSCRIBE_SUCCESS"})
            
            return Response({
                "transcript": transcript,
                "confidence": confidence
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Groq Whisper transcription failed: {str(e)}", extra={"event": "GROQ_TRANSCRIBE_ERROR"})
            return Response({"error": f"Transcription failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
