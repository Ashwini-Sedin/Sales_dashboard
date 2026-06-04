from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"  # development or production
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    REDIS_URL: str
    UPSTASH_REDIS_REST_URL: Optional[str] = None
    UPSTASH_REDIS_REST_TOKEN: Optional[str] = None
    
    # AWS Settings
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: Optional[str] = None
    AWS_BUCKET_NAME: Optional[str] = None
    
    # Azure / MSAL Settings
    AZURE_CLIENT_ID: Optional[str] = None
    AZURE_CLIENT_SECRET: Optional[str] = None
    AZURE_TENANT_ID: Optional[str] = None
    
    # SendGrid
    SENDGRID_API_KEY: Optional[str] = None
    
    # Google Ads Integration
    GOOGLE_ADS_CUSTOMER_ID: Optional[str] = None
    GOOGLE_ADS_DEVELOPER_TOKEN: Optional[str] = None
    GOOGLE_ADS_API_KEY: Optional[str] = None
    GOOGLE_ADS_WEBHOOK_SECRET: Optional[str] = None
    GOOGLE_ADS_SYNC_INTERVAL_MINUTES: int = 15

    # Document Engine Settings
    SHAREPOINT_SITE_ID: Optional[str] = None
    AWS_S3_DOCUMENTS_BUCKET: str = "dealflow-documents"

    # GateLLM Integration
    GATELLM_API_KEY: Optional[str] = None
    GATELLM_API_BASE: Optional[str] = None
    GATELLM_MODEL: Optional[str] = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

# Instantiate settings to load environment variables from .env
settings = Settings()
