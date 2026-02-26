import React, { useState } from "react";
import { Menu, X, Home, Gamepad2, Users, BarChart3, Settings, LogOut } from "lucide-react";
import "./ShellLayout.css";

interface ShellLayoutProps {
  children: React.ReactNode;
  title?: string;
  currentPage?: string;
}

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: string;
}

export const ShellLayout: React.FC<ShellLayoutProps> = ({ children, title, currentPage }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems: NavItem[] = [
    { label: "Dashboard", icon: <Home size={20} />, path: "/dashboard" },
    { label: "Casino", icon: <Gamepad2 size={20} />, path: "/casino" },
    { label: "Community", icon: <Users size={20} />, path: "/live-community", badge: "Live" },
    { label: "Stats", icon: <BarChart3 size={20} />, path: "/user-stats" },
    { label: "Settings", icon: <Settings size={20} />, path: "/settings" },
  ];

  return (
    <div className="shell-layout">
      {/* Top Navigation Bar */}
      <nav className="shell-topnav">
        <div className="topnav-left">
          <button
            className="topnav-menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="topnav-branding">
            <h1 className="topnav-title">CloutScape</h1>
            {title && <span className="topnav-subtitle">{title}</span>}
          </div>
        </div>

        <div className="topnav-right">
          <div className="topnav-user">
            <div className="user-avatar">CS</div>
            <div className="user-info">
              <p className="user-name">Player</p>
              <p className="user-status">Online</p>
            </div>
          </div>
          <button className="topnav-logout" title="Logout">
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
          <div
            className="shell-overlay"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          ></div>
        )}

        {/* Main Content Area */}
        <main className="shell-content">
          <div className="content-wrapper">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default ShellLayout;
