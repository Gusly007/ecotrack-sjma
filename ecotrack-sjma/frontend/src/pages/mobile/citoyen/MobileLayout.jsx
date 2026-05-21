import { Outlet } from 'react-router-dom';
import BottomNav from '../../../components/mobile/citoyen/BottomNav';
import './MobileLayout.css';

export default function MobileLayout() {
  return (
    <div className="mobile-layout">
      <div className="mobile-content">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
