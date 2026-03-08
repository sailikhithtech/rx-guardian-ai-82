import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

const GUEST_KEY = "rxbot_guest_chats";

interface GuestData {
  sessions: ChatSession[];
  messages: ChatMessage[];
}

function loadGuestData(): GuestData {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { sessions: [], messages: [] };
}

function saveGuestData(data: GuestData) {
  localStorage.setItem(GUEST_KEY, JSON.stringify(data));
}

export function useChatHistory() {
  const { user, isGuest } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Load sessions
  const fetchSessions = useCallback(async () => {
    if (isGuest) {
      const data = loadGuestData();
      setSessions(data.sessions.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));
      setLoading(false);
      return;
    }
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .order("updated_at", { ascending: false });

    if (!error && data) setSessions(data as ChatSession[]);
    setLoading(false);
  }, [user, isGuest]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // Load messages for active session
  const fetchMessages = useCallback(async (sessionId: string) => {
    if (isGuest) {
      const data = loadGuestData();
      setMessages(data.messages.filter(m => m.session_id === sessionId).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
      return;
    }
    if (!user) return;

    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (!error && data) setMessages(data as ChatMessage[]);
  }, [user, isGuest]);

  useEffect(() => {
    if (activeSessionId) fetchMessages(activeSessionId);
    else setMessages([]);
  }, [activeSessionId, fetchMessages]);

  // Create new session
  const createSession = useCallback(async (firstMessage: string): Promise<string | null> => {
    const title = firstMessage.slice(0, 50) || "New Chat";

    if (isGuest) {
      const id = crypto.randomUUID();
      const session: ChatSession = { id, title, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      const data = loadGuestData();
      data.sessions.unshift(session);
      saveGuestData(data);
      setSessions(prev => [session, ...prev]);
      setActiveSessionId(id);
      return id;
    }

    if (!user) return null;
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ user_id: user.id, title })
      .select()
      .single();

    if (error || !data) { toast.error("Failed to create chat session"); return null; }
    const session = data as ChatSession;
    setSessions(prev => [session, ...prev]);
    setActiveSessionId(session.id);
    return session.id;
  }, [user, isGuest]);

  // Save a message
  const saveMessage = useCallback(async (sessionId: string, role: "user" | "assistant", content: string) => {
    if (isGuest) {
      const msg: ChatMessage = { id: crypto.randomUUID(), session_id: sessionId, role, content, created_at: new Date().toISOString() };
      const data = loadGuestData();
      data.messages.push(msg);
      // Update session timestamp
      const s = data.sessions.find(s => s.id === sessionId);
      if (s) s.updated_at = new Date().toISOString();
      saveGuestData(data);
      setMessages(prev => [...prev, msg]);
      return;
    }

    if (!user) return;
    const { data: msgData } = await supabase
      .from("chat_messages")
      .insert({ session_id: sessionId, role, content })
      .select()
      .single();

    if (msgData) setMessages(prev => [...prev, msgData as ChatMessage]);

    // Update session timestamp and title if first message
    await supabase
      .from("chat_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", sessionId);

    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, updated_at: new Date().toISOString() } : s).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));
  }, [user, isGuest]);

  // Delete session
  const deleteSession = useCallback(async (sessionId: string) => {
    if (isGuest) {
      const data = loadGuestData();
      data.sessions = data.sessions.filter(s => s.id !== sessionId);
      data.messages = data.messages.filter(m => m.session_id !== sessionId);
      saveGuestData(data);
    } else if (user) {
      await supabase.from("chat_sessions").delete().eq("id", sessionId);
    }
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      setMessages([]);
    }
  }, [user, isGuest, activeSessionId]);

  // Rename session
  const renameSession = useCallback(async (sessionId: string, newTitle: string) => {
    if (isGuest) {
      const data = loadGuestData();
      const s = data.sessions.find(s => s.id === sessionId);
      if (s) s.title = newTitle;
      saveGuestData(data);
    } else if (user) {
      await supabase.from("chat_sessions").update({ title: newTitle }).eq("id", sessionId);
    }
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: newTitle } : s));
  }, [user, isGuest]);

  // Clear all history
  const clearAllHistory = useCallback(async () => {
    if (isGuest) {
      saveGuestData({ sessions: [], messages: [] });
    } else if (user) {
      await supabase.from("chat_sessions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    }
    setSessions([]);
    setActiveSessionId(null);
    setMessages([]);
  }, [user, isGuest]);

  // New chat
  const startNewChat = useCallback(() => {
    setActiveSessionId(null);
    setMessages([]);
  }, []);

  // Filtered sessions
  const filteredSessions = searchQuery.trim()
    ? sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : sessions;

  return {
    sessions: filteredSessions,
    activeSessionId,
    setActiveSessionId,
    messages,
    setMessages,
    loading,
    searchQuery,
    setSearchQuery,
    createSession,
    saveMessage,
    deleteSession,
    renameSession,
    clearAllHistory,
    startNewChat,
    fetchMessages,
  };
}
