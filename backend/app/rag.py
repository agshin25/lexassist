from sentence_transformers import SentenceTransformer
import chromadb
import fitz
from app.config import settings
from app.prompts import legal_prompt, NO_DATA_RESPONSE, CHAT_SYSTEM_PROMPT, LEGAL_SYSTEM_PROMPT
import os
from ollama import Client

RELEVANCE_THRESHOLD = 0.44

embedding_model = SentenceTransformer('intfloat/multilingual-e5-large',device='cpu')
chroma_client = chromadb.PersistentClient(path=settings.chroma_path)
ollama_client = Client(host=settings.ollama_url)

OLLAMA_OPTIONS = {
    "temperature": 0.3,
    "top_p": 0.9,
    "num_ctx": 4096,
}


def get_or_create_collection():
    return chroma_client.get_or_create_collection("legal_docs")


def extract_text_from_pdf(pdf_path: str) -> str:
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text


def chunk_text(text: str) -> list[str]:
    article_chunks = []
    current_chunk = ""
    for line in text.split("\n"):
        if line.strip().startswith("Maddə") and current_chunk:
            article_chunks.append(current_chunk.strip())
            current_chunk = line + "\n"
        else:
            current_chunk += line + "\n"
    if current_chunk.strip():
        article_chunks.append(current_chunk.strip())

    article_chunks = [c for c in article_chunks if len(c) > 50]
    if len(article_chunks) > 1:
        final_chunks = []
        for chunk in article_chunks:
            if len(chunk) > 2000:
                words = chunk.split()
                sub_chunk = []
                sub_len = 0
                for word in words:
                    sub_chunk.append(word)
                    sub_len += len(word) + 1
                    if sub_len > 1000:
                        final_chunks.append(" ".join(sub_chunk))
                        overlap = sub_chunk[-(len(sub_chunk) // 5):]
                        sub_chunk = overlap
                        sub_len = sum(len(w) + 1 for w in sub_chunk)
                if sub_chunk:
                    final_chunks.append(" ".join(sub_chunk))
            else:
                final_chunks.append(chunk)
        return final_chunks

    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip() and len(p.strip()) > 30]
    if paragraphs:
        chunks = []
        for i in range(0, len(paragraphs), 2):
            chunk = "\n\n".join(paragraphs[i:i + 3])  
            if len(chunk) > 50:
                chunks.append(chunk)
        return chunks if chunks else [text[:2000]]

    chunks = []
    for i in range(0, len(text), 800):
        chunk = text[i:i + 1000]
        if len(chunk) > 50:
            chunks.append(chunk)
    return chunks


def delete_document(filename: str):
    """Delete all chunks for a document from ChromaDB."""
    collection = get_or_create_collection()
    all_data = collection.get()
    ids_to_delete = [
        id for id, meta in zip(all_data['ids'], all_data['metadatas'])
        if meta.get('source') == filename
    ]
    if ids_to_delete:
        collection.delete(ids=ids_to_delete)
    return len(ids_to_delete)


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


def search(query: str, n_results: int = 3) -> dict:
    collection = get_or_create_collection()

    if collection.count() == 0:
        return {"matches": [], "distances": []}

    query_embedding = embedding_model.encode([query])
    results = collection.query(
        query_embeddings=query_embedding.tolist(),
        n_results=n_results,
        include=["documents", "metadatas", "distances"]
    )

    matches = []
    distances = results['distances'][0] if results['distances'] else []

    for i in range(len(results['documents'][0])):
        matches.append({
            "text": results['documents'][0][i],
            "source": results['metadatas'][0][i]['source'],
        })

    return {"matches": matches, "distances": distances}


def ask(question: str, history: list[dict] | None = None) -> dict:
    result = search(question)
    matches = result["matches"]
    distances = result["distances"]

    if not matches:
        return {"answer": NO_DATA_RESPONSE, "sources": []}

    best_distance = min(distances) if distances else 999

    if best_distance > RELEVANCE_THRESHOLD:
        messages = [{'role': 'system', 'content': CHAT_SYSTEM_PROMPT}]
        if history:
            for msg in history[-6:]:
                messages.append({'role': msg['role'], 'content': msg['content']})
        messages.append({'role': 'user', 'content': question})
        response = ollama_client.chat(
            model=settings.ollama_model,
            messages=messages,
            options=OLLAMA_OPTIONS,
        )
        return {"answer": response['message']['content'], "sources": []}

    context = "\n\n".join([m["text"] for m in matches])
    messages = [{'role': 'system', 'content': LEGAL_SYSTEM_PROMPT}]
    if history:
        for msg in history[-6:]:
            messages.append({'role': msg['role'], 'content': msg['content']})
    messages.append({'role': 'user', 'content': legal_prompt(question, context)})
    response = ollama_client.chat(
        model=settings.ollama_model,
        messages=messages,
        options=OLLAMA_OPTIONS,
    )
    sources = list(set([m["source"] for m in matches]))
    return {
        "answer": response['message']['content'],
        "sources": sources
    }
