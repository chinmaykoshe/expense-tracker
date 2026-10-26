"use client";

import { useState, useEffect } from "react";
import { authenticateUser, registerUser, getUserCapacity, MAX_ALLOWED_USERS } from "../lib/firebase";
import { REMEMBER_USER_KEY } from "../lib/constants";

export default function LoginPage({ onLoginSuccess, theme, onToggleTheme }) {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [capacity, setCapacity] = useState({
    count: 1,
    limit: MAX_ALLOWED_USERS,
    available: 99,
    isFull: false,
  });

  // Pre-fill remembered username on mount
  useEffect(() => {
    try {
      const savedUsername = localStorage.getItem(REMEMBER_USER_KEY);
      if (savedUsername) {
        setUsername(savedUsername);
        setRememberMe(true);
      }
    } catch (e) {}
  }, []);

  // Fetch live capacity from Firebase on mount and on mode change
  useEffect(() => {
    let isMounted = true;
    getUserCapacity().then((cap) => {
      if (isMounted) setCapacity(cap);
    });
    return () => {
      isMounted = false;
    };
  }, [mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanUser = username.trim();
    if (!cleanUser || !password) {
      setErrorMessage("Please enter both username and password.");
      return;
    }

    if (mode === "signup") {
      if (cleanUser.length < 3 || cleanUser.length > 30) {
        setErrorMessage("Username must be between 3 and 30 characters.");
        return;
      }
      if (!/^[a-zA-Z0-9_\-\.]+$/.test(cleanUser)) {
        setErrorMessage("Username can only contain letters, numbers, hyphens, and underscores.");
        return;
      }
      if (password.length < 6) {
        setErrorMessage("Password must be at least 6 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match. Please re-enter.");
        return;
      }
      if (capacity.isFull) {
        setErrorMessage(`Registration closed: Database capacity of ${capacity.limit} users has been reached.`);
        return;
      }
    }

    setIsLoading(true);

    try {
      if (mode === "signin") {
        const result = await authenticateUser(cleanUser, password);
        if (result.success) {
          try {
            if (rememberMe) {
              localStorage.setItem(REMEMBER_USER_KEY, cleanUser);
            } else {
              localStorage.removeItem(REMEMBER_USER_KEY);
            }
          } catch (e) {}
          onLoginSuccess(result.username);
        } else {
          setErrorMessage(result.message || "Invalid username or password. Please try again.");
        }
      } else {
        // Sign Up
        const result = await registerUser(cleanUser, password);
        if (result.success) {
          try {
            if (rememberMe) {
              localStorage.setItem(REMEMBER_USER_KEY, cleanUser);
            } else {
              localStorage.removeItem(REMEMBER_USER_KEY);
            }
          } catch (e) {}
          onLoginSuccess(result.username);
        } else {
          setErrorMessage(result.message || "Registration failed. Please try again.");
        }
      }
    } catch (err) {
      setErrorMessage("Authentication failed. Please check your network connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setErrorMessage("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="login-wrapper">
      {/* Top right theme toggle */}
      <div className="login-top-bar">
        <button
          type="button"
          className="btn-action btn-theme"
          onClick={onToggleTheme}
          title="Toggle Theme"
        >
          <span>{theme === "dark" ? "☀️" : "🌙"}</span>
          <span className="btn-label">Theme</span>
        </button>
      </div>

      <div className="login-card">
        {/* Brand Header */}
        <div className="login-brand">
          <div className="login-icon">💸</div>
          <h1 className="login-title">Expense Tracker</h1>
          <p className="login-subtitle">
            {mode === "signin"
              ? "Sign in with your credentials to access your budget dashboard"
              : "Create a new account with protected personal budget isolation"}
          </p>

          {/* Database User Capacity Indicator */}
          <div
            className={`capacity-badge ${capacity.isFull ? "full" : ""}`}
            title={`Database limit: Maximum ${capacity.limit} users permitted`}
          >
            <span className="capacity-dot"></span>
            <span>
              {capacity.isFull
                ? `Capacity Full: ${capacity.count} / ${capacity.limit} Users`
                : `User Capacity: ${capacity.count} / ${capacity.limit} Registered`}
            </span>
          </div>
        </div>

        {/* Mode Switcher Tabs (Sign In / Sign Up) */}
        <div className="login-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signin"}
            className={`login-tab ${mode === "signin" ? "active" : ""}`}
            onClick={() => switchMode("signin")}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
            className={`login-tab ${mode === "signup" ? "active" : ""}`}
            onClick={() => switchMode("signup")}
          >
            Create Account
          </button>
        </div>

        {/* Capacity Warning Banner if Limit Reached in Signup Mode */}
        {mode === "signup" && capacity.isFull && (
          <div className="login-warning-banner" role="alert">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Registration limit reached: 100/100 users. Please sign in with an existing account.</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="login-error-banner" role="alert">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="login-username">Username</label>
            <div className="login-input-wrap">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18" className="login-input-icon">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <input
                id="login-username"
                type="text"
                placeholder={mode === "signin" ? "Enter your username" : "Choose a unique username"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus={!username}
                required
                autoComplete="username"
                disabled={isLoading}
              />
            </div>
            {mode === "signup" && (
              <span className="login-field-hint">3–30 characters, letters, numbers, and underscores</span>
            )}
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <div className="login-input-wrap">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18" className="login-input-icon">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder={mode === "signin" ? "Enter your password" : "Create password (min 6 chars)"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                disabled={isLoading}
              />
              <button
                type="button"
                className="login-toggle-pw"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? "👁️" : "🙈"}
              </button>
            </div>
          </div>

          {mode === "signup" && (
            <div className="login-field">
              <label htmlFor="login-confirm-password">Confirm Password</label>
              <div className="login-input-wrap">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18" className="login-input-icon">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <input
                  id="login-confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          <div className="login-options-row">
            <label className="login-remember-label">
              <input
                type="checkbox"
                className="login-remember-checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              <span>Remember me</span>
            </label>
          </div>

          <button
            type="submit"
            className="login-submit-btn"
            disabled={isLoading || (mode === "signup" && capacity.isFull)}
          >
            {isLoading ? (
              <span className="login-spinner-wrap">
                <span className="login-spinner"></span>
                <span>{mode === "signin" ? "Signing In..." : "Creating Account..."}</span>
              </span>
            ) : (
              <span>{mode === "signin" ? "Sign In" : "Create Account"}</span>
            )}
          </button>
        </form>

        {/* Footer switch prompt */}
        <div className="login-footer">
          {mode === "signin" ? (
            <span>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="login-switch-link"
                onClick={() => switchMode("signup")}
              >
                Sign Up
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{" "}
              <button
                type="button"
                className="login-switch-link"
                onClick={() => switchMode("signin")}
              >
                Sign In
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
