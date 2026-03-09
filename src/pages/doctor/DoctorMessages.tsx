import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, ArrowLeft, Zap } from 'lucide-react';
import { format } from 'date-fns';

const QUICK_REPLIES = [
  "Your reports look normal",
  "Please come for a follow-up",
  "Take medicines regularly",
  "Continue the same medication",
  "Let me know if symptoms persist",
];

export default function DoctorMessages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: profile } = useQuery({
    queryKey: ['doctor-profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('doctor_profiles').select('*').eq('user_id', user?.id).single();
      return data;
    },
    enabled: !!user,
  });

  // Get conversations (unique patient IDs from messages)
  const { data: conversations = [] } = useQuery({
    queryKey: ['doctor-conversations', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
        .order('created_at', { ascending: false });

      const msgs = data || [];
      const contactMap = new Map<string, { id: string; lastMessage: string; lastTime: string; unread: number }>();

      msgs.forEach((m: any) => {
        const contactId = m.sender_id === user!.id ? m.receiver_id : m.sender_id;
        if (!contactMap.has(contactId)) {
          contactMap.set(contactId, {
            id: contactId,
            lastMessage: m.content,
            lastTime: m.created_at,
            unread: 0,
          });
        }
        if (m.receiver_id === user!.id && !m.is_read) {
          const c = contactMap.get(contactId)!;
          c.unread++;
        }
      });

      return Array.from(contactMap.values());
    },
    enabled: !!user,
  });

  // Get messages for selected chat
  const { data: chatMessages = [] } = useQuery({
    queryKey: ['doctor-chat-messages', selectedChat],
    queryFn: async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user!.id},receiver_id.eq.${selectedChat}),and(sender_id.eq.${selectedChat},receiver_id.eq.${user!.id})`)
        .order('created_at', { ascending: true });
      return data || [];
    },
    enabled: !!selectedChat && !!user,
  });

  // Mark messages as read
  useEffect(() => {
    if (selectedChat && user) {
      supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', selectedChat)
        .eq('receiver_id', user.id)
        .eq('is_read', false)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['doctor-conversations'] });
        });
    }
  }, [selectedChat, user, queryClient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('doctor-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['doctor-chat-messages'] });
        queryClient.invalidateQueries({ queryKey: ['doctor-conversations'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from('messages').insert({
        sender_id: user!.id,
        receiver_id: selectedChat!,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-chat-messages'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-conversations'] });
      setMessage('');
      setShowQuickReplies(false);
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage.mutate(message.trim());
  };

  const formatTime = (d: string) => {
    try { return format(new Date(d), 'h:mm a'); } catch { return ''; }
  };

  const formatDate = (d: string) => {
    try { return format(new Date(d), 'MMM dd'); } catch { return ''; }
  };

  // Also show patients from appointments as potential contacts
  const { data: patientContacts = [] } = useQuery({
    queryKey: ['doctor-patient-contacts', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('appointments')
        .select('user_id')
        .eq('doctor_id', profile!.id);
      return [...new Set((data || []).map((a: any) => a.user_id))];
    },
    enabled: !!profile,
  });

  // Merge conversation contacts with patient contacts
  const allContacts = (() => {
    const convIds = new Set(conversations.map(c => c.id));
    const extra = patientContacts
      .filter(id => !convIds.has(id))
      .map(id => ({ id, lastMessage: '', lastTime: '', unread: 0 }));
    return [...conversations, ...extra];
  })();

  // Mobile: show chat or list
  const showChatView = selectedChat !== null;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Messages</h1>

      <Card className="overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
        <div className="flex h-full">
          {/* Conversation list */}
          <div className={`w-full md:w-80 border-r border-border flex flex-col ${showChatView ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-3 border-b border-border">
              <p className="text-sm font-medium text-muted-foreground">
                {allContacts.length} conversation{allContacts.length !== 1 ? 's' : ''}
              </p>
            </div>
            <ScrollArea className="flex-1">
              {allContacts.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageCircle className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No conversations yet</p>
                </div>
              ) : (
                allContacts.map(contact => (
                  <button
                    key={contact.id}
                    className={`w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left ${
                      selectedChat === contact.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => setSelectedChat(contact.id)}
                  >
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">P</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">Patient {contact.id.slice(0, 8)}...</p>
                        {contact.lastTime && <span className="text-[10px] text-muted-foreground shrink-0">{formatDate(contact.lastTime)}</span>}
                      </div>
                      {contact.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{contact.lastMessage}</p>
                      )}
                    </div>
                    {contact.unread > 0 && (
                      <Badge className="bg-primary text-primary-foreground h-5 w-5 p-0 justify-center text-[10px] shrink-0">
                        {contact.unread}
                      </Badge>
                    )}
                  </button>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Chat area */}
          <div className={`flex-1 flex flex-col ${!showChatView ? 'hidden md:flex' : 'flex'}`}>
            {!selectedChat ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground/20 mb-3" />
                  <p className="text-muted-foreground">Select a conversation to start messaging</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="p-3 border-b border-border flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setSelectedChat(null)}>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">P</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">Patient {selectedChat.slice(0, 8)}...</p>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {chatMessages.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Start the conversation!</p>
                    )}
                    {chatMessages.map((msg: any) => {
                      const isMine = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                            isMine
                              ? 'bg-primary text-primary-foreground rounded-br-md'
                              : 'bg-muted text-foreground rounded-bl-md'
                          }`}>
                            <p>{msg.content}</p>
                            <p className={`text-[10px] mt-1 ${isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                              {formatTime(msg.created_at)}
                              {isMine && msg.is_read && ' ✓✓'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Quick replies */}
                {showQuickReplies && (
                  <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                    {QUICK_REPLIES.map(reply => (
                      <Button key={reply} size="sm" variant="outline" className="text-xs h-7"
                        onClick={() => { setMessage(reply); setShowQuickReplies(false); }}>
                        {reply}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div className="p-3 border-t border-border flex items-center gap-2">
                  <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0"
                    onClick={() => setShowQuickReplies(!showQuickReplies)}>
                    <Zap className="w-4 h-4" />
                  </Button>
                  <Input
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  />
                  <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSend} disabled={!message.trim() || sendMessage.isPending}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
