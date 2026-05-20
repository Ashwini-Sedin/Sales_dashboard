from fastapi import APIRouter, Depends, HTTPException
from app.core.dependencies import require_roles
from app.models.user import User, UserRole
from app.services.graph_client import graph_client

router = APIRouter(prefix="/api/integrations/graph", tags=["graph_integration"])

@router.get("/test")
async def test_graph_auth(
    current_user: User = Depends(require_roles([UserRole.admin, UserRole.division_head]))
):
    """
    Test endpoint to verify Microsoft Graph API authentication.
    Fetches the organization info from the Azure tenant to confirm the token is working.
    """
    try:
        org_info = await graph_client.get("/organization")
        return {
            "status": "success",
            "message": "Microsoft Graph API authentication successful.",
            "data": org_info
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to authenticate with Microsoft Graph API: {str(e)}"
        )
