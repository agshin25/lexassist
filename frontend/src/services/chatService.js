const MOCK_RESPONSES = [
  {
    content: "Based on Section 65B of the Indian Evidence Act, 1872, electronic records can be admitted as evidence provided they meet specific certification requirements. The Supreme Court in Anvar P.V. v. P.K. Basheer (2014) clarified that a certificate under Section 65B(4) is mandatory for admissibility of electronic evidence.",
    sources: [
      { label: "Indian Evidence Act, 1872 — §65B" },
      { label: "Anvar P.V. v. P.K. Basheer (2014) 10 SCC 473" },
    ],
  },
  {
    content: "Under the Indian Contract Act, 1872, the remedies for breach of contract include: (1) Rescission of the contract under Section 39, (2) Suit for damages under Sections 73-74, (3) Suit for specific performance under the Specific Relief Act, 1963, and (4) Suit upon quantum meruit for work already done.",
    sources: [
      { label: "Indian Contract Act, 1872 — §73-74" },
      { label: "Specific Relief Act, 1963 — §10" },
    ],
  },
  {
    content: "The doctrine of res judicata, codified under Section 11 of the Code of Civil Procedure, 1908, bars the trial of any issue which has been directly and substantially in issue in a former suit between the same parties. The Supreme Court has consistently held that this principle applies to prevent multiplicity of proceedings and ensure finality of judgments.",
    sources: [
      { label: "CPC, 1908 — §11" },
      { label: "Satyadhyan Ghosal v. Deorajin Debi AIR 1960 SC 941" },
    ],
  },
  {
    content: "Article 21 of the Constitution of India guarantees the right to life and personal liberty. The judiciary has interpreted this article expansively to include the right to livelihood, right to education, right to health, right to clean environment, and right to privacy, as established in the landmark K.S. Puttaswamy v. Union of India (2017) decision.",
    sources: [
      { label: "Constitution of India — Art. 21" },
      { label: "K.S. Puttaswamy v. Union of India (2017) 10 SCC 1" },
    ],
  },
  {
    content: "The Limitation Act, 1963 prescribes time limits for filing suits. For a suit for recovery of money under a contract, the limitation period is 3 years from the date when the right to sue accrues (Article 55). Courts have discretion to condone delay under Section 5 if sufficient cause is shown, though this power must be exercised judiciously.",
    sources: [
      { label: "Limitation Act, 1963 — Art. 55, §5" },
    ],
  },
  {
    content: "Under Section 138 of the Negotiable Instruments Act, 1881, dishonour of a cheque for insufficiency of funds constitutes a criminal offence punishable with imprisonment up to two years or fine up to twice the cheque amount, or both. The complainant must issue a notice within 30 days of receiving the dishonour memo and file the complaint within one month of the expiry of the 15-day notice period.",
    sources: [
      { label: "Negotiable Instruments Act, 1881 — §138" },
      { label: "Dashrath Rupsingh Rathod v. State of Maharashtra (2014)" },
    ],
  },
];

export const INITIAL_CONVERSATIONS = [
  {
    id: "conv-1",
    title: "Electronic Evidence Admissibility",
    createdAt: "2025-03-09T14:30:00Z",
    messages: [
      {
        id: "m1",
        role: "user",
        content: "What does Section 65B of the Indian Evidence Act say about electronic records?",
        timestamp: "2025-03-09T14:30:00Z",
      },
      {
        id: "m2",
        role: "assistant",
        content: "Based on Section 65B of the Indian Evidence Act, 1872, electronic records can be admitted as evidence provided they meet specific certification requirements. The Supreme Court in Anvar P.V. v. P.K. Basheer (2014) clarified that a certificate under Section 65B(4) is mandatory for admissibility of electronic evidence.",
        timestamp: "2025-03-09T14:30:05Z",
        sources: [
          { label: "Indian Evidence Act, 1872 — §65B" },
          { label: "Anvar P.V. v. P.K. Basheer (2014) 10 SCC 473" },
        ],
      },
    ],
  },
  {
    id: "conv-2",
    title: "Contract Breach Remedies",
    createdAt: "2025-03-08T10:00:00Z",
    messages: [
      {
        id: "m3",
        role: "user",
        content: "What are the available remedies for breach of contract under Indian law?",
        timestamp: "2025-03-08T10:00:00Z",
      },
      {
        id: "m4",
        role: "assistant",
        content: "Under the Indian Contract Act, 1872, the remedies for breach of contract include: (1) Rescission of the contract, (2) Suit for damages under Sections 73-74, (3) Suit for specific performance, and (4) Suit upon quantum meruit.",
        timestamp: "2025-03-08T10:00:04Z",
        sources: [{ label: "Indian Contract Act, 1872 — §73-74" }],
      },
    ],
  },
  {
    id: "conv-3",
    title: "Right to Privacy Analysis",
    createdAt: "2025-03-07T09:15:00Z",
    messages: [
      {
        id: "m5",
        role: "user",
        content: "Is the right to privacy a fundamental right in India?",
        timestamp: "2025-03-07T09:15:00Z",
      },
      {
        id: "m6",
        role: "assistant",
        content: "Yes, the Supreme Court in K.S. Puttaswamy v. Union of India (2017) unanimously held that the right to privacy is a fundamental right protected under Article 21 of the Constitution.",
        timestamp: "2025-03-07T09:15:06Z",
        sources: [
          { label: "Constitution of India — Art. 21" },
          { label: "K.S. Puttaswamy v. Union of India (2017)" },
        ],
      },
    ],
  },
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const chatService = {
  async sendMessage() {
    await delay(800 + Math.random() * 1200);
    const response = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
    return {
      id: `msg-${Date.now()}`,
      role: "assistant",
      content: response.content,
      sources: response.sources,
      timestamp: new Date().toISOString(),
    };
  },
};
