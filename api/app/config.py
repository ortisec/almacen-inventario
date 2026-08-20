from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://almacen:almacen123@localhost:5433/almacen"

    auth_user: str = ""
    auth_password: str = ""
    auth_secret_key: str = "secret-cambiar-en-produccion"
    access_token_expire_minutes: int = 480


settings = Settings()