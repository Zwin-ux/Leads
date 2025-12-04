import { useState, useEffect } from "react";
import { authService } from "./services/authService";
import type { User } from "./services/authService";
import LeadDetail from "./components/LeadDetail";
import LeadList from "./components/LeadList";

import './App.css';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isExcel, setIsExcel] = useState(false);

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

  if (!user) {
    return (
      <div className="App login-page">
        <div className="login-container">
          <h1 style={{ color: '#000', marginBottom: '2rem', letterSpacing: '-0.05em' }}>AMPAC LEADS SITE</h1>
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label style={{ color: '#52525b' }}>Email</label>
              <input
                type="email"
                placeholder="name@ampac.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ background: '#fff', color: '#000', borderColor: '#e4e4e7' }}
              />
            </div>
            <div className="form-group">
              <label style={{ color: '#52525b' }}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ background: '#fff', color: '#000', borderColor: '#e4e4e7' }}
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" className="primary full-width" style={{ background: '#000', color: '#fff' }}>Sign In</button>
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
