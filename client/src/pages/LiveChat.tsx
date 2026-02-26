import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Send, MessageSquare, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface ChatMessage {
  id: number;
  userId: number;
  username: string;
  message: string;
  mentions?: string[];
  createdAt: Date;
}

export default function LiveChat() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Queries and mutations
  const { data: chatHistory, refetch: refetchChat } = trpc.live.chat.getHistory.useQuery(
    { limit: 50 },
    { enabled: true }
  );
  const sendMessageMutation = trpc.live.chat.sendMessage.useMutation();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Load chat history
  useEffect(() => {
    if (chatHistory?.messages) {
      setMessages(chatHistory.messages);
    }
  }, [chatHistory]);

  // Auto-refresh chat every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchChat();
    }, 3000);
    return () => clearInterval(interval);
  }, [refetchChat]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    setIsLoading(true);
    try {
      const result = await sendMessageMutation.mutateAsync({
        message: messageInput,
      });

      if (result.success) {
        setMessageInput("");
        refetchChat();
        toast.success("Message sent!");
      } else {
        toast.error(result.error || "Failed to send message");
      }
    } catch (error) {
      toast.error("Error sending message");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-cyan-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">Live Chat</h1>
              <p className="text-gray-400">Connect with other players</p>
            </div>
          </div>
          <Button
            onClick={() => setLocation("/dashboard")}
            variant="outline"
            className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Chat Container */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/30 h-[500px] flex flex-col">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/50 hover:border-cyan-500/30 transition"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="text-cyan-400 font-semibold text-sm">{msg.username}</p>
                        <p className="text-gray-200 text-sm mt-1">{msg.message}</p>
                        <p className="text-gray-500 text-xs mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-slate-600/50 p-4 bg-slate-900/30">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="bg-slate-700 border-slate-600 text-white placeholder-gray-500 focus:border-cyan-500"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !messageInput.trim()}
                className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Info Section */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20 p-4">
            <h3 className="text-cyan-400 font-bold mb-2">💬 Chat Rules</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Be respectful to all players</li>
              <li>• No spam or excessive caps</li>
              <li>• No promotion of external sites</li>
              <li>• Violations may result in mute</li>
            </ul>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/20 p-4">
            <h3 className="text-cyan-400 font-bold mb-2">👥 Active Players</h3>
            <p className="text-sm text-gray-400">
              Join the community and chat with other players in real-time. Share tips, celebrate wins, and make friends!
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
