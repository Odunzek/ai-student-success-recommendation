"""Application configuration settings."""

from pathlib import Path
from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # API settings
    api_title: str = "Student Success Platform API"
    api_version: str = "1.0.0"
    api_prefix: str = "/api/v1"
    debug: bool = False

    # Model paths (relative to project root)
    project_root: Path = Path(__file__).parent.parent
    # CatBoost baseline model — 12 features (5 numeric + 7 native categorical)
    # Baseline chosen over tuned: higher Recall (0.9009 vs 0.8983) on held-out test set
    model_path: Path = project_root / "models" / "catboost_baseline_production.pkl"
    student_data_path: Path = project_root / "data" / "processed" / "student_features.csv"

    # LLM settings
    llm_timeout: float = 30.0
    llm_enabled: bool = True

    # OpenAI settings
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    openai_base_url: str | None = None  # Optional for Azure/proxies

    # Feature configuration — matches catboost_baseline_production.pkl training order
    numeric_features: list[str] = [
        "num_of_prev_attempts",
        "studied_credits",
        "avg_score",
        "total_clicks",
        "completion_rate",
    ]
    categorical_features: list[str] = [
        "code_module",
        "gender",
        "region",
        "highest_education",
        "imd_band",
        "age_band",
        "disability",
    ]

    # Risk classification thresholds (configurable via env)
    risk_threshold_high: int = 70  # Score >= this is high risk
    risk_threshold_medium: int = 40  # Score >= this is medium risk (below is low)

    # Model accuracy (if known from training, otherwise None)
    model_accuracy: float | None = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
