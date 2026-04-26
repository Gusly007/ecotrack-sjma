import { useAuth } from '../../context/AuthContext';
import DesktopLayout from './DesktopLayout';

export function RoleBasedLayout({ children }) {
  const { user } = useAuth();
  const role = user?.role || user?.role_par_defaut;

  return (
    <DesktopLayout>
      {children}
    </DesktopLayout>
  );
}
