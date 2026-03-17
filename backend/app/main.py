from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.chat import router as chat_router
from app.routers.conversations import router as conversations_router
from app.routers.voice import router as voice_router
from app.database import engine
from app.models import Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="LexAssist API", version="1.0.0", openapi_version="3.0.3")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(conversations_router)
app.include_router(voice_router)

@app.get("/")
def root():
    return {"message": "LexAssist API is running"}

@app.get("/health")
def health():
    return {"status": "ok"}