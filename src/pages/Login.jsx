import { useState } from 'react';
import { Shield, User, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('user'); // default to standard user view
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (isLogin) {
      const res = await login(role, username, password);
      if (!res.success) setErrorMsg(res.message);
    } else {
      const res = await register(username, password, role);
      if (!res.success) setErrorMsg(res.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background"></div>
      
      <div className="login-card glass-panel animate-fade-in">
        <div className="login-header">
          <Activity className="brand-icon mx-auto" size={48} />
          <h2 className="brand-title login-title">
            Smart<span className="text-gradient">Monitor</span>
          </h2>
          <p className="login-subtitle">
            {isLogin ? 'Sign in to access the dashboard' : 'Create a new operator account'}
          </p>
        </div>

        <div className="role-selector">
          <button 
            type="button"
            className={`role-btn ${role === 'user' ? 'active' : ''}`}
            onClick={() => setRole('user')}
          >
            <User size={18} />
            <span>Personnel</span>
          </button>
          <button 
            type="button"
            className={`role-btn ${role === 'admin' ? 'active' : ''}`}
            onClick={() => setRole('admin')}
          >
            <Shield size={18} />
            <span>Administrator</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group-col">
            <label>Username</label>
            <input 
              type="text" 
              className="input-field" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group-col">
            <label>Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {errorMsg && <p className="text-danger mt-1 text-sm">{errorMsg}</p>}

          <button type="submit" className="btn-primary w-full mt-2">
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="login-footer mt-4 text-center">
          <p className="text-sm">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              type="button" 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-primary ml-1 bg-transparent border-none cursor-pointer"
              style={{ fontWeight: 'bold' }}>
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
