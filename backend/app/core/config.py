"""Environment-backed application settings."""

from dataclasses import dataclass
import os


@dataclass(frozen=True, slots=True)
class Settings:
    """Runtime settings with safe local development defaults."""

    app_name: str
    app_version: str
    cors_origins: tuple[str, ...]


def get_settings() -> Settings:
    """Load settings from environment variables."""

    raw_origins = os.getenv(
        "AGENT_EDITOR_CORS_ORIGINS",
        "http://127.0.0.1:5173,http://localhost:5173",
    )
    origins = tuple(origin.strip() for origin in raw_origins.split(",") if origin.strip())

    return Settings(
        app_name=os.getenv("AGENT_EDITOR_APP_NAME", "Agent Editor"),
        app_version=os.getenv("AGENT_EDITOR_APP_VERSION", "0.1.0"),
        cors_origins=origins,
    )
