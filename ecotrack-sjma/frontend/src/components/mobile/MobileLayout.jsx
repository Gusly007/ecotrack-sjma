import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MobileHeader from './MobileHeader';
import BottomNav from './BottomNav';
import { citoyenNavData } from './citoyenNavData';
import { agentNavData } from './agentNavData';
import './MobileLayout.css';

export default function MobileLayout({ children, title, showBack = false, onBack, rightAction }) {
  const { user } = useAuth();
  const location = useLocation();
  const role = user?.role || user?.role_par_defaut;

  const navData = role === 'AGENT' ? agentNavData : citoyenNavData;

  // Hide bottom nav on certain screens
  const hideNav = ['/scan', '/anomalie/form', '/tournee/terminer', '/signalement/success'].some(
    path => location.pathname.includes(path)
  );

  return (
    <div className="mobile-layout">
      <MobileHeader title={title} showBack={showBack} onBack={onBack} rightAction={rightAction} />
      <main className="mobile-content">
        {children}
      </main>
      {!hideNav && <BottomNav items={navData} />}
    </div>
  );
}
