import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Send, AlertCircle, Lock } from "lucide-react";
import "./ChatBox.css";

interface ChatMessage {
  userId: number;
  username: string;
  message: string;
  timestamp: Date;
  canChat: boolean;
}

interface ChatBoxProps {
  userId: number;
  username: string;
  canChat: boolean;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ userId, username, canChat }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Socket.IO connection
  useEffect(() => {
    const socket = io(window.location.origin, {
      auth: {
        userId,
        username,
      },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Chat] Connected to server");
      setIsConnected(true);
      setError(null);
    });

    socket.on("chat:message", (message: ChatMessage) => {
      setMessages((prev) => [...prev, { ...message, timestamp: new Date(message.timestamp) }]);
    });

    socket.on("chat:error", (data: { message: string; code: string }) => {
      setError(data.message);
      setTimeout(() => setError(null), 5000);
    });

    socket.on("user:joined", (data: any) => {
      console.log(`[Chat] ${data.username} joined`);
    });

    socket.on("user:left", (data: any) => {
      console.log(`[Chat] ${data.username} left`);
    });

    socket.on("disconnect", () => {
      console.log("[Chat] Disconnected from server");
      setIsConnected(false);
    });

    socket.on("connect_error", (error: any) => {
      console.error("[Chat] Connection error:", error);
      setError("Connection error. Please refresh.");
    });

    return () => {
      socket.disconnect();
    };
  }, [userId, username]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    if (!canChat) {
      setError("You must deposit $10 and wager 10x to chat");
      return;
    }

    if (!isConnected) {
      setError("Not connected to chat server");
      return;
    }

    socketRef.current?.emit("chat:message", inputValue);
    setInputValue("");
  };

  return (
    <div className="chatbox-container">
      {/* Header */}
      <div className="chatbox-header">
        <div className="chatbox-header-content">
          <h3 className="chatbox-title">Live Chat</h3>
          <div className="chatbox-status">
            <div className={`status-indicator ${isConnected ? "connected" : "disconnected"}`}></div>
            <span className="status-text">{isConnected ? "Online" : "Offline"}</span>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="chatbox-messages">
        {messages.length === 0 ? (
          <div className="chatbox-empty">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className="chatbox-message">
              <div className="message-header">
                <span className="message-username">{msg.username}</span>
                <span className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="message-content">{msg.message}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="chatbox-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Chat Restriction Notice */}
      {!canChat && (
        <div className="chatbox-restriction">
          <Lock size={16} />
          <span>Chat restricted: Deposit $10 + Wager 10x to unlock</span>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="chatbox-form">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={canChat ? "Type a message..." : "Chat locked - deposit $10 + wager 10x"}
          disabled={!canChat || !isConnected}
          className="chatbox-input"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={!canChat || !isConnected || !inputValue.trim()}
          className="chatbox-send-btn"
          title={canChat ? "Send message" : "Chat restricted"}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
