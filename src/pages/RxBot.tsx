import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Bot, Send, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function RxBot() {
  const { t, i18n } = useTranslation();

  const quickQuestions = [
    t("rxbot.q1"), t("rxbot.q2"), t("rxbot.q3"), t("rxbot.q4"),
    t("rxbot.q5"), t("rxbot.q6"), t("rxbot.q7"), t("rxbot.q8"),
  ];

  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: t("rxbot.welcomeMessage") },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  useEffect(() => {
    setMessages([{ role: "assistant", content: t("rxbot.welcomeMessage") }]);
  }, [i18n.language]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;
    const userMsg: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);

    let assistantContent = "";

    try {
      const apiMessages = updatedMessages
        .filter((_, i) => i > 0 || updatedMessages[0].role === "user")
        .map((m) => ({ role: m.role, content: m.content }));

      const currentLang = i18n.language;
      apiMessages.unshift({
        role: "user" as const,
        content: `[System: The user's app language is set to "${currentLang}". Please respond in the same language the user writes in. If unclear, use the app language.]`,
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rxbot-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: apiMessages }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Failed to connect" }));
        throw new Error(err.error || `Error ${response.status}`);
      }

      if (!response.body) throw new Error("No response stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              const captured = assistantContent;
              setMessages((prev) => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: captured } : m));
            }
          } catch { buffer = line + "\n" + buffer; break; }
        }
      }

      if (buffer.trim()) {
        for (let raw of buffer.split("\n")) {
          if (!raw || raw.startsWith(":") || raw.trim() === "") continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              const captured = assistantContent;
              setMessages((prev) => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: captured } : m));
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e: any) {
      console.error("RxBot error:", e);
      toast.error(e.message || "Failed to get response");
      if (!assistantContent) setMessages((prev) => prev.filter((_, i) => i !== prev.length - 1));
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 md:px-6 py-4 shrink-0">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold">{t("rxbot.title")}</h1>
            <p className="text-xs text-muted-foreground">{t("rxbot.subtitle")}</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 rtl:ml-0 rtl:mr-auto">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-muted-foreground">{t("common.online")}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md shadow-md shadow-primary/20"
                  : "bg-card border border-border rounded-bl-md shadow-card"
              }`}>
                {msg.content}
                {msg.role === "assistant" && isStreaming && i === messages.length - 1 && (
                  <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-middle" />
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </motion.div>
          ))}
          {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5 shadow-card">
                <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce [animation-delay:300ms]" />
              </div>
            </motion.div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card px-4 md:px-6 py-4 shrink-0">
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {quickQuestions.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={isStreaming}
                className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-full border border-border bg-background text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all duration-200 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("rxbot.placeholder")}
              disabled={isStreaming}
              className="flex-1 bg-background border-2 border-border rounded-full px-5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus:border-primary transition-all duration-200 disabled:opacity-50"
            />
            <Button type="submit" size="icon" className="rounded-full shrink-0 w-11 h-11" disabled={!input.trim() || isStreaming}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
