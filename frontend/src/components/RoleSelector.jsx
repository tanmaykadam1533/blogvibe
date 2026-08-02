import { Link, useLocation } from 'react-router-dom';
import { User, Shield } from 'lucide-react';

export default function RoleSelector() {
  const location = useLocation();
  const isAdminPath = location.pathname === '/admin/login';

  return (
    <div className="role-selector-container">
      <div className="role-selector">
        <Link 
          to="/login" 
          className={`role-option ${!isAdminPath ? 'active' : ''}`}
        >
          <User size={18} />
          <span>User Portal</span>
        </Link>

        <Link 
          to="/admin/login" 
          className={`role-option admin ${isAdminPath ? 'active' : ''}`}
        >
          <Shield size={18} />
          <span>Admin Portal</span>
        </Link>
      </div>
    </div>
  );
}
