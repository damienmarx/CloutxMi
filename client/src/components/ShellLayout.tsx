import React, { useState } from "react";
import { Menu, X, Home, Gamepad2, Users, BarChart3, Settings, LogOut, MessageSquare, Rss } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import ChatPanel from "./ChatPanel";
import "./ShellLayout.css";

interface ShellLayoutProps {
  children: React.ReactNode;
  title?: string;
  currentPage?: string;
}

export const ShellLayout: React.FC<ShellLayoutProps> = ({ children, title, currentPage }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { label: "Dashboard", icon: <Home size={20} />, path: "/dashboard" },
    { label: "Games", icon: <Gamepad2 size={20} />, path: "/" },
    { label: "Community", icon: <Users size={20} />, path: "/live-community", badge: "Live" },
    { label: "Stats", icon: <BarChart3 size={20} />, path: "/user-stats" },
    { label: "Settings", icon: <Settings size={20} />, path: "/settings" },
  ];

  return (
    <div className="shell-layout">
      {/* Top Navigation Bar */}
      <nav className="shell-topnav">
        <div className="topnav-left">
          <button className="topnav-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="topnav-branding cursor-pointer" onClick={() => setLocation("/")}>
            <h1 className="topnav-title">Degens¤Den</h1>
            {title && <span className="topnav-subtitle">{title}</span>}
          </div>
        </div>

        <div className="topnav-right">
          {/* Chat toggle */}
          <button
            onClick={() => setChatOpen(o => !o)}
            data-testid="chat-toggle-btn"
            className="relative p-2 rounded-lg transition-all hover:bg-white/10"
            style={{ color: chatOpen ? "#FFD700" : "#9ca3af" }}
            title="Live Chat"
          >
            <MessageSquare size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-400" />
          </button>

          <div className="topnav-user">
            <div className="user-avatar">
              {user?.username?.slice(0,1).toUpperCase() || "D"}
            </div>
            <div className="user-info">
              <p className="user-name">{user?.username || "Player"}</p>
              <p className="user-status">Online</p>
            </div>
          </div>
          <button className="topnav-logout" title="Logout" onClick={logout}>
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <div className="shell-main">
        {/* Sidebar Navigation */}
        <aside className={`shell-sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-content">
            <div className="sidebar-header">
              <h2>Navigation</h2>
            </div>

            <nav className="sidebar-nav">
              {navItems.map((item) => (
                <a
                  key={item.path}
                  href={item.path}
                  className={`sidebar-nav-item ${currentPage === item.path ? "active" : ""}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                </a>
              ))}
            </nav>

            <div className="sidebar-footer">
              <div className="sidebar-stats">
                <div className="stat">
                  <span className="stat-label">Balance</span>
                  <span className="stat-value">$1,234.56</span>
                </div>
                <div className="stat">
                  <span className="stat-label">VIP Level</span>
                  <span className="stat-value">Gold</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div className="shell-overlay" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main Content Area */}
        <main className="shell-content" style={{ marginRight: chatOpen ? "320px" : "0", transition: "margin-right 0.3s" }}>
          <div className="content-wrapper">{children}</div>
        </main>
      </div>

      {/* Chat Panel */}
      <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
};

export default ShellLayout;
