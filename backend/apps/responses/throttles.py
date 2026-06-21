from rest_framework.throttling import AnonRateThrottle

class SurveyAnonRateThrottle(AnonRateThrottle):
    scope = 'survey'

class TelemetryAnonRateThrottle(AnonRateThrottle):
    scope = 'telemetry'
