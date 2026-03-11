from sentence_transformers import SentenceTransformer
import chromadb
import fitz 
import ollama
from app.config import settings
import os
from ollama import Client

embedding_model = SentenceTransformer('intfloat/multilingual-e5-large')
chroma_client = chromadb.PersistentClient(path=settings.chroma_path)
ollama_client = Client(host=settings.ollama_url)

def get_or_create_collection():
    return chroma_client.get_or_create_collection("legal_docs")

def extract_text_from_pdf(pdf_path:str) -> str:
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text

def chunk_text(text: str) -> list[str]:
    chunks = []
    current_chunk = ""
    for line in text.split("\n"):
        if line.strip().startswith("Maddə") and current_chunk:
            chunks.append(current_chunk.strip())
            current_chunk = line + "\n"
        else:
            current_chunk += line + "\n"  
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
    chunks = [c for c in chunks if len(c) > 50]
    return chunks

def ingest_pdf(pdf_path: str) -> int:
    text = extract_text_from_pdf(pdf_path)

    chunks = chunk_text(text)

    if not chunks:
        return 0

    embeddings = embedding_model.encode(chunks)

    collection = get_or_create_collection()
    filename = os.path.basename(pdf_path)

    ids = [f"{filename}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [{"source": filename, "chunk_index": i} for i in range(len(chunks))]

    collection.add(
        documents=chunks,
        embeddings=embeddings.tolist(),
        ids=ids,
        metadatas=metadatas
    )

    return len(chunks)

def search(query: str, n_results: int = 3) -> list[dict]:
    collection = get_or_create_collection()

    if collection.count() == 0:
        return []

    query_embedding = embedding_model.encode([query])

    results = collection.query(
        query_embeddings=query_embedding.tolist(),
        n_results=n_results
    )

    matches = []
    for i in range(len(results['documents'][0])):
        matches.append({
            "text": results['documents'][0][i],
            "source": results['metadatas'][0][i]['source'],
        })

    return matches

def ask(question: str) -> dict:
    matches = search(question)
    if not matches:
        return {
            "answer": "Verilənlər bazasında məlumat tapılmadı. Zəhmət olmasa əvvəlcə PDF sənədləri yükləyin.",
            "sources": []
        }
    context = "\n\n".join([m["text"] for m in matches])
    prompt = f"""Sən Azərbaycan hüquq üzrə köməkçisən.
    Aşağıdakı qanun mətnlərinə əsasən suala ətraflı cavab ver.

    QAYDALAR:
    1. YALNIZ aşağıdakı kontekstdəki məlumatdan istifadə et
    2. Maddə nömrələrini mütləq qeyd et
    3. Qanun mətnini olduğu kimi sitat gətir
    4. Cavabı strukturlu şəkildə ver - hər maddəni ayrıca izah et
    5. Kontekstdə cavab yoxdursa "Bu barədə məlumat tapılmadı" yaz
    6. Cavab ətraflı və tam olmalıdır - bütün aidiyyatlı maddələri qeyd et

    Kontekst:
    {context}

    Sual: {question}

    Ətraflı cavab (bütün aidiyyatlı maddələr ilə):"""

    response = ollama_client.chat(
        model=settings.ollama_model,
        messages=[{'role': 'user', 'content': prompt}]
    )
    sources = list(set([m["source"] for m in matches]))
    return {
        "answer": response['message']['content'],
        "sources": sources
    }