import { useState, useEffect } from "react";
import { authService } from "./services/authService";
import type { User } from "./services/authService";
import LeadDetail from "./components/LeadDetail";
import LeadList from "./components/LeadList";
import { ProcessingQueueView } from "./views/ProcessingQueueView";
import { DevRoleSwitcher } from "./components/DevRoleSwitcher";
import { FeedbackWidget } from "./components/FeedbackWidget";
import OutlookSidecar from "./pages/OutlookSidecar";
import logo from "./assets/ampac-logo-v2.png";

import './App.css';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isExcel, setIsExcel] = useState(false);
  const [isOutlook] = useState(window.location.pathname === '/outlook');
  const [currentView, setCurrentView] = useState<'list' | 'processing'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    // Check if running in Excel
    if (typeof Office !== "undefined" && Office.context && Office.context.host === Office.HostType.Excel) {
      setIsExcel(true);
    }

    // Initialize auth and check for existing session
    const initAuth = async () => {
      try {
        await authService.initialize();
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const handleMicrosoftLogin = async () => {
    setLoginError(null);
    setIsLoading(true);
    try {
      const loggedInUser = await authService.login();
      if (loggedInUser) {
        setUser(loggedInUser);
      } else {
        setLoginError("Login was cancelled or failed.");
      }
    } catch (error: unknown) {
      console.error("Login error:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred during login.";
      setLoginError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setCurrentView("list");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="App login-page">
        <div className="login-container" style={{ textAlign: 'center' }}>
          <img src={logo} alt="AmPac Business Capital" style={{ height: '60px', marginBottom: '1rem' }} />
          <p style={{ color: '#94a3b8' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Login Screen
  if (!user) {
    return (
      <div className="App login-page">
        <div className="login-container">
          <div className="login-header">
            <img src={logo} alt="AmPac Business Capital" style={{ height: '60px', marginBottom: '1rem' }} />
            <p className="login-subtitle">AMPAC CRM</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
            <button
              onClick={handleMicrosoftLogin}
              className="primary full-width"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1.5rem',
                fontSize: '1rem'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
              </svg>
              Sign in with Microsoft
            </button>
          </div>

          {loginError && (
            <div className="error-message" style={{ marginTop: '1rem' }}>
              {loginError}
            </div>
          )}

          <p style={{
            fontSize: '0.8rem',
            color: '#64748b',
            textAlign: 'center',
            marginTop: '2rem'
          }}>
            Use your @ampac.com work account
          </p>
        </div>
      </div>
    );
  }

  const showProcessingBtn = user.role === 'admin' || user.role === 'processor' || user.role === 'manager';

  return (
    <div className="App">
      {/* Outlook Sidecar View - No App Bar */}
      {isOutlook ? (
        <OutlookSidecar />
      ) : (
        <>
          <div className="app-bar">
            {/* ... Existing App Bar ... */}
            <div className="logo-container" style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <img src={logo} alt="AmPac" style={{ height: '48px' }} onClick={() => setCurrentView('list')} className="cursor-pointer" />

              <div className="nav-links flex gap-4">
                <button
                  onClick={() => setCurrentView('list')}
                  className={`text-sm px-3 py-1 rounded ${currentView === 'list' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  Leads
                </button>

                {showProcessingBtn && (
                  <button
                    onClick={() => setCurrentView('processing')}
                    className={`text-sm px-3 py-1 rounded ${currentView === 'processing' ? 'bg-blue-600/20 text-blue-300' : 'text-gray-400 hover:text-white'}`}
                  >
                    Processing Queue
                  </button>
                )}
              </div>
            </div>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-title">{user.title}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">Sign Out</button>
          </div>

          {/* Content Area */}
          {isExcel ? (
            <LeadDetail /> // Minimal view for Excel
          ) : (
            currentView === 'processing' ? <ProcessingQueueView /> : <LeadList />
          )}

          <DevRoleSwitcher />
          <FeedbackWidget />
        </>
      )}
    </div>
  );
}

export default App;

