import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../constants/roles';

export const MainLayout = () => {
  const { user, logout, isMobileUser, isDesktopUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-green-600">
                EcoTrack
              </Link>
              {isMobileUser && (
                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                  Mobile
                </span>
              )}
              {isDesktopUser && (
                <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                  Desktop
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user?.role && ROLE_LABELS[user.role]}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};
