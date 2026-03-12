from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ollama_url: str = "http://209.209.42.142:11434"
    ollama_model: str = "llama3:8b"
    chroma_path: str = "./data/chromadb"
    pdf_path: str = "./data/pdfs"
    database_url: str = "postgresql://postgres:postgres@localhost:5432/lexassist"

    class Config:
        env_file = ".env"

settings = Settings()