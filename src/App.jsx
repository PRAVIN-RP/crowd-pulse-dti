import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useDashboard } from './context/DashboardContext';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Login from './pages/Login';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function AppContent() {
  const { isAuthenticated } = useAuth();
  
  // Conditionally apply dark mode since DashboardProvider requires Auth token
  const dashboard = isAuthenticated ? useDashboard() : null;
  const isDark = dashboard?.darkMode || false;
  
  // Set theme on body to override root completely
  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDark]);
  
  return (
    <div className="layout-container">
      {isAuthenticated && <Sidebar />}
      <main className="main-content" style={{ padding: isAuthenticated ? '2rem' : '0' }}>
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}>
              <Admin />
            </ProtectedRoute>
          } />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;
