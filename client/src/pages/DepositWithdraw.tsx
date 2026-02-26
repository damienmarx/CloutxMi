import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import "../styles/deposit-withdraw.css";

type DepositMethod = "fiat" | "osrs";
type FiatCurrency = "USD" | "CAD";

export default function DepositWithdraw() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [method, setMethod] = useState<DepositMethod>("fiat");
  const [currency, setCurrency] = useState<FiatCurrency>("USD");
  const [amount, setAmount] = useState("");
  const [osrsAmount, setOsrsAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);

  // Queries
  const { data: balance } = trpc.wallet.getBalance.useQuery();
  const { data: rates } = trpc.wallet.getExchangeRates.useQuery();
  const { data: depositInstructions } = trpc.wallet.getDepositInstructions.useQuery();

  // Mutations
  const depositFiatMutation = trpc.wallet.depositFiat.useMutation();
  const withdrawFiatMutation = trpc.wallet.withdrawFiat.useMutation();
  const depositOSRSMutation = trpc.wallet.depositOSRSGP.useMutation();
  const withdrawOSRSMutation = trpc.wallet.withdrawOSRSGP.useMutation();

  if (!user) return null;

  // Calculate conversions
  const numAmount = parseFloat(amount) || 0;
  const numOsrsAmount = parseFloat(osrsAmount) || 0;

  const convertedToCAD = currency === "USD" && numAmount > 0 ? numAmount * (rates?.USD_to_CAD || 1.36) : 0;
  const convertedToOSRS = numAmount > 0 ? numAmount * (rates?.USD_to_OSRS_GP || 1000000) : 0;
  const convertedToUSD = numOsrsAmount > 0 ? numOsrsAmount * (rates?.OSRS_GP_to_USD || 0.000001) : 0;

  const handleFiatDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const result = await depositFiatMutation.mutateAsync({
        amount: parseFloat(amount),
        currency,
        paymentMethod: "credit_card",
      });

      if (result.success) {
        alert(`Deposit successful! ${result.amountDeposited} ${currency} has been added to your account.`);
        setAmount("");
      } else {
        alert(`Deposit failed: ${result.error}`);
      }
    } catch (error) {
      alert("An error occurred during deposit");
    } finally {
      setLoading(false);
    }
  };

  const handleFiatWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const result = await withdrawFiatMutation.mutateAsync({
        amount: parseFloat(amount),
        currency,
      });

      if (result.success) {
        alert(`Withdrawal initiated! ${result.amountWithdrawn} ${currency} will be transferred to your account.`);
        setAmount("");
      } else {
        alert(`Withdrawal failed: ${result.error}`);
      }
    } catch (error) {
      alert("An error occurred during withdrawal");
    } finally {
      setLoading(false);
    }
  };

  const handleOSRSDeposit = async () => {
    if (!osrsAmount || parseFloat(osrsAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (!walletAddress) {
      alert("Please enter your wallet address");
      return;
    }

    setLoading(true);
    try {
      const result = await depositOSRSMutation.mutateAsync({
        amountGP: parseFloat(osrsAmount),
        trustWalletAddress: walletAddress,
      });

      if (result.success) {
        alert(`OSRS deposit initiated! Your account will be credited shortly.`);
        setOsrsAmount("");
        setWalletAddress("");
      } else {
        alert(`Deposit failed: ${result.error}`);
      }
    } catch (error) {
      alert("An error occurred during OSRS deposit");
    } finally {
      setLoading(false);
    }
  };

  const handleOSRSWithdraw = async () => {
    if (!osrsAmount || parseFloat(osrsAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (!walletAddress) {
      alert("Please enter your wallet address");
      return;
    }

    setLoading(true);
    try {
      const result = await withdrawOSRSMutation.mutateAsync({
        amountGP: parseFloat(osrsAmount),
        trustWalletAddress: walletAddress,
      });

      if (result.success) {
        alert(`OSRS withdrawal initiated! Please allow 24-48 hours for processing.`);
        setOsrsAmount("");
        setWalletAddress("");
      } else {
        alert(`Withdrawal failed: ${result.error}`);
      }
    } catch (error) {
      alert("An error occurred during OSRS withdrawal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="deposit-withdraw-container">
      <div className="dw-header">
        <h1>Deposit & Withdraw</h1>
        <div className="balance-display">
          <span>Current Balance: ${balance?.balance || "0.00"} USD</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="dw-tabs">
        <button
          className={`dw-tab ${activeTab === "deposit" ? "active" : ""}`}
          onClick={() => setActiveTab("deposit")}
        >
          <DollarSign className="icon" />
          Deposit
        </button>
        <button
          className={`dw-tab ${activeTab === "withdraw" ? "active" : ""}`}
          onClick={() => setActiveTab("withdraw")}
        >
          <TrendingUp className="icon" />
          Withdraw
        </button>
      </div>

      {/* Content */}
      <div className="dw-content">
        {/* Fiat Deposit/Withdraw */}
        <Card className="dw-card">
          <h2>Fiat Currency ({currency})</h2>

          <div className="dw-method-selector">
            <button
              className={`method-btn ${method === "fiat" ? "active" : ""}`}
              onClick={() => setMethod("fiat")}
            >
              USD / CAD
            </button>
            <button
              className={`method-btn ${method === "osrs" ? "active" : ""}`}
              onClick={() => setMethod("osrs")}
            >
              OSRS GP
            </button>
          </div>

          {method === "fiat" && (
            <div className="dw-form">
              <div className="form-group">
                <label>Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value as FiatCurrency)}>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="CAD">CAD (Canadian Dollar)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  step="0.01"
                  min="0"
                />
              </div>

              {/* Conversion Display */}
              {numAmount > 0 && (
                <div className="conversion-display">
                  <div className="conversion-item">
                    <span className="label">Amount:</span>
                    <span className="value">${numAmount.toFixed(2)} {currency}</span>
                  </div>
                  {currency === "USD" && (
                    <div className="conversion-item">
                      <span className="label">In CAD:</span>
                      <span className="value">C${convertedToCAD.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="conversion-item">
                    <span className="label">In OSRS GP:</span>
                    <span className="value">{Math.floor(convertedToOSRS).toLocaleString()} GP</span>
                  </div>
                </div>
              )}

              <Button
                onClick={activeTab === "deposit" ? handleFiatDeposit : handleFiatWithdraw}
                disabled={loading || !amount}
                className="dw-submit-btn"
              >
                {loading ? "Processing..." : activeTab === "deposit" ? "Deposit" : "Withdraw"}
              </Button>
            </div>
          )}
        </Card>

        {/* OSRS Deposit/Withdraw */}
        <Card className="dw-card">
          <h2>OSRS Gold Piece (GP)</h2>

          {method === "osrs" && (
            <div className="dw-form">
              <div className="form-group">
                <label>Amount (in GP)</label>
                <input
                  type="number"
                  value={osrsAmount}
                  onChange={(e) => setOsrsAmount(e.target.value)}
                  placeholder="Enter amount in GP"
                  step="1000000"
                  min="0"
                />
                <small>Minimum: 1,000,000 GP (1 Million)</small>
              </div>

              <div className="form-group">
                <label>Trust Wallet Address</label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="Enter your wallet address"
                />
              </div>

              {/* Conversion Display */}
              {numOsrsAmount > 0 && (
                <div className="conversion-display">
                  <div className="conversion-item">
                    <span className="label">OSRS GP:</span>
                    <span className="value">{Math.floor(numOsrsAmount).toLocaleString()} GP</span>
                  </div>
                  <div className="conversion-item">
                    <span className="label">In USD:</span>
                    <span className="value">${convertedToUSD.toFixed(2)}</span>
                  </div>
                  <div className="conversion-item">
                    <span className="label">In CAD:</span>
                    <span className="value">C${(convertedToUSD * (rates?.USD_to_CAD || 1.36)).toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="dw-instructions">
                <AlertCircle className="icon" />
                <div>
                  <h4>{activeTab === "deposit" ? "Deposit Instructions" : "Withdrawal Instructions"}</h4>
                  <p>{depositInstructions?.osrsInstructions || "Loading instructions..."}</p>
                </div>
              </div>

              <Button
                onClick={activeTab === "deposit" ? handleOSRSDeposit : handleOSRSWithdraw}
                disabled={loading || !osrsAmount || !walletAddress}
                className="dw-submit-btn"
              >
                {loading ? "Processing..." : activeTab === "deposit" ? "Deposit OSRS GP" : "Withdraw OSRS GP"}
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Security Notice */}
      <div className="security-notice">
        <AlertCircle className="icon" />
        <div>
          <h4>Security Notice</h4>
          <p>All transactions are encrypted and secured. Never share your wallet address or private keys with anyone.</p>
        </div>
      </div>
    </div>
  );
}
