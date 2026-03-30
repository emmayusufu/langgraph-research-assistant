export interface ResearchResult {
  source_url: string;
  title: string;
  content_summary: string;
  relevance_score: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export type OutputMode = "chat" | "report";
