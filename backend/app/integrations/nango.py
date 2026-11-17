"""Nango agent-session and remote MCP integration.

The NANGO_API_KEY stays on the backend. Only short-lived connect URLs and
sanitized tool-discovery results are returned to the local UI.
"""

from __future__ import annotations

import json
from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import Any, AsyncIterator

import httpx
import httpx2
from mcp import Client
from mcp.client.streamable_http import streamable_http_client

from app.core.config import Settings, get_settings

GITHUB_PROVIDER = "github"


class NangoConfigurationError(RuntimeError):
    """Raised when Nango is not configured locally."""


class NangoAPIError(RuntimeError):
    """Raised when Nango rejects an API operation."""


@dataclass(frozen=True, slots=True)
class NangoSession:
    """Short-lived server-side credentials for one Nango agent session."""

    session_id: str
    session_token: str
    mcp_url: str
    expires_at: str | None


class NangoService:
    """Small backend-owned client for Nango REST and MCP APIs."""

    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    def _api_key(self) -> str:
        key = self.settings.nango_api_key
        if not key:
            raise NangoConfigurationError(
                "Nango is not configured. Add NANGO_API_KEY to the local .env file."
            )
        return key

    async def _request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, str] | None = None,
        body: dict[str, Any] | None = None,
    ) -> Any:
        headers = {"Authorization": f"Bearer {self._api_key()}"}
        async with httpx.AsyncClient(
            base_url=self.settings.nango_api_base_url.rstrip("/"),
            timeout=httpx.Timeout(20.0),
            headers=headers,
        ) as client:
            response = await client.request(method, path, params=params, json=body)

        if not response.is_success:
            raise NangoAPIError(f"Nango API returned HTTP {response.status_code}.")

        try:
            payload = response.json()
        except ValueError as exc:
            raise NangoAPIError("Nango returned an invalid JSON response.") from exc

        if isinstance(payload, dict) and payload.get("error"):
            error = payload["error"]
            code = error.get("code") if isinstance(error, dict) else None
            suffix = f" ({code})" if code else ""
            raise NangoAPIError(f"Nango rejected the request{suffix}.")

        if isinstance(payload, dict) and "data" in payload:
            return payload["data"]
        return payload

    @staticmethod
    def _records(value: Any, *keys: str) -> list[dict[str, Any]]:
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]
        if isinstance(value, dict):
            for key in keys:
                nested = value.get(key)
                if isinstance(nested, list):
                    return [item for item in nested if isinstance(item, dict)]
        return []

    async def ensure_github_integration(self) -> None:
        """Create the GitHub integration if it does not already exist."""
        providers_data = await self._request(
            "GET", "/providers", params={"search": GITHUB_PROVIDER}
        )
        providers = self._records(providers_data, "providers")
        provider = next(
            (
                item
                for item in providers
                if item.get("name") == GITHUB_PROVIDER
                or item.get("provider") == GITHUB_PROVIDER
            ),
            None,
        )
        if provider is None:
            raise NangoAPIError("The GitHub provider was not found in the Nango catalog.")

        integrations_data = await self._request("GET", "/integrations")
        integrations = self._records(integrations_data, "integrations")
        already_exists = any(
            item.get("unique_key") == GITHUB_PROVIDER
            or (
                item.get("provider") == GITHUB_PROVIDER
                and item.get("unique_key") == GITHUB_PROVIDER
            )
            for item in integrations
        )
        if already_exists:
            return

        body: dict[str, Any] = {
            "provider": GITHUB_PROVIDER,
            "unique_key": GITHUB_PROVIDER,
        }
        auth_mode = str(provider.get("auth_mode", "")).upper()
        if auth_mode in {"OAUTH2", "OAUTH1", "APP"}:
            body["credentials"] = {"type": "NANGO_MANAGED"}

        try:
            await self._request("POST", "/integrations", body=body)
        except NangoAPIError:
            # A concurrent setup may have created it between the list and create calls.
            refreshed = self._records(
                await self._request("GET", "/integrations"), "integrations"
            )
            if not any(item.get("unique_key") == GITHUB_PROVIDER for item in refreshed):
                raise

    def build_session_payload(self) -> dict[str, Any]:
        """Build a least-scope session for this private, single-user workbench."""
        user_id = self.settings.nango_user_id
        return {
            "tenant": {
                "connections": {
                    "any": [{"tags": {"end_user_id": user_id}}],
                },
            },
            "toolset": {GITHUB_PROVIDER: "*"},
            "meta_tools": {
                "nango_create_connection": {
                    "enabled": True,
                    "tags": {"end_user_id": user_id},
                },
            },
            "expires_in": "10m",
        }

    async def create_session(self) -> NangoSession:
        await self.ensure_github_integration()
        data = await self._request(
            "POST", "/sessions", body=self.build_session_payload()
        )
        if not isinstance(data, dict):
            raise NangoAPIError("Nango returned an invalid agent-session response.")

        session_id = data.get("session_id")
        session_token = data.get("session_token")
        mcp_url = data.get("mcp_url")
        if not all(isinstance(item, str) and item for item in (session_id, session_token, mcp_url)):
            raise NangoAPIError("Nango agent-session response is missing required fields.")

        return NangoSession(
            session_id=session_id,
            session_token=session_token,
            mcp_url=mcp_url,
            expires_at=data.get("expires_at"),
        )

    @asynccontextmanager
    async def open_mcp_session(
        self, session: NangoSession
    ) -> AsyncIterator[Client]:
        """Open Nango's Streamable HTTP MCP server without exposing its token."""
        timeout = httpx2.Timeout(30.0, read=300.0)
        async with httpx2.AsyncClient(
            headers={"Authorization": f"Bearer {session.session_token}"},
            timeout=timeout,
        ) as http_client:
            transport = streamable_http_client(
                session.mcp_url,
                http_client=http_client,
                terminate_on_close=False,
            )
            async with Client(transport) as mcp_client:
                yield mcp_client

    @staticmethod
    def _tool_result_data(result: Any) -> Any:
        """Convert an MCP result to JSON-compatible data."""
        structured = getattr(result, "structured_content", None)
        if structured is None:
            structured = getattr(result, "structuredContent", None)
        if structured is not None:
            return structured

        content: list[Any] = []
        for block in getattr(result, "content", []) or []:
            block_text = getattr(block, "text", None)
            if isinstance(block_text, str):
                try:
                    content.append(json.loads(block_text))
                except ValueError:
                    content.append(block_text)

        return {
            "content": content,
            "is_error": bool(
                getattr(result, "is_error", getattr(result, "isError", False))
            ),
        }

    @staticmethod
    def _find_value(value: Any, key: str) -> Any:
        if isinstance(value, dict):
            if key in value:
                return value[key]
            for nested in value.values():
                found = NangoService._find_value(nested, key)
                if found is not None:
                    return found
        elif isinstance(value, list):
            for nested in value:
                found = NangoService._find_value(nested, key)
                if found is not None:
                    return found
        elif isinstance(value, str) and value.startswith("{"):
            try:
                return NangoService._find_value(json.loads(value), key)
            except ValueError:
                return None
        return None

    async def create_github_connect_link(self) -> dict[str, str | None]:
        """Ask the Nango session for a short-lived GitHub authorization link."""
        session = await self.create_session()
        async with self.open_mcp_session(session) as mcp_client:
            result = await mcp_client.call_tool(
                "nango_create_connection", {"integration": GITHUB_PROVIDER}
            )

        data = self._tool_result_data(result)
        connect_url = self._find_value(data, "connect_url")
        expires_at = self._find_value(data, "expires_at")
        if not isinstance(connect_url, str) or not connect_url.startswith("https://"):
            raise NangoAPIError("Nango did not return a valid GitHub connect URL.")

        return {
            "provider": GITHUB_PROVIDER,
            "connect_url": connect_url,
            "expires_at": expires_at if isinstance(expires_at, str) else None,
        }

    async def search_tools(
        self, *, queries: list[str], goal: str
    ) -> Any:
        """Discover Nango catalog tools for the connected GitHub account."""
        session = await self.create_session()
        async with self.open_mcp_session(session) as mcp_client:
            result = await mcp_client.call_tool(
                "nango_tool_search",
                {"queries": queries[:5], "goal": goal},
            )
        return self._tool_result_data(result)
