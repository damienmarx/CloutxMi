import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import HolographicBackground from "./components/HolographicBackground";

// Pages — Auth
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

// Pages — Dashboard
import Dashboard from "./pages/Dashboard";
import UserStatsDashboard from "./pages/UserStatsDashboard";
import VIPProgress from "./pages/VIPProgress";

// Pages — Premium games (Degens¤Den)
import Dice from "./pages/Dice";
import Crash from "./pages/Crash";
import Plinko from "./pages/Plinko";
import Limbo from "./pages/Limbo";
import LuckyWheel from "./pages/LuckyWheel";
import KenoGame from "./pages/KenoGame";

// Pages — Verifier
import ProvablyFairLab from "./pages/ProvablyFairLab";

// Pages — Legacy games (keep accessible)
import SlotsGame from "./pages/SlotsGame";
import Slots3DGame from "./pages/Slots3DGame";
import BlackjackGame from "./pages/BlackjackGame";
import RouletteGame from "./pages/RouletteGame";

// Pages — Social
import Visualizers from "./pages/Visualizers";
import LiveChat from "./pages/LiveChat";
import LiveCommunity from "./pages/LiveCommunity";
import RainSystem from "./pages/RainSystem";

// Pages — Account
import OsrsDeposit from "./pages/OsrsDeposit";
import OsrsWithdraw from "./pages/OsrsWithdraw";
import MfaManagement from "./pages/MfaManagement";
import LegalDisclaimers from "./pages/LegalDisclaimers";

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/legal" component={LegalDisclaimers} />

      {/* Dashboard */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/user-stats" component={UserStatsDashboard} />
      <Route path="/vip-progress" component={VIPProgress} />

      {/* Premium games */}
      <Route path="/dice" component={Dice} />
      <Route path="/crash" component={Crash} />
      <Route path="/plinko" component={Plinko} />
      <Route path="/limbo" component={Limbo} />
      <Route path="/wheel" component={LuckyWheel} />
      <Route path="/lucky-wheel" component={LuckyWheel} />
      <Route path="/keno" component={KenoGame} />

      {/* Verifier */}
      <Route path="/verifier" component={ProvablyFairLab} />

      {/* Legacy games */}
      <Route path="/slots" component={SlotsGame} />
      <Route path="/slots-3d" component={Slots3DGame} />
      <Route path="/blackjack" component={BlackjackGame} />
      <Route path="/roulette" component={RouletteGame} />

      {/* Social */}
      <Route path="/live-chat" component={LiveChat} />
      <Route path="/live-community" component={LiveCommunity} />
      <Route path="/rain-system" component={RainSystem} />
      <Route path="/visualizers" component={Visualizers} />

      {/* Account */}
      <Route path="/osrs-deposit" component={OsrsDeposit} />
      <Route path="/osrs-withdraw" component={OsrsWithdraw} />
      <Route path="/mfa" component={MfaManagement} />

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <HolographicBackground intensity="medium">
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </HolographicBackground>
    </ErrorBoundary>
  );
}

export default App;
