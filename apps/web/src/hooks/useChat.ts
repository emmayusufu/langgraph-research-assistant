"use client";

import { useState, useCallback } from "react";
import type { ChatMessage, ResearchResult } from "@/lib/types";
import { streamResearch, type StreamEvent } from "@/lib/api";

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  sources: ResearchResult[];
  activeAgent: string;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sources, setSources] = useState<ResearchResult[]>([]);
  const [activeAgent, setActiveAgent] = useState("");

  const sendMessage = useCallback(async (content: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setActiveAgent("");

    let finalOutput = "";
    let finalSources: ResearchResult[] = [];

    try {
      await streamResearch(content, "chat", (event: StreamEvent) => {
        if (event.type === "done") return;

        if (event.agent) {
          setActiveAgent(event.agent);
        }

        if (event.data?.output) {
          finalOutput = event.data.output;
        }

        if (event.data?.research_results) {
          finalSources = [
            ...finalSources,
            ...event.data.research_results.map((r) => ({
              source_url: r.source_url,
              title: r.title,
              content_summary: r.content_summary,
              relevance_score: 1.0,
            })),
          ];
        }
      });

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: finalOutput || "No results found.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setSources(finalSources);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Something went wrong"}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setActiveAgent("");
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setSources([]);
  }, []);

  return {
    messages,
    isLoading,
    sources,
    activeAgent,
    sendMessage,
    clearMessages,
  };
}
