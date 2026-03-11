from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
from app.rag import ask, ingest_pdf, search
from app.config import settings
import os
import shutil

router = APIRouter(prefix="/api", tags=["chat"])

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    answer: str
    sources: list[str]

class IngestResponse(BaseModel):
    filename: str
    chunks: int
    message: str

@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    result = ask(request.message)
    return ChatResponse(
        answer=result["answer"],
        sources=result["sources"]
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

    files = []
    for filename in os.listdir(pdf_dir):
        if filename.endswith(".pdf"):
            filepath = os.path.join(pdf_dir, filename)
            files.append({
                "filename": filename,
                "size_mb": round(os.path.getsize(filepath) / 1024 / 1024, 2)
            })

    return {"documents": files}

@router.get("/debug")
def debug():
    """Debug: see what's in ChromaDB"""
    from app.rag import get_or_create_collection, search
    
    collection = get_or_create_collection()
    
    # Get all chunks
    all_data = collection.get()
    
    # Search test
    test_results = search("Boşanma prosesi necə həyata keçirilir?")
    
    return {
        "total_chunks": collection.count(),
        "all_chunks": [doc[:100] for doc in all_data['documents']] if all_data['documents'] else [],
        "search_results": test_results
    }