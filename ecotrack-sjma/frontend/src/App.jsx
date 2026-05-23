import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { RoleBasedLayout } from './components/desktop/RoleBasedLayout';
import CookieBanner from './components/common/CookieBanner';
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import MfaPage from './pages/auth/MfaPage';
import TermsPage from './pages/auth/TermsPage';
import PrivacyPage from './pages/auth/PrivacyPage';
import LegalPage from './pages/auth/LegalPage';
import ActivateAccountPage from './pages/auth/ActivateAccountPage';
import ProfilePage from './pages/auth/ProfilePage';
import AdminDashboard from './pages/desktop/admin/Dashboard';
import RolesPage from './pages/desktop/admin/Roles';
import MaintenancePage from './pages/desktop/gestionnaire/MaintenancePage';
import RapportsPage from './pages/desktop/gestionnaire/RapportsPage';
import SuiviTempsReelPage from './pages/desktop/gestionnaire/SuiviTempsReelPage';
import UsersPage from './pages/desktop/admin/Users';
import CreateUserPage from './pages/desktop/admin/CreateUser';
import UserDetailPage from './pages/desktop/admin/UserDetail';
import ConteneursPage from './pages/desktop/admin/Conteneurs';
import ZonesPage from './pages/desktop/admin/Zones';
import SignalementsPage from './pages/desktop/admin/Signalements';
import SignalementDetailPage from './pages/desktop/admin/SignalementDetail';
import AlertsPage from './pages/desktop/admin/Alerts';
import LogsPage from './pages/desktop/admin/Logs';
import MonitoringPage from './pages/desktop/admin/Monitoring';
import ConfigurationPage from './pages/desktop/admin/Configuration';
import NotificationsPage from './pages/desktop/NotificationsPage';

import GestionnaireDashboard from './pages/desktop/gestionnaire/GestionnaireDashboard';
import TourneePage from './pages/desktop/gestionnaire/tournee';
import GestionnaireKpisPage from './pages/desktop/gestionnaire/KpiPage';

// Mobile Citoyen App — module feature isolé sous pages/mobile/citoyen/
import MobileLayout from './pages/mobile/citoyen/MobileLayout';
import CitoyenHome from './pages/mobile/citoyen/CitoyenHome';
import CitoyenMap from './pages/mobile/citoyen/CitoyenMap';
import CitoyenSignaler from './pages/mobile/citoyen/CitoyenSignaler';
import CitoyenSignalerSuccess from './pages/mobile/citoyen/CitoyenSignalerSuccess';
import CitoyenScanner from './pages/mobile/citoyen/CitoyenScanner';
import CitoyenMesSignalements from './pages/mobile/citoyen/CitoyenMesSignalements';
import CitoyenSignalementDetail from './pages/mobile/citoyen/CitoyenSignalementDetail';
import CitoyenDefis from './pages/mobile/citoyen/CitoyenDefis';
import CitoyenProfil from './pages/mobile/citoyen/CitoyenProfil';
import CitoyenEditProfil from './pages/mobile/citoyen/CitoyenEditProfil';
import CitoyenNotifications from './pages/mobile/citoyen/CitoyenNotifications';
import CitoyenTri from './pages/mobile/citoyen/CitoyenTri';
import CitoyenPointsHistorique from './pages/mobile/citoyen/CitoyenPointsHistorique';
import CitoyenLogin from './pages/mobile/citoyen/CitoyenLogin';
import CitoyenRegister from './pages/mobile/citoyen/CitoyenRegister';
import CitoyenLanding from './pages/mobile/citoyen/CitoyenLanding';
import CitoyenForgotPassword from './pages/mobile/citoyen/CitoyenForgotPassword';
import CitoyenResetPassword from './pages/mobile/citoyen/CitoyenResetPassword';
import { CitoyenAuthProvider } from './pages/mobile/citoyen/auth/CitoyenAuthContext';
import { CitoyenProtectedRoute } from './components/mobile/citoyen/CitoyenProtectedRoute';

// Routage de la racine /. Authentifié : redirection role-based comme avant.
// Visiteur anonyme : page d'atterrissage citoyen (deux cartes — citoyen /
// personnel) au lieu de tomber sur /login partagé, qui n'expose pas
// l'inscription citoyen.
function RootRedirect() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <CitoyenLanding />;
  }

  const role = user?.role || user?.role_par_defaut;

  if (role === 'CITOYEN') {
    return <Navigate to="/citoyen" replace />;
  }
  if (role === 'GESTIONNAIRE') {
    return <Navigate to="/gestionnaire" replace />;
  }
  return <Navigate to="/admin" replace />;
}

function App() {
  return (
    <AuthProvider>
      <CookieBanner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/activate" element={<ActivateAccountPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/mfa" element={<MfaPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/legal" element={<LegalPage />} />
          {/* Desktop Routes (Admin & Gestionnaire) */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <RoleBasedLayout>
                <AdminDashboard />
              </RoleBasedLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute>
              <RoleBasedLayout>
                <UsersPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/users/create" element={
            <ProtectedRoute>
              <RoleBasedLayout>
                <CreateUserPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/users/:id" element={
            <ProtectedRoute>
              <RoleBasedLayout>
                <UserDetailPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/roles" element={
            <ProtectedRoute>
              <RoleBasedLayout>
                <RolesPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/zones" element={
            <ProtectedRoute>
              <RoleBasedLayout>
                <ZonesPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/conteneurs" element={
            <ProtectedRoute>
              <RoleBasedLayout>
                <ConteneursPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/signalements" element={
            <ProtectedRoute>
              <RoleBasedLayout>
                <SignalementsPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/signalements/:id" element={
            <ProtectedRoute>
              <RoleBasedLayout>
                <SignalementDetailPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/alerts" element={
            <ProtectedRoute>
              <RoleBasedLayout>
                <AlertsPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/logs" element={
            <ProtectedRoute>
              <RoleBasedLayout>
                <LogsPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/monitoring" element={
            <ProtectedRoute>
              <RoleBasedLayout>
                <MonitoringPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/config" element={
            <ProtectedRoute>
              <RoleBasedLayout>
                <ConfigurationPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          } />

          {/* Routes Gestionnaire */}
          <Route path="/gestionnaire" element={
            <ProtectedRoute>
              <RoleBasedLayout>
                <GestionnaireDashboard />
              </RoleBasedLayout>
            </ProtectedRoute>
          } />
          <Route path="/gestionnaire/tournees" element={
            <ProtectedRoute>
              <RoleBasedLayout>
                <TourneePage />
              </RoleBasedLayout>
            </ProtectedRoute>
          } />
          <Route path="/gestionnaire/suivi" element={
            <ProtectedRoute>
              <RoleBasedLayout>
                <SuiviTempsReelPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          } />
          <Route path="/gestionnaire/zones" element={
            <ProtectedRoute>
              <RoleBasedLayout>
                <ZonesPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          } />
          <Route path="/gestionnaire/conteneurs" element={
            <ProtectedRoute>
              <RoleBasedLayout>
                <ConteneursPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          } />
          <Route path="/gestionnaire/signalements" element={
            <ProtectedRoute>
              <RoleBasedLayout>
                <SignalementsPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          } />
          <Route path="/gestionnaire/signalements/:id" element={
            <ProtectedRoute>
              <RoleBasedLayout>
                <SignalementDetailPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          } />
          <Route path="/gestionnaire/kpis" element={
            <ProtectedRoute>
              <RoleBasedLayout>
                <GestionnaireKpisPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          } />
          <Route path="/gestionnaire/rapports" element={
            <ProtectedRoute>
              <RoleBasedLayout>
                <RapportsPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          } />
          <Route path="/gestionnaire/maintenance" element={
            <ProtectedRoute>
              <RoleBasedLayout>
                <MaintenancePage />
              </RoleBasedLayout>
            </ProtectedRoute>
          } />
          <Route path="/gestionnaire/*" element={
            <ProtectedRoute>
              <RoleBasedLayout>
                <GestionnaireDashboard />
              </RoleBasedLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin/notifications" element={
            <ProtectedRoute>
              <RoleBasedLayout>
                <NotificationsPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          } />
          <Route path="/gestionnaire/notifications" element={
            <ProtectedRoute>
              <RoleBasedLayout>
                <NotificationsPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <RoleBasedLayout>
                <ProfilePage />
              </RoleBasedLayout>
            </ProtectedRoute>
          } />

          {/* Routes Citoyen (Mobile) — CitoyenAuthProvider isolé */}
          <Route element={<CitoyenAuthProvider><Outlet /></CitoyenAuthProvider>}>
            <Route path="/citoyen/login" element={<CitoyenLogin />} />
            <Route path="/citoyen/inscription" element={<CitoyenRegister />} />
            <Route path="/citoyen/mot-de-passe-oublie" element={<CitoyenForgotPassword />} />
            <Route path="/citoyen/reset-password" element={<CitoyenResetPassword />} />
            <Route path="/citoyen" element={<CitoyenProtectedRoute><MobileLayout /></CitoyenProtectedRoute>}>
              <Route index element={<CitoyenHome />} />
              <Route path="carte" element={<CitoyenMap />} />
              <Route path="signaler" element={<CitoyenSignaler />} />
              <Route path="signaler/success" element={<CitoyenSignalerSuccess />} />
              <Route path="scanner" element={<CitoyenScanner />} />
              <Route path="signalements" element={<CitoyenMesSignalements />} />
              <Route path="signalements/:id" element={<CitoyenSignalementDetail />} />
              <Route path="defis" element={<CitoyenDefis />} />
              <Route path="profil" element={<CitoyenProfil />} />
              <Route path="profil/modifier" element={<CitoyenEditProfil />} />
              <Route path="notifications" element={<CitoyenNotifications />} />
              <Route path="tri" element={<CitoyenTri />} />
              <Route path="boutique" element={<Navigate to="/citoyen/defis" replace />} />
              <Route path="points-historique" element={<CitoyenPointsHistorique />} />
              <Route path="*" element={<CitoyenHome />} />
            </Route>
          </Route>

          {/* Visiteur anonyme → landing citoyen ; authentifié → redirect par rôle */}
          <Route path="/" element={<RootRedirect />} />

          <Route path="/dashboard" element={<Navigate to="/admin" replace />} />

          <Route path="/unauthorized" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-red-600 mb-4">403</h1>
                <p className="text-gray-600">Vous n'avez pas accès à cette page</p>
                <a href="/login" className="text-green-600 hover:underline">Retour à la connexion</a>
              </div>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
