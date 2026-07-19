import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { authApi } from '../api';

export default function OAuth2RedirectHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const fetchUser = async (token) => {
      try {
        // Set the token temporarily to fetch user profile, or assume the backend provided user info.
        // Usually, we just call an endpoint like /api/auth/me to get the user using the token.
        // Let's assume we have authApi.getMe() or similar.
        // But the useAuth login(token, user) needs the user object.
        // Let's just store token and fetch user.
        localStorage.setItem('token', token);
        // We might need to fetch the profile. Let's see how login is implemented.
        const res = await authApi.me(); 
        login(token, res.data);
        navigate('/');
        toast.success('Successfully logged in with Google!');
      } catch (err) {
        toast.error('Failed to login with Google.');
        navigate('/login');
      }
    };

    const getUrlParameter = (name) => {
      name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
      var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
      var results = regex.exec(location.search);
      return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    };

    const token = getUrlParameter('token');
    const error = getUrlParameter('error');

    if (token) {
      fetchUser(token);
    } else {
      toast.error(error || 'Authentication failed');
      navigate('/login');
    }
  }, [location, navigate, login]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <h2>Logging you in...</h2>
    </div>
  );
}
