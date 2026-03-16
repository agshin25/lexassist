from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    chroma_path: str = "./data/chromadb"
    pdf_path: str = "./data/pdfs"
    database_url: str = "postgresql://postgres:postgres@localhost:5432/lexassist"
    whisper_url: str = "http://209.209.42.142:8010"

    class Config:
        env_file = ".env"

settings = Settings()