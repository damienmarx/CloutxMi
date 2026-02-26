import { ReactNode, Component, ErrorInfo } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { errorHandler, ErrorCategory, ErrorSeverity } from "@/_core/errorHandler";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

/**
 * Enhanced Error Boundary Component
 * Catches React component errors and provides graceful fallback UI
 */
export class ErrorBoundaryEnhanced extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error handler
    const report = errorHandler.handleError(
      error,
      ErrorCategory.CLIENT,
      ErrorSeverity.HIGH,
      {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      }
    );

    this.setState({ errorId: report.id });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error caught by boundary:", error);
      console.error("Component stack:", errorInfo.componentStack);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <div className="error-icon">
              <AlertCircle size={64} />
            </div>

            <h1 className="error-title">Oops! Something went wrong</h1>

            <p className="error-message">
              We encountered an unexpected error. Our team has been notified and is working on a fix.
            </p>

            {this.state.errorId && (
              <div className="error-id">
                <p className="error-id-label">Error ID:</p>
                <code className="error-id-value">{this.state.errorId}</code>
                <p className="error-id-hint">Please provide this ID when contacting support</p>
              </div>
            )}

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <pre className="error-stack">{this.state.error.toString()}</pre>
              </details>
            )}

            <div className="error-actions">
              <button onClick={this.handleReset} className="error-button error-button-primary">
                <RefreshCw size={18} />
                Try Again
              </button>

              <button onClick={this.handleReload} className="error-button error-button-secondary">
                <Home size={18} />
                Reload Page
              </button>
            </div>

            <p className="error-support">
              If the problem persists, please contact{" "}
              <a href="mailto:Support@cloutscape.org">Support@cloutscape.org</a> / <a href="mailto:Support@cloutscape.online">Support@cloutscape.online</a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundaryEnhanced;
