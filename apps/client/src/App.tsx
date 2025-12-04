import { useState, useEffect } from "react";
import { authService } from "./services/authService";
import type { User } from "./services/authService";
import LeadDetail from "./components/LeadDetail";
import LeadList from "./components/LeadList";

import './App.css';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isExcel, setIsExcel] = useState(false);

  const [isSiteUnlocked, setIsSiteUnlocked] = useState(() => {
    return sessionStorage.getItem("leads_site_unlocked") === "true";
  });
  const [sitePassword, setSitePassword] = useState("");
  const [siteError, setSiteError] = useState<string | null>(null);

  // Login Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if running in Excel
    if (typeof Office !== "undefined" && Office.context && Office.context.host === Office.HostType.Excel) {
      setIsExcel(true);
    }

    // Check for existing session
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const loggedInUser = authService.login(email, password);
    if (loggedInUser) {
      authService.setCurrentUser(loggedInUser);
      setUser(loggedInUser);
    } else {
      setError("Invalid email or password.");
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setEmail("");
    setPassword("");
  };

  const handleSiteUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (sitePassword === "Mazen") {
      setIsSiteUnlocked(true);
      sessionStorage.setItem("leads_site_unlocked", "true");
      setSiteError(null);
    } else {
      setSiteError("Incorrect site password.");
    }
  };

  if (!isSiteUnlocked) {
    return (
      <div className="App login-page">
        <div className="login-container">
          <div className="login-header">
            <h1>Protected System</h1>
            <p style={{ marginTop: '0.5rem' }}>Enter site password to proceed.</p>
          </div>
          <form onSubmit={handleSiteUnlock} className="login-form">
            <div className="form-group">
              <label>Site Password</label>
              <input
                type="password"
                placeholder="•••••"
                value={sitePassword}
                onChange={e => setSitePassword(e.target.value)}
                required
                autoFocus
              />
            </div>
            {siteError && <div className="error-message">{siteError}</div>}
            <button type="submit" className="primary full-width">Unlock Access</button>
          </form>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="App login-page">
        <div className="login-container">
          <div className="login-header">
            <h1>AMPAC LEADS</h1>
          </div>
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="name@ampac.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" className="primary full-width">Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="app-bar">
        <div className="user-info">
          <span className="user-name">{user.name}</span>
          <span className="user-title">{user.title}</span>
        </div>
        <button onClick={handleLogout} className="logout-btn">Sign Out</button>
      </div>
      {isExcel ? <LeadDetail /> : <LeadList />}
    </div>
  );
}

export default App;
