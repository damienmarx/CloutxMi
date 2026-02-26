import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import ChatBox from "@/components/ChatBox";
import RainModule from "@/components/RainModule";
import { AlertCircle, Info } from "lucide-react";
import "./LiveCommunity.css";

interface UserInfo {
  id: number;
  username: string;
  totalDeposited: number;
  totalWagered: number;
}

export const LiveCommunity: React.FC = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [canChat, setCanChat] = useState(false);
  const [rainPoolAmount, setRainPoolAmount] = useState(0);
  const [participantCount, setParticipantCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch user info
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // This would be replaced with actual tRPC call
        // const user = await trpc.user.getProfile.query();
        // For now, mock data
        const mockUser: UserInfo = {
          id: 1,
          username: "Player",
          totalDeposited: 50,
          totalWagered: 500,
        };
        setUserInfo(mockUser);

        // Check chat eligibility
        const hasDeposited = mockUser.totalDeposited >= 10;
        const hasWagered = mockUser.totalWagered >= mockUser.totalDeposited * 10;
        setCanChat(hasDeposited && hasWagered);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching user info:", error);
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  // Mock rain pool updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRainPoolAmount((prev) => {
        const newAmount = prev + Math.random() * 50;
        return Math.min(newAmount, 10000);
      });
      setParticipantCount(Math.floor(Math.random() * 50) + 5);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="live-community-loading">
        <div className="loading-spinner"></div>
        <p>Loading community...</p>
      </div>
    );
  }

  return (
    <div className="live-community-container">
      {/* Header */}
      <div className="live-community-header">
        <h1 className="page-title">Live Community</h1>
        <p className="page-subtitle">Connect with players, chat, and participate in rain events</p>
      </div>

      {/* Chat Eligibility Notice */}
      {!canChat && (
        <div className="eligibility-notice">
          <AlertCircle size={20} />
          <div className="notice-content">
            <h3>Chat Restricted</h3>
            <p>
              To unlock chat, you need to: <br />
              ✓ Deposit at least $10 <br />
              ✓ Wager 10x your deposit amount
            </p>
            {userInfo && (
              <div className="progress-info">
                <p>
                  Deposited: <strong>${userInfo.totalDeposited.toFixed(2)}</strong>
                </p>
                <p>
                  Wagered: <strong>${userInfo.totalWagered.toFixed(2)}</strong> / $
                  {(userInfo.totalDeposited * 10).toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="live-community-grid">
        {/* Chat Section */}
        <div className="community-section chat-section">
          <ChatBox
            userId={userInfo?.id || 0}
            username={userInfo?.username || "Guest"}
            canChat={canChat}
          />
        </div>

        {/* Rain Section */}
        <div className="community-section rain-section">
          <RainModule
            poolAmount={rainPoolAmount}
            participantCount={participantCount}
            maxPoolAmount={10000}
            osrsGpRate={1000}
          />

          {/* Rain Info */}
          <div className="rain-info">
            <Info size={16} />
            <p>
              The rain pool accumulates from platform activity. When it reaches its max, all
              active participants share the rewards!
            </p>
          </div>
        </div>
      </div>

      {/* Community Stats */}
      <div className="community-stats">
        <div className="stat-card">
          <span className="stat-label">Active Players</span>
          <span className="stat-value">{participantCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Rain Pool</span>
          <span className="stat-value">${rainPoolAmount.toFixed(2)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">OSRS GP Value</span>
          <span className="stat-value">{(rainPoolAmount * 1000).toLocaleString()} GP</span>
        </div>
      </div>

      {/* Rules & Disclaimer */}
      <div className="community-rules">
        <h3>Community Guidelines</h3>
        <ul>
          <li>✓ Be respectful to all players</li>
          <li>✓ No spam or excessive self-promotion</li>
          <li>✓ No sharing of personal information</li>
          <li>✓ Follow all platform rules and regulations</li>
          <li>⚠️ Chat requires: $10 deposit + 10x wager minimum</li>
          <li>⚠️ Violations may result in chat suspension</li>
        </ul>
      </div>
    </div>
  );
};

export default LiveCommunity;
