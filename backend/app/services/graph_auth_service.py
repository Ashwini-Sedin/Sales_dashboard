import msal
import redis.asyncio as aioredis
try:
    from upstash_redis.asyncio import Redis as UpstashRedis
except ImportError:
    UpstashRedis = None
from typing import Optional
from app.core.config import settings

class GraphAuthService:
    def __init__(self):
        self.tenant_id = settings.AZURE_TENANT_ID
        self.client_id = settings.AZURE_CLIENT_ID
        self.client_secret = settings.AZURE_CLIENT_SECRET
        self.authority = f"https://login.microsoftonline.com/{self.tenant_id}" if self.tenant_id else ""
        self.scope = ["https://graph.microsoft.com/.default"]
        
        # We instantiate redis using the async Redis client or Upstash
        if settings.UPSTASH_REDIS_REST_URL and settings.UPSTASH_REDIS_REST_TOKEN and UpstashRedis:
            self.redis = UpstashRedis(
                url=settings.UPSTASH_REDIS_REST_URL,
                token=settings.UPSTASH_REDIS_REST_TOKEN
            )
        else:
            self.redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        
        if self.client_id and self.client_secret and self.tenant_id:
            self.app = msal.ConfidentialClientApplication(
                self.client_id,
                authority=self.authority,
                client_credential=self.client_secret,
            )
        else:
            self.app = None

    async def get_access_token(self, force_refresh: bool = False) -> str:
        if not self.app:
            raise ValueError("Azure MSAL credentials not configured in environment.")
        
        cache_key = f"msal_token:{self.tenant_id}:{self.client_id}"
        
        if not force_refresh:
            cached_token = await self.redis.get(cache_key)
            if cached_token:
                return cached_token
                
        # Fetch new token via Client Credentials Flow
        result = self.app.acquire_token_for_client(scopes=self.scope)
        
        if "access_token" in result:
            token = result["access_token"]
            expires_in = result.get("expires_in", 3599)
            
            # TTL = expiry minus 5 minutes (300 seconds) to ensure we always have a valid token
            ttl = max(60, expires_in - 300)
            
            await self.redis.set(cache_key, token, ex=ttl)
            return token
        else:
            error_msg = result.get("error_description", str(result))
            raise Exception(f"Failed to acquire Microsoft Graph token: {error_msg}")

graph_auth_service = GraphAuthService()
