import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { AlertCircle, CheckCircle, Eye, EyeOff, Loader } from "lucide-react";
import "../styles/landing.css";

/**
 * Landing Page Component
 * Professional, visually captivating landing page with integrated authentication
 */

interface FormState {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

interface FormErrors {
  [key: string]: string;
}

interface FormStatus {
  type: "idle" | "loading" | "success" | "error";
  message: string;
}

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  // State management
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login form state
  const [loginForm, setLoginForm] = useState({
    username: "",
    password: "",
  });

  // Register form state
  const [registerForm, setRegisterForm] = useState<FormState>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  // Error and status states
  const [loginErrors, setLoginErrors] = useState<FormErrors>({});
  const [registerErrors, setRegisterErrors] = useState<FormErrors>({});
  const [loginStatus, setLoginStatus] = useState<FormStatus>({
    type: "idle",
    message: "",
  });
  const [registerStatus, setRegisterStatus] = useState<FormStatus>({
    type: "idle",
    message: "",
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  /**
   * Validation Functions
   */

  const validateLoginForm = (): boolean => {
    const errors: FormErrors = {};

    if (!loginForm.username.trim()) {
      errors.username = "Username is required";
    } else if (loginForm.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    }

    if (!loginForm.password) {
      errors.password = "Password is required";
    } else if (loginForm.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRegisterForm = (): boolean => {
    const errors: FormErrors = {};

    // Username validation
    if (!registerForm.username.trim()) {
      errors.username = "Username is required";
    } else if (registerForm.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    } else if (registerForm.username.length > 64) {
      errors.username = "Username must be less than 64 characters";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(registerForm.username)) {
      errors.username = "Username can only contain letters, numbers, underscores, and hyphens";
    }

    // Email validation
    if (!registerForm.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!registerForm.password) {
      errors.password = "Password is required";
    } else if (registerForm.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(registerForm.password)) {
      errors.password = "Password must contain at least one uppercase letter";
    } else if (!/[a-z]/.test(registerForm.password)) {
      errors.password = "Password must contain at least one lowercase letter";
    } else if (!/[0-9]/.test(registerForm.password)) {
      errors.password = "Password must contain at least one number";
    }

    // Confirm password validation
    if (!registerForm.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (registerForm.password !== registerForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    // Terms agreement validation
    if (!registerForm.agreeTerms) {
      errors.agreeTerms = "You must agree to the terms and conditions";
    }

    setRegisterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Form Handlers
   */

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (loginErrors[name]) {
      setLoginErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleRegisterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, type } = e.target;
    const value =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;

    setRegisterForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (registerErrors[name]) {
      setRegisterErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateLoginForm()) {
      return;
    }

    setLoginStatus({ type: "loading", message: "Logging in..." });

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setLoginStatus({
        type: "success",
        message: "Login successful! Redirecting...",
      });

      // Redirect after success
      setTimeout(() => {
        setLocation("/dashboard");
      }, 1000);
    } catch (error) {
      setLoginStatus({
        type: "error",
        message: "Login failed. Please check your credentials and try again.",
      });
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateRegisterForm()) {
      return;
    }

    setRegisterStatus({ type: "loading", message: "Creating account..." });

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setRegisterStatus({
        type: "success",
        message: "Account created successfully! Logging in...",
      });

      // Switch to login tab
      setTimeout(() => {
        setActiveTab("login");
        setLoginForm({
          username: registerForm.username,
          password: registerForm.password,
        });
      }, 1000);
    } catch (error) {
      setRegisterStatus({
        type: "error",
        message: "Registration failed. Please try again.",
      });
    }
  };

  /**
   * Render Functions
   */

  const renderFormAlert = (status: FormStatus) => {
    if (status.type === "idle") return null;

    const alertClass = `alert alert-${status.type}`;
    const Icon =
      status.type === "error"
        ? AlertCircle
        : status.type === "success"
          ? CheckCircle
          : Loader;

    return (
      <div className={alertClass}>
        <div className="alert-icon">
          <Icon size={20} />
        </div>
        <div className="alert-message">{status.message}</div>
      </div>
    );
  };

  const renderFormError = (fieldName: string, errors: FormErrors) => {
    if (errors[fieldName]) {
      return <div className="form-error">{errors[fieldName]}</div>;
    }
    return null;
  };

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-brand">
            <div className="navbar-logo">💎</div>
            <span>CloutScape</span>
          </div>
          <div className="navbar-nav">
            <a href="#features" className="navbar-nav-item">
              Features
            </a>
            <a href="#about" className="navbar-nav-item">
              About
            </a>
            <a href="mailto:support@cloutscape.org" className="navbar-nav-item">
              Contact
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          {/* Hero Image */}
          <img
            src="/cloutscape-hero.jpg"
            alt="CloutScape"
            className="hero-image"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />

          <h1 className="hero-title">CloutScape</h1>
          <p className="hero-subtitle">Where Legends Are Made</p>
          <p className="hero-description">
            Experience the ultimate gaming platform with provably fair games,
            secure crypto integration, and exclusive VIP rewards
          </p>

          {/* Authentication Forms Container */}
          <div className="auth-container">
            {/* Tab Navigation */}
            <div className="auth-tabs">
              <button
                className={`auth-tab ${activeTab === "login" ? "active" : ""}`}
                onClick={() => setActiveTab("login")}
              >
                Login
              </button>
              <button
                className={`auth-tab ${activeTab === "register" ? "active" : ""}`}
                onClick={() => setActiveTab("register")}
              >
                Register
              </button>
            </div>

            {/* Login Form */}
            {activeTab === "login" && (
              <form onSubmit={handleLoginSubmit} className="auth-form">
                {renderFormAlert(loginStatus)}

                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={loginForm.username}
                    onChange={handleLoginChange}
                    placeholder="Enter your username"
                    className="form-input"
                    disabled={loginStatus.type === "loading"}
                  />
                  {renderFormError("username", loginErrors)}
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={loginForm.password}
                      onChange={handleLoginChange}
                      placeholder="Enter your password"
                      className="form-input"
                      disabled={loginStatus.type === "loading"}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loginStatus.type === "loading"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {renderFormError("password", loginErrors)}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={loginStatus.type === "loading"}
                >
                  {loginStatus.type === "loading" ? "Logging in..." : "Login"}
                </button>

                <div className="form-footer">
                  <a href="/forgot-password" className="form-link">
                    Forgot password?
                  </a>
                </div>
              </form>
            )}

            {/* Register Form */}
            {activeTab === "register" && (
              <form onSubmit={handleRegisterSubmit} className="auth-form">
                {renderFormAlert(registerStatus)}

                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={registerForm.username}
                    onChange={handleRegisterChange}
                    placeholder="Choose a username"
                    className="form-input"
                    disabled={registerStatus.type === "loading"}
                  />
                  {renderFormError("username", registerErrors)}
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={registerForm.email}
                    onChange={handleRegisterChange}
                    placeholder="Enter your email"
                    className="form-input"
                    disabled={registerStatus.type === "loading"}
                  />
                  {renderFormError("email", registerErrors)}
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={registerForm.password}
                      onChange={handleRegisterChange}
                      placeholder="Create a strong password"
                      className="form-input"
                      disabled={registerStatus.type === "loading"}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={registerStatus.type === "loading"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {renderFormError("password", registerErrors)}
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={registerForm.confirmPassword}
                      onChange={handleRegisterChange}
                      placeholder="Confirm your password"
                      className="form-input"
                      disabled={registerStatus.type === "loading"}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={registerStatus.type === "loading"}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {renderFormError("confirmPassword", registerErrors)}
                </div>

                <div className="form-group checkbox">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    name="agreeTerms"
                    checked={registerForm.agreeTerms}
                    onChange={handleRegisterChange}
                    disabled={registerStatus.type === "loading"}
                  />
                  <label htmlFor="agreeTerms" className="checkbox-label">
                    I agree to the{" "}
                    <a href="/terms" className="form-link">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="/privacy" className="form-link">
                      Privacy Policy
                    </a>
                  </label>
                </div>
                {renderFormError("agreeTerms", registerErrors)}

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={registerStatus.type === "loading"}
                >
                  {registerStatus.type === "loading" ? "Creating account..." : "Create Account"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4 className="footer-title">CloutScape</h4>
              <p className="footer-text">
                The ultimate gaming platform with provably fair games and secure crypto integration.
              </p>
            </div>
            <div className="footer-section">
              <h4 className="footer-title">Support</h4>
              <ul className="footer-links">
                <li>
                  <a href="mailto:support@cloutscape.org">Email Support</a>
                </li>
                <li>
                  <a href="/faq">FAQ</a>
                </li>
                <li>
                  <a href="/contact">Contact Us</a>
                </li>
              </ul>
            </div>
            <div className="footer-section">
              <h4 className="footer-title">Legal</h4>
              <ul className="footer-links">
                <li>
                  <a href="/terms">Terms of Service</a>
                </li>
                <li>
                  <a href="/privacy">Privacy Policy</a>
                </li>
                <li>
                  <a href="/responsible-gaming">Responsible Gaming</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 CloutScape. All rights reserved.</p>
            <p>Developed by CloutScape Developer Team</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
