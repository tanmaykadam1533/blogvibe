import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { authApi, getErrorMessage } from '../api';

export default function OAuth2RedirectHandler() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (token) {
      localStorage.setItem('token', token);
      authApi.me()
        .then((res) => {
          login(token, res.data);
          toast.success('Successfully logged in with Google!');
          navigate('/', { replace: true });
        })
        .catch((err) => {
          console.error('Google login verification error:', err);
          localStorage.removeItem('token');
          const errMsg = getErrorMessage(err);
          navigate(`/login?error=${encodeURIComponent(errMsg)}`, { replace: true });
        });
    } else {
      const errMsg = error ? decodeURIComponent(error) : 'OAuth authentication failed.';
      navigate(`/login?error=${encodeURIComponent(errMsg)}`, { replace: true });
    }
  }, [searchParams, navigate, login]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '1rem' }}>
      <div className="spinner" style={{ width: '40px', height: '40px' }} />
      <h2 style={{ fontSize: '1.25rem', color: 'var(--text)' }}>Logging you in...</h2>
    </div>
  );
}
