import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import HolographicBackground from "./components/HolographicBackground";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import KenoGame from "./pages/KenoGame";
import SlotsGame from "./pages/SlotsGame";
import Slots3DGame from "./pages/Slots3DGame";
import CrashGame from "./pages/CrashGame";
import BlackjackGame from "./pages/BlackjackGame";
import RouletteGame from "./pages/RouletteGame";
import DiceGame from "./pages/DiceGame";
import Visualizers from "./pages/Visualizers";
import LiveChat from "./pages/LiveChat";
import LiveCommunity from "./pages/LiveCommunity";
import RainSystem from "./pages/RainSystem";
import VIPProgress from "./pages/VIPProgress";
import UserStatsDashboard from "./pages/UserStatsDashboard";
import OsrsDeposit from "./pages/OsrsDeposit";
import OsrsWithdraw from "./pages/OsrsWithdraw";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/register"} component={Register} />
      <Route path={"/forgot-password"} component={ForgotPassword} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/keno"} component={KenoGame} />
      <Route path={"/slots"} component={SlotsGame} />
      <Route path={"/slots-3d"} component={Slots3DGame} />
      <Route path={"/crash"} component={CrashGame} />
      <Route path={"/blackjack"} component={BlackjackGame} />
      <Route path={"/roulette"} component={RouletteGame} />
      <Route path={"/dice"} component={DiceGame} />
      <Route path={"/visualizers"} component={Visualizers} />
      <Route path={"/live-chat"} component={LiveChat} />
      <Route path={"/live-community"} component={LiveCommunity} />
      <Route path={"/rain-system"} component={RainSystem} />
      <Route path={"/vip-progress"} component={VIPProgress} />
      <Route path={"/user-stats"} component={UserStatsDashboard} />
      <Route path={"/osrs-deposit"} component={OsrsDeposit} />
      <Route path={"/osrs-withdraw"} component={OsrsWithdraw} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
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
