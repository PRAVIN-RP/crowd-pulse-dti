import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Login from './pages/Login';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function AppContent() {
  const { isAuthenticated } = useAuth();
  
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
