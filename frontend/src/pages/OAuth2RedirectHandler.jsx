import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { authApi } from '../api';

export default function OAuth2RedirectHandler() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (token) {
      localStorage.setItem('token', token);
      authApi.me()
        .then((res) => {
          login(token, res.data);
          toast.success('Successfully logged in with Google!');
          navigate('/', { replace: true });
        })
        .catch((err) => {
          console.error('Google login error:', err);
          toast.error(err.response?.data?.message || 'Failed to login with Google.');
          navigate('/login', { replace: true });
        });
    } else {
      toast.error(error || 'Authentication failed');
      navigate('/login', { replace: true });
    }
  }, [navigate, login]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <h2>Logging you in...</h2>
    </div>
  );
}
