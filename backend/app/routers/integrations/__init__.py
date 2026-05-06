"""
Integration routers for external services (Google Ads, etc.)
"""

from app.routers.integrations.google_ads import router as google_ads_router

__all__ = ["google_ads_router"]
