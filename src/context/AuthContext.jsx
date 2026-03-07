import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check local storage for existing session
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (role, username, password) => {
    try {
      // Fallback for our UI buttons if they don't provide explicit credentials
      const loginUser = username || (role === 'admin' ? 'admin' : 'user');
      const loginPass = password || 'password';

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser, password: loginPass })
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data);
        localStorage.setItem('auth_user', JSON.stringify(data));
        
        // Redirect to intended page or dashboard
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
        return { success: true };
      } else {
        alert(data.message || 'Login failed');
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error("Login error", error);
      alert('Could not connect to backend server. Is it running?');
      return { success: false, message: 'Server error' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data);
        localStorage.setItem('auth_user', JSON.stringify(data));
        
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
        return { success: true };
      } else {
        alert(data.message || 'Registration failed');
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error("Registration error", error);
      alert('Could not connect to backend server. Is it running?');
      return { success: false, message: 'Server error' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
    navigate('/login', { replace: true });
  };

  if (loading) {
    return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
};
