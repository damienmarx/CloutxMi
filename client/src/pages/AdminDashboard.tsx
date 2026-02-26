import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Wallet, Settings, BarChart3, Shield } from "lucide-react";
import "../styles/admin-dashboard.css";

interface AdminTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ADMIN_TABS: AdminTab[] = [
  { id: "users", label: "User Management", icon: Users },
  { id: "wallet", label: "Wallet Management", icon: Wallet },
  { id: "games", label: "Game Configuration", icon: Settings },
  { id: "transactions", label: "Transactions", icon: BarChart3 },
  { id: "security", label: "Security", icon: Shield },
];

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const [selectedUser, setSelectedUser] = useState<number | null>(null);

  // Queries
  const { data: users, isLoading: usersLoading } = trpc.admin.getUsers.useQuery(
    { limit: 50, offset: 0 },
    { enabled: activeTab === "users" && !!user }
  );

  const { data: transactions, isLoading: transactionsLoading } = trpc.admin.getTransactions.useQuery(
    { limit: 50, offset: 0 },
    { enabled: activeTab === "transactions" && !!user }
  );

  // Mutations
  const updateUserMutation = trpc.admin.updateUser.useMutation();
  const adjustBalanceMutation = trpc.admin.adjustUserBalance.useMutation();

  if (loading) {
    return (
      <div className="admin-container">
        <div className="admin-loading">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    setLocation("/dashboard");
    return null;
  }

  const handleMuteUser = async (userId: number) => {
    try {
      await updateUserMutation.mutateAsync({
        userId,
        isMuted: true,
      });
      alert("User muted successfully");
    } catch (error) {
      alert("Failed to mute user");
    }
  };

  const handleUnmuteUser = async (userId: number) => {
    try {
      await updateUserMutation.mutateAsync({
        userId,
        isMuted: false,
      });
      alert("User unmuted successfully");
    } catch (error) {
      alert("Failed to unmute user");
    }
  };

  const handleAdjustBalance = async (userId: number, amount: number, reason: string) => {
    try {
      await adjustBalanceMutation.mutateAsync({
        userId,
        currency: "USD",
        amount,
        reason,
      });
      alert("Balance adjusted successfully");
    } catch (error) {
      alert("Failed to adjust balance");
    }
  };

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="admin-header">
        <Button
          onClick={() => setLocation("/dashboard")}
          className="admin-back-button"
        >
          <ArrowLeft className="icon" />
          Back to Dashboard
        </Button>
        <h1 className="admin-title">Admin Dashboard</h1>
        <div className="admin-user-info">
          <span>{user.username}</span>
          <span className="admin-badge">ADMIN</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {ADMIN_TABS.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              className={`admin-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <IconComponent className="tab-icon" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="admin-content">
        {/* User Management Tab */}
        {activeTab === "users" && (
          <Card className="admin-card">
            <h2>User Management</h2>
            {usersLoading ? (
              <p>Loading users...</p>
            ) : (
              <div className="admin-users-list">
                {users?.map((u: any) => (
                  <div key={u.id} className="admin-user-item">
                    <div className="user-info">
                      <p className="user-username">{u.username}</p>
                      <p className="user-email">{u.email}</p>
                      <p className="user-role">Role: {u.role}</p>
                      {u.isMuted && <span className="muted-badge">MUTED</span>}
                    </div>
                    <div className="user-actions">
                      {u.isMuted ? (
                        <Button
                          onClick={() => handleUnmuteUser(u.id)}
                          className="action-button unmute"
                        >
                          Unmute
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleMuteUser(u.id)}
                          className="action-button mute"
                        >
                          Mute
                        </Button>
                      )}
                      <Button
                        onClick={() => setSelectedUser(u.id)}
                        className="action-button edit"
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Wallet Management Tab */}
        {activeTab === "wallet" && (
          <Card className="admin-card">
            <h2>Wallet Management</h2>
            <div className="wallet-controls">
              <div className="control-group">
                <label>User ID</label>
                <input type="number" placeholder="Enter user ID" id="walletUserId" />
              </div>
              <div className="control-group">
                <label>Amount</label>
                <input type="number" placeholder="Enter amount" id="walletAmount" step="0.01" />
              </div>
              <div className="control-group">
                <label>Reason</label>
                <input type="text" placeholder="Reason for adjustment" id="walletReason" />
              </div>
              <Button
                onClick={() => {
                  const userId = parseInt((document.getElementById("walletUserId") as HTMLInputElement)?.value || "0");
                  const amount = parseFloat((document.getElementById("walletAmount") as HTMLInputElement)?.value || "0");
                  const reason = (document.getElementById("walletReason") as HTMLInputElement)?.value || "";
                  if (userId > 0 && amount !== 0) {
                    handleAdjustBalance(userId, amount, reason);
                  }
                }}
                className="action-button submit"
              >
                Adjust Balance
              </Button>
            </div>
          </Card>
        )}

        {/* Game Configuration Tab */}
        {activeTab === "games" && (
          <Card className="admin-card">
            <h2>Game Configuration</h2>
            <p className="placeholder-text">Game configuration controls coming soon...</p>
          </Card>
        )}

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <Card className="admin-card">
            <h2>Transactions</h2>
            {transactionsLoading ? (
              <p>Loading transactions...</p>
            ) : (
              <div className="admin-transactions-list">
                {transactions?.map((tx: any) => (
                  <div key={tx.id} className="transaction-item">
                    <div className="tx-info">
                      <p className="tx-type">{tx.type}</p>
                      <p className="tx-description">{tx.description}</p>
                      <p className="tx-date">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="tx-amount">
                      <span className={tx.type.includes("withdrawal") ? "negative" : "positive"}>
                        {tx.type.includes("withdrawal") ? "-" : "+"}{tx.amount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <Card className="admin-card">
            <h2>Security Settings</h2>
            <p className="placeholder-text">Security settings coming soon...</p>
          </Card>
        )}
      </div>
    </div>
  );
}
