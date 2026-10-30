from pydantic_settings import BaseSettings
from pathlib import Path
from typing import List


BASE_DIR = Path(__file__).resolve().parent.parent.parent  # backend/


class Settings(BaseSettings):
    environment: str = "development"
    log_level: str = "INFO"

    # Paths
    data_raw_dir: Path = BASE_DIR / "data" / "raw"
    data_interim_dir: Path = BASE_DIR / "data" / "interim"
    data_processed_dir: Path = BASE_DIR / "data" / "processed"
    models_dir: Path = BASE_DIR / "models"

    # CORS
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ]

    # ML Configuration
    delay_threshold_minutes: int = 15  # BTS standard: delayed if DEP_DELAY >= 15 min
    random_seed: int = 42

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

# Ensure directories exist
for _dir in [
    settings.data_raw_dir,
    settings.data_interim_dir,
    settings.data_processed_dir,
    settings.models_dir,
]:
    _dir.mkdir(parents=True, exist_ok=True)
