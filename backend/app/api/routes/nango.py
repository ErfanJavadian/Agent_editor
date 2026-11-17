"""Local API endpoints for Nango setup and agent-tool discovery."""

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.config import get_settings
from app.integrations.nango import NangoAPIError, NangoConfigurationError, NangoService

router = APIRouter(prefix="/integrations/nango", tags=["integrations"])


class NangoStatusResponse(BaseModel):
    """Public status; never includes an API key or session token."""

    configured: bool
    provider: str = "github"


class ToolSearchRequest(BaseModel):
    """Bounded tool-discovery request."""

    queries: list[str] = Field(min_length=1, max_length=5)
    goal: str = Field(min_length=3, max_length=500)


class ToolSearchResponse(BaseModel):
    """Sanitized tool-search output."""

    results: Any


@router.get("/status", response_model=NangoStatusResponse)
async def nango_status() -> NangoStatusResponse:
    """Report whether the local backend has a Nango API key."""
    settings = get_settings()
    return NangoStatusResponse(configured=bool(settings.nango_api_key))


@router.post("/github/connect")
async def create_github_connect_link() -> dict[str, str | None]:
    """Create a short-lived link to authorize the private GitHub connection."""
    try:
        return await NangoService().create_github_connect_link()
    except NangoConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except NangoAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/tools/search", response_model=ToolSearchResponse)
async def search_nango_tools(request: ToolSearchRequest) -> ToolSearchResponse:
    """Discover available GitHub tools through the session-scoped MCP server."""
    try:
        results = await NangoService().search_tools(
            queries=request.queries,
            goal=request.goal,
        )
        return ToolSearchResponse(results=results)
    except NangoConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except NangoAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
