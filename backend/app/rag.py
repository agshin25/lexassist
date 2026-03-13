from sentence_transformers import SentenceTransformer
import chromadb
import fitz
from app.config import settings
from app.prompts import legal_prompt, NO_DATA_RESPONSE, CHAT_SYSTEM_PROMPT, LEGAL_SYSTEM_PROMPT
import os
import json
from openai import OpenAI

embedding_model = SentenceTransformer('intfloat/multilingual-e5-large', device='cpu')
chroma_client = chromadb.PersistentClient(path=settings.chroma_path)
openai_client = OpenAI(api_key=settings.openai_api_key)


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


def search(query: str, n_results: int = 5) -> dict:
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


def chat_completion(messages: list[dict], temperature: float = 0.3, response_format=None) -> str:
    kwargs = {
        "model": settings.openai_model,
        "messages": messages,
        "temperature": temperature,
    }
    if response_format:
        kwargs["response_format"] = response_format
    response = openai_client.chat.completions.create(**kwargs)
    return response.choices[0].message.content


def classify_intent(question: str) -> bool:
    content = chat_completion(
        messages=[{
            'role': 'user',
            'content': f'Is this message a legal question? Reply ONLY with JSON: {{"is_legal": true}} or {{"is_legal": false}}\n\nMessage: "{question}"'
        }],
        temperature=0,
        response_format={"type": "json_object"},
    )
    try:
        result = json.loads(content)
        return result.get("is_legal", False)
    except (json.JSONDecodeError, KeyError):
        return False


def ask(question: str, history: list[dict] | None = None) -> dict:
    is_legal = classify_intent(question)

    if not is_legal:
        messages = [{'role': 'system', 'content': CHAT_SYSTEM_PROMPT}]
        if history:
            for msg in history[-6:]:
                messages.append({'role': msg['role'], 'content': msg['content']})
        messages.append({'role': 'user', 'content': question})
        answer = chat_completion(messages)
        return {"answer": answer, "sources": []}

    result = search(question)
    matches = result["matches"]

    if not matches:
        return {"answer": NO_DATA_RESPONSE, "sources": []}

    context = "\n\n".join([m["text"] for m in matches])
    messages = [{'role': 'system', 'content': LEGAL_SYSTEM_PROMPT}]
    if history:
        for msg in history[-6:]:
            messages.append({'role': msg['role'], 'content': msg['content']})
    messages.append({'role': 'user', 'content': legal_prompt(question, context)})
    answer = chat_completion(messages)
    sources = list(set([m["source"] for m in matches]))
    return {
        "answer": answer,
        "sources": sources
    }
