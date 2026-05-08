import httpx
import asyncio
from typing import Any, Dict, Optional
from app.services.graph_auth_service import graph_auth_service

class GraphClient:
    def __init__(self):
        self.base_url = "https://graph.microsoft.com/v1.0"
        self.client = httpx.AsyncClient(base_url=self.base_url)

    async def _request(self, method: str, endpoint: str, **kwargs) -> Any:
        token = await graph_auth_service.get_access_token()
        headers = kwargs.pop("headers", {})
        headers["Authorization"] = f"Bearer {token}"
        headers["Content-Type"] = "application/json"
        
        url = endpoint if endpoint.startswith("/") else f"/{endpoint}"
        
        response = await self.client.request(method, url, headers=headers, **kwargs)
        
        # Handle 401 Unauthorized (Token may have been revoked or expired despite cache)
        if response.status_code == 401:
            token = await graph_auth_service.get_access_token(force_refresh=True)
            headers["Authorization"] = f"Bearer {token}"
            response = await self.client.request(method, url, headers=headers, **kwargs)
            
        # Handle 429 Too Many Requests (Exponential Backoff)
        retries = 0
        max_retries = 3
        while response.status_code == 429 and retries < max_retries:
            retry_after = int(response.headers.get("Retry-After", 2 ** retries))
            await asyncio.sleep(retry_after)
            response = await self.client.request(method, url, headers=headers, **kwargs)
            retries += 1
            
        response.raise_for_status()
        
        if response.status_code == 204:
            return None
            
        return response.json()

    async def get(self, endpoint: str, params: Optional[Dict] = None) -> Any:
        return await self._request("GET", endpoint, params=params)

    async def post(self, endpoint: str, data: Dict) -> Any:
        return await self._request("POST", endpoint, json=data)
        
    async def delete(self, endpoint: str) -> Any:
        return await self._request("DELETE", endpoint)
        
    async def close(self):
        await self.client.aclose()

graph_client = GraphClient()
