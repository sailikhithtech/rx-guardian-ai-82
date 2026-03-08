import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Bot, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "bot";
  content: string;
}

const quickQuestions = [
  "Can I take Metformin with food?",
  "Side effects of Amoxicillin?",
  "Is Omeprazole safe long-term?",
  "Drug interactions with aspirin?",
];

const botResponses: Record<string, string> = {
  "Can I take Metformin with food?": "Yes! Metformin is best taken **with meals** to reduce stomach upset. Taking it with food also helps with absorption. Most doctors recommend taking it with your largest meal of the day.",
  "Side effects of Amoxicillin?": "Common side effects of Amoxicillin include:\n\n• **Diarrhea** (most common)\n• Nausea or vomiting\n• Skin rash\n• Headache\n\n⚠️ **Seek immediate help** if you experience difficulty breathing, severe rash, or swelling — these could indicate an allergic reaction.",
  "Is Omeprazole safe long-term?": "Omeprazole is generally safe for short-term use (2-8 weeks). However, **long-term use** may be associated with:\n\n• Vitamin B12 deficiency\n• Magnesium deficiency\n• Increased risk of bone fractures\n\nAlways discuss with your doctor if you've been taking it for more than 8 weeks.",
  "Drug interactions with aspirin?": "Aspirin can interact with several medications:\n\n🔴 **Avoid with:** Blood thinners (Warfarin), Methotrexate\n🟡 **Caution with:** NSAIDs (Ibuprofen), SSRIs\n🟢 **Generally safe with:** Acetaminophen, most antibiotics\n\nAlways inform your doctor about all medications you're taking.",
};

const defaultResponse = "I'm RxBot, your AI medication assistant! I can help answer questions about medications, side effects, interactions, and general health guidance.\n\n⚠️ **Note:** I provide general information only. Always consult your healthcare provider for medical advice.";

export default function RxBot() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", content: "Hello! 👋 I'm **RxBot**, your AI medication assistant. Ask me anything about your medicines, side effects, or drug interactions.\n\nTry one of the suggested questions below to get started!" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const response = botResponses[text] || defaultResponse;
      setMessages((prev) => [...prev, { role: "bot", content: response }]);
      setTyping(false);
    }, 1200);
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
            <h1 className="font-semibold">RxBot</h1>
            <p className="text-xs text-muted-foreground">AI Medication Assistant</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
            <span className="text-xs text-muted-foreground">Online</span>
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
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "bot" && (
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-card border border-border rounded-bl-md"
              }`}>
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </motion.div>
          ))}
          {typing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
              </div>
            </motion.div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Quick Questions + Input */}
      <div className="border-t border-border bg-card px-4 md:px-6 py-4 shrink-0">
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {quickQuestions.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-full border border-border bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about medications..."
              className="flex-1 bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
            />
            <Button type="submit" size="icon" className="rounded-xl shrink-0" disabled={!input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
