import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, MoreVertical, Pencil, Trash2, FileText, MessageSquare, Trash, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ChatSession } from "@/hooks/useChatHistory";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface Props {
  sessions: ChatSession[];
  activeSessionId: string | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onClose?: () => void;
  isMobile?: boolean;
}

function groupByDate(sessions: ChatSession[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; items: ChatSession[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "This Week", items: [] },
    { label: "Earlier", items: [] },
  ];

  sessions.forEach(s => {
    const d = new Date(s.updated_at);
    if (d >= today) groups[0].items.push(s);
    else if (d >= yesterday) groups[1].items.push(s);
    else if (d >= weekAgo) groups[2].items.push(s);
    else groups[3].items.push(s);
  });

  return groups.filter(g => g.items.length > 0);
}

export default function ChatHistorySidebar({ sessions, activeSessionId, searchQuery, onSearchChange, onSelectSession, onNewChat, onRename, onDelete, onClearAll, onClose, isMobile }: Props) {
  const { t } = useTranslation();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const groups = groupByDate(sessions);

  const handleRenameSubmit = (id: string) => {
    if (renameValue.trim()) onRename(id, renameValue.trim());
    setRenamingId(null);
  };

  const handleExport = (session: ChatSession) => {
    toast.success("Export feature coming soon!");
  };

  return (
    <div className="flex flex-col h-full bg-muted/30 border-r border-border">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center gap-2 shrink-0">
        <h2 className="text-sm font-semibold flex-1">Chat History</h2>
        {isMobile && onClose && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onNewChat}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="pl-8 h-8 text-xs bg-background"
          />
        </div>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">No conversations yet</p>
            <p className="text-xs text-muted-foreground mt-1">Start chatting with RxBot!</p>
            <Button size="sm" className="mt-4" onClick={onNewChat}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Start New Chat
            </Button>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.label} className="mb-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">{group.label}</p>
              {group.items.map(session => (
                <div
                  key={session.id}
                  onClick={() => { onSelectSession(session.id); if (isMobile && onClose) onClose(); }}
                  className={`group relative flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer text-sm transition-colors mb-0.5 ${
                    activeSessionId === session.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                  {renamingId === session.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onBlur={() => handleRenameSubmit(session.id)}
                      onKeyDown={e => { if (e.key === "Enter") handleRenameSubmit(session.id); if (e.key === "Escape") setRenamingId(null); }}
                      className="flex-1 bg-background border border-border rounded px-1.5 py-0.5 text-xs outline-none focus:border-primary"
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <span className="flex-1 truncate text-xs">{session.title}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0 hidden group-hover:hidden">
                        {new Date(session.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </>
                  )}
                  {renamingId !== session.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted-foreground/10">
                          <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onClick={e => { e.stopPropagation(); setRenamingId(session.id); setRenameValue(session.title); }}>
                          <Pencil className="w-3.5 h-3.5 mr-2" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={e => { e.stopPropagation(); handleExport(session); }}>
                          <FileText className="w-3.5 h-3.5 mr-2" /> Export
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={e => { e.stopPropagation(); onDelete(session.id); }}>
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Clear all */}
      {sessions.length > 0 && (
        <div className="p-3 border-t border-border shrink-0">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full text-xs text-destructive hover:text-destructive">
                <Trash className="w-3.5 h-3.5 mr-1.5" /> Clear All History
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all chat history?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete all your conversations. This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete All</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
