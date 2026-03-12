const API_BASE_URL = "http://localhost:8000";

export const trainingService = {
  async getDocuments() {
    const res = await fetch(`${API_BASE_URL}/api/documents`);
    if (!res.ok) throw new Error("Failed to fetch documents");
    const data = await res.json();
    return data.documents;
  },

  async uploadDocument(file) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to upload document");
    return res.json();
  },

  async deleteDocument(filename) {
    const res = await fetch(`${API_BASE_URL}/api/documents/${encodeURIComponent(filename)}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete document");
    return res.json();
  },
};
