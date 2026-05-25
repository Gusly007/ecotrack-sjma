import { useAuth } from '../../context/AuthContext';
import DesktopLayout from './DesktopLayout';
import { useNotifications } from '../../hooks/useNotifications';
import { useNotificationSound } from '../../hooks/useNotificationSound';

export function RoleBasedLayout({ children }) {
  const { user } = useAuth();
  const role = user?.role || user?.role_par_defaut;
  const { play } = useNotificationSound();
  useNotifications(30000, () => play('alert'));

  return (
    <DesktopLayout>
      {children}
    </DesktopLayout>
  );
}
