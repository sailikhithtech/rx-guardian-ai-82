import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, User, History, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useChatHistory } from "@/hooks/useChatHistory";
import ChatHistorySidebar from "@/components/rxbot/ChatHistorySidebar";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

export default function RxBot() {
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([
    { role: "assistant", content: t("rxbot.welcomeMessage"), created_at: new Date().toISOString() },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  const chat = useChatHistory();

  const quickQuestions = [
    t("rxbot.q1"), t("rxbot.q2"), t("rxbot.q3"), t("rxbot.q4"),
    t("rxbot.q5"), t("rxbot.q6"), t("rxbot.q7"), t("rxbot.q8"),
  ];

  // Scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages, isStreaming]);

  // When language changes, reset welcome
  useEffect(() => {
    if (!chat.activeSessionId) {
      setLocalMessages([{ role: "assistant", content: t("rxbot.welcomeMessage"), created_at: new Date().toISOString() }]);
    }
  }, [i18n.language]);

  // Load messages when session changes
  useEffect(() => {
    if (chat.activeSessionId && chat.messages.length > 0) {
      setLocalMessages(chat.messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content, created_at: m.created_at })));
    } else if (!chat.activeSessionId) {
      setLocalMessages([{ role: "assistant", content: t("rxbot.welcomeMessage"), created_at: new Date().toISOString() }]);
    }
  }, [chat.activeSessionId, chat.messages]);

  // Auto-load most recent session on mount
  useEffect(() => {
    if (!chat.loading && chat.sessions.length > 0 && !chat.activeSessionId) {
      chat.setActiveSessionId(chat.sessions[0].id);
    }
  }, [chat.loading, chat.sessions.length]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;
    const userMsg: Message = { role: "user", content: text, created_at: new Date().toISOString() };
    const updatedMessages = [...localMessages, userMsg];
    setLocalMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);

    let sessionId = chat.activeSessionId;

    // Create session if needed
    if (!sessionId) {
      sessionId = await chat.createSession(text);
    }

    // Save user message
    if (sessionId) await chat.saveMessage(sessionId, "user", text);

    let assistantContent = "";

    try {
      const apiMessages = updatedMessages
        .filter((_, i) => i > 0 || updatedMessages[0].role === "user")
        .map(m => ({ role: m.role, content: m.content }));

      apiMessages.unshift({
        role: "user" as const,
        content: `[System: The user's app language is set to "${i18n.language}". Please respond in the same language the user writes in. If unclear, use the app language.]`,
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

      setLocalMessages(prev => [...prev, { role: "assistant", content: "", created_at: new Date().toISOString() }]);

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
              setLocalMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: captured } : m));
            }
          } catch { buffer = line + "\n" + buffer; break; }
        }
      }

      // Process remaining buffer
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
              setLocalMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: captured } : m));
            }
          } catch { /* ignore */ }
        }
      }

      // Save assistant response
      if (sessionId && assistantContent) {
        await chat.saveMessage(sessionId, "assistant", assistantContent);
      }
    } catch (e: any) {
      console.error("RxBot error:", e);
      toast.error(e.message || "Failed to get response");
      if (!assistantContent) setLocalMessages(prev => prev.filter((_, i) => i !== prev.length - 1));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleNewChat = () => {
    chat.startNewChat();
    setLocalMessages([{ role: "assistant", content: t("rxbot.welcomeMessage"), created_at: new Date().toISOString() }]);
  };

  // Format date separator
  const getDateLabel = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (d >= today) return "Today";
    const yesterday = new Date(today.getTime() - 86400000);
    if (d >= yesterday) return "Yesterday";
    return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  };

  const shouldShowDateSep = (msgs: Message[], i: number) => {
    if (i === 0) return true;
    const prev = msgs[i - 1].created_at;
    const curr = msgs[i].created_at;
    if (!prev || !curr) return false;
    return getDateLabel(prev) !== getDateLabel(curr);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] lg:h-screen">
      {/* Desktop sidebar */}
      {!isMobile && (
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 overflow-hidden"
            >
              <ChatHistorySidebar
                sessions={chat.sessions}
                activeSessionId={chat.activeSessionId}
                searchQuery={chat.searchQuery}
                onSearchChange={chat.setSearchQuery}
                onSelectSession={chat.setActiveSessionId}
                onNewChat={handleNewChat}
                onRename={chat.renameSession}
                onDelete={chat.deleteSession}
                onClearAll={chat.clearAllHistory}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Mobile sidebar overlay */}
      {isMobile && (
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/50"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed left-0 top-0 bottom-0 z-50 w-[280px]"
              >
                <ChatHistorySidebar
                  sessions={chat.sessions}
                  activeSessionId={chat.activeSessionId}
                  searchQuery={chat.searchQuery}
                  onSearchChange={chat.setSearchQuery}
                  onSelectSession={chat.setActiveSessionId}
                  onNewChat={handleNewChat}
                  onRename={chat.renameSession}
                  onDelete={chat.deleteSession}
                  onClearAll={chat.clearAllHistory}
                  onClose={() => setSidebarOpen(false)}
                  isMobile
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="border-b border-border bg-card px-4 md:px-6 py-3 shrink-0">
          <div className="flex items-center gap-3 max-w-3xl mx-auto">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {isMobile ? <History className="w-4 h-4" /> : <PanelLeftClose className={`w-4 h-4 transition-transform ${sidebarOpen ? "" : "rotate-180"}`} />}
            </Button>
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold text-sm">{t("rxbot.title")}</h1>
              <p className="text-[11px] text-muted-foreground truncate">{t("rxbot.subtitle")}</p>
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
            {localMessages.map((msg, i) => (
              <div key={i}>
                {shouldShowDateSep(localMessages, i) && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] font-medium text-muted-foreground">{getDateLabel(msg.created_at)}</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}
                <motion.div
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
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md shadow-md shadow-primary/20"
                      : "bg-card border border-border rounded-bl-md shadow-card"
                  }`}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <span className="whitespace-pre-wrap">{msg.content}</span>
                    )}
                    {msg.role === "assistant" && isStreaming && i === localMessages.length - 1 && (
                      <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-middle" />
                    )}
                    {msg.created_at && !isStreaming && (
                      <p className={`text-[10px] mt-1.5 ${msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </motion.div>
              </div>
            ))}
            {isStreaming && localMessages[localMessages.length - 1]?.role !== "assistant" && (
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
              {quickQuestions.map(q => (
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
            <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
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
    </div>
  );
}
