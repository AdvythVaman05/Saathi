import os
import logging
from django.http import JsonResponse
from django.db import connection
import urllib.request
import urllib.error

logger = logging.getLogger('apps.api')

def health_check(request):
    """
    Liveness probe (/health) - returns 200 OK immediately if the web process is running.
    """
    return JsonResponse({
        "status": "healthy",
        "services": {
            "web": "ok"
        }
    }, status=200)

def ready_check(request):
    """
    Readiness probe (/ready) - validates DB, Redis, and OpenAI API key settings.
    """
    status_code = 200
    services = {
        "database": "ok",
        "websocket_broker": "ok",
        "openai_api": "ok"
    }

    # 1. Database Check
    try:
        connection.ensure_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1;")
    except Exception as e:
        logger.error(f"Readiness check failed: Database connection error: {str(e)}")
        services["database"] = f"error: {str(e)}"
        status_code = 503

    # 2. Redis / Channels Layer Check
    try:
        import channels.layers
        channel_layer = channels.layers.get_channel_layer()
        if not channel_layer:
            services["websocket_broker"] = "error: channel layer not configured"
            status_code = 503
    except Exception as e:
        logger.error(f"Readiness check failed: Channels layer error: {str(e)}")
        services["websocket_broker"] = f"error: {str(e)}"
        status_code = 503

    # 3. Groq Connectivity Check
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        services["groq_api"] = "error: API key not configured"
        status_code = 503
    else:
        # Perform quick network ping to Groq endpoint
        try:
            # Set timeout to 1.5 seconds to avoid blocking
            urllib.request.urlopen("https://api.groq.com/openai/v1/models", timeout=1.5)
        except urllib.error.HTTPError as e:
            # 401 Unauthorized is expected, but proves Groq is online and reachable!
            if e.code == 401:
                services["groq_api"] = "ok (reachable)"
            else:
                services["groq_api"] = f"error: HTTP {e.code}"
                status_code = 503
        except Exception as e:
            logger.error(f"Readiness check failed: Groq unreachable: {str(e)}")
            services["groq_api"] = f"unreachable: {str(e)}"
            status_code = 503

    response_data = {
        "status": "ready" if status_code == 200 else "not_ready",
        "services": services
    }
    return JsonResponse(response_data, status=status_code)

