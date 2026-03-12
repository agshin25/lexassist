from fastapi import APIRouter, UploadFile, File, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.rag import ask, ingest_pdf, delete_document, get_or_create_collection
from app.config import settings
from app.database import get_db
from app.models import Conversation, Message
import os
import shutil
import json

router = APIRouter(prefix="/api", tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]
    conversation_id: str


class IngestResponse(BaseModel):
    filename: str
    chunks: int
    message: str


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    if request.conversation_id:
        conv = db.query(Conversation).filter(Conversation.id == request.conversation_id).first()
        if not conv:
            conv = Conversation(title=request.message[:40])
            db.add(conv)
            db.commit()
            db.refresh(conv)
    else:
        conv = Conversation(title=request.message[:40])
        db.add(conv)
        db.commit()
        db.refresh(conv)

    if conv.title == "Yeni söhbət":
        conv.title = request.message[:40]
        db.commit()

    user_msg = Message(conversation_id=conv.id, role="user", content=request.message)
    db.add(user_msg)
    db.commit()

    recent_messages = (
        db.query(Message)
        .filter(Message.conversation_id == conv.id)
        .order_by(Message.created_at.asc())
        .all()
    )

    history = [
        {"role": msg.role, "content": msg.content}
        for msg in recent_messages[:-1]
    ]

    result = ask(request.message, history=history)

    ai_msg = Message(
        conversation_id=conv.id,
        role="assistant",
        content=result["answer"],
        sources=json.dumps(result["sources"]),
    )
    db.add(ai_msg)
    db.commit()

    return ChatResponse(
        answer=result["answer"],
        sources=result["sources"],
        conversation_id=conv.id,
    )


@router.post("/upload", response_model=IngestResponse)
def upload_pdf(file: UploadFile = File(...)):
    os.makedirs(settings.pdf_path, exist_ok=True)
    file_path = os.path.join(settings.pdf_path, file.filename)

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    chunks_count = ingest_pdf(file_path)

    return IngestResponse(
        filename=file.filename,
        chunks=chunks_count,
        message=f"{file.filename} processed successfully. {chunks_count} chunks created."
    )


@router.get("/documents")
def list_documents():
    pdf_dir = settings.pdf_path
    if not os.path.exists(pdf_dir):
        return {"documents": []}

    collection = get_or_create_collection()
    all_data = collection.get()

    chunk_counts = {}
    for meta in all_data['metadatas']:
        src = meta.get('source', '')
        chunk_counts[src] = chunk_counts.get(src, 0) + 1

    files = []
    for filename in os.listdir(pdf_dir):
        if filename.endswith(".pdf"):
            filepath = os.path.join(pdf_dir, filename)
            files.append({
                "filename": filename,
                "size_mb": round(os.path.getsize(filepath) / 1024 / 1024, 2),
                "chunks": chunk_counts.get(filename, 0),
                "uploaded_at": os.path.getmtime(filepath),
            })

    return {"documents": files}


@router.delete("/documents/{filename}")
def remove_document(filename: str):
    pdf_dir = settings.pdf_path
    filepath = os.path.join(pdf_dir, filename)

    deleted_chunks = delete_document(filename)

    if os.path.exists(filepath):
        os.remove(filepath)

    return {"message": f"{filename} deleted", "chunks_removed": deleted_chunks}


