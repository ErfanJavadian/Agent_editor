"""Environment-backed application settings."""

import os
from dataclasses import dataclass

from dotenv import load_dotenv


@dataclass(frozen=True, slots=True)
class Settings:
    """Runtime settings with safe local development defaults."""

    app_name: str
    app_version: str
    cors_origins: tuple[str, ...]
    nango_api_key: str
    nango_api_base_url: str
    nango_user_id: str


def get_settings() -> Settings:
    """Load settings from environment variables and a local, ignored .env file."""

    load_dotenv()
    raw_origins = os.getenv(
        "AGENT_EDITOR_CORS_ORIGINS",
        "http://127.0.0.1:5173,http://localhost:5173",
    )
    origins = tuple(origin.strip() for origin in raw_origins.split(",") if origin.strip())

    return Settings(
        app_name=os.getenv("AGENT_EDITOR_APP_NAME", "Agent Editor"),
        app_version=os.getenv("AGENT_EDITOR_APP_VERSION", "0.1.0"),
        cors_origins=origins,
        nango_api_key=os.getenv("NANGO_API_KEY", "").strip(),
        nango_api_base_url=os.getenv("NANGO_API_BASE_URL", "https://api.nango.dev").strip(),
        nango_user_id=os.getenv("NANGO_USER_ID", "agent-editor-local-user").strip(),
    )
