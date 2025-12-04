import { useState, useEffect } from "react";
import { authService } from "./services/authService";
import type { User } from "./services/authService";
import LeadDetail from "./components/LeadDetail";
import LeadList from "./components/LeadList";
import logo from "./assets/ampac-logo-v2.png";

import './App.css';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isExcel, setIsExcel] = useState(false);

  // Login Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Site Gate State
  const [isSiteUnlocked, setIsSiteUnlocked] = useState(false);
  const [sitePassword, setSitePassword] = useState("");
  const [siteError, setSiteError] = useState<string | null>(null);

  useEffect(() => {
    // Check if running in Excel
    if (typeof Office !== "undefined" && Office.context && Office.context.host === Office.HostType.Excel) {
      setIsExcel(true);
    }

    // Check for existing session
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setIsSiteUnlocked(true); // If user is logged in, site is unlocked
    } else {
      // Check if site is unlocked in session
      const unlocked = sessionStorage.getItem("leads_site_unlocked");
      if (unlocked === "true") {
        setIsSiteUnlocked(true);
      }
    }
  }, []);

  const handleSiteUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setSiteError(null);
    if (sitePassword.toLowerCase() === "mazen") {
      setIsSiteUnlocked(true);
      sessionStorage.setItem("leads_site_unlocked", "true");
    } else {
      setSiteError("Incorrect site password.");
    }
  };

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
    // We do NOT lock the site on logout, just the user session
  };

  // Step 1: Site Gate
  if (!isSiteUnlocked) {
    return (
      <div className="App login-page">
        <div className="login-container">
          <div className="login-header">
            <img src={logo} alt="AmPac Business Capital" style={{ height: '60px', marginBottom: '1rem' }} />
            <p className="login-subtitle">Restricted Access</p>
          </div>
          <form onSubmit={handleSiteUnlock} className="login-form">
            <div className="form-group">
              <label>Site Password</label>
              <input
                type="password"
                value={sitePassword}
                onChange={e => setSitePassword(e.target.value)}
                required
                autoComplete="off"
                placeholder="Enter site password..."
              />
            </div>
            {siteError && <div className="error-message">{siteError}</div>}
            <button type="submit" className="primary full-width">Unlock Access</button>
          </form>
        </div>
      </div>
    );
  }

  // Step 2: User Login
  if (!user) {
    return (
      <div className="App login-page">
        <div className="login-container">
          <div className="login-header">
            <img src={logo} alt="AmPac Business Capital" style={{ height: '60px', marginBottom: '1rem' }} />
            <p className="login-subtitle">Authorized Personnel Only</p>
          </div>
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="name@ampac.com"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
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
        <div className="logo-container" style={{ marginRight: 'auto', display: 'flex', alignItems: 'center' }}>
          <img src={logo} alt="AmPac" style={{ height: '48px' }} />
        </div>
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
