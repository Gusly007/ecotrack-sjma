import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { RoleBasedLayout } from './components/desktop/RoleBasedLayout';
import MobileLayout from './components/mobile/MobileLayout';
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

// Desktop - Admin (lazy: pas chargé sur la landing page)
const AdminDashboard = lazy(() => import('./pages/desktop/admin/Dashboard'));
const RolesPage = lazy(() => import('./pages/desktop/admin/Roles'));
const UsersPage = lazy(() => import('./pages/desktop/admin/Users'));
const CreateUserPage = lazy(() => import('./pages/desktop/admin/CreateUser'));
const UserDetailPage = lazy(() => import('./pages/desktop/admin/UserDetail'));
const ConteneursPage = lazy(() => import('./pages/desktop/admin/Conteneurs'));
const ZonesPage = lazy(() => import('./pages/desktop/admin/Zones'));
const SignalementsPage = lazy(() => import('./pages/desktop/admin/Signalements'));
const SignalementDetailPage = lazy(() => import('./pages/desktop/admin/SignalementDetail'));
const AlertsPage = lazy(() => import('./pages/desktop/admin/Alerts'));
const LogsPage = lazy(() => import('./pages/desktop/admin/Logs'));
const MonitoringPage = lazy(() => import('./pages/desktop/admin/Monitoring'));
const ConfigurationPage = lazy(() => import('./pages/desktop/admin/Configuration'));
const DesktopNotificationsPage = lazy(() => import('./pages/desktop/NotificationsPage'));

// Desktop - Gestionnaire (lazy)
const GestionnaireDashboard = lazy(() => import('./pages/desktop/gestionnaire/GestionnaireDashboard'));
const GestionnaireTourneePage = lazy(() => import('./pages/desktop/gestionnaire/tournee'));
const GestionnaireKpisPage = lazy(() => import('./pages/desktop/gestionnaire/KpiPage'));
const MaintenancePage = lazy(() => import('./pages/desktop/gestionnaire/MaintenancePage'));
const RapportsPage = lazy(() => import('./pages/desktop/gestionnaire/RapportsPage'));
const SuiviTempsReelPage = lazy(() => import('./pages/desktop/gestionnaire/SuiviTempsReelPage'));

// Mobile - Agent (lazy)
const AgentDashboard = lazy(() => import('./pages/mobile/agent/AgentDashboard'));
const AgentTourneePage = lazy(() => import('./pages/mobile/agent/TourneePage'));
const EtapeDetail = lazy(() => import('./pages/mobile/agent/EtapeDetail'));
const ScanPage = lazy(() => import('./pages/mobile/agent/ScanPage'));
const ScanResult = lazy(() => import('./pages/mobile/agent/ScanResult'));
const AnomaliePage = lazy(() => import('./pages/mobile/agent/AnomaliePage'));
const AnomalieForm = lazy(() => import('./pages/mobile/agent/AnomalieForm'));
const TerminerTournee = lazy(() => import('./pages/mobile/agent/TerminerTournee'));
const AgentHistorique = lazy(() => import('./pages/mobile/agent/HistoriquePage'));
const AgentStats = lazy(() => import('./pages/mobile/agent/StatsPage'));

// Mobile - Shared (lazy)
const ProfilPage = lazy(() => import('./pages/mobile/shared/ProfilPage'));
const EditProfilPage = lazy(() => import('./pages/mobile/shared/EditProfilPage'));
const NotificationsPage = lazy(() => import('./pages/mobile/shared/NotificationsPage'));
const NotificationSettings = lazy(() => import('./pages/mobile/shared/NotificationSettings'));
const QRCodePage = lazy(() => import('./pages/QRCodePage'));
const SharedScanPage = lazy(() => import('./pages/mobile/shared/ScanPage'));
const SharedScanResult = lazy(() => import('./pages/mobile/shared/ScanResult'));

// Mobile Citoyen App (lazy pour les vues non-critiques)
import CitoyenMobileLayout from './pages/mobile/citoyen/MobileLayout';
import CitoyenHome from './pages/mobile/citoyen/CitoyenHome';
const CitoyenMap = lazy(() => import('./pages/mobile/citoyen/CitoyenMap'));
const CitoyenScanner = lazy(() => import('./pages/mobile/citoyen/CitoyenScanner'));
const CitoyenSignaler = lazy(() => import('./pages/mobile/citoyen/CitoyenSignaler'));
const CitoyenSignalerSuccess = lazy(() => import('./pages/mobile/citoyen/CitoyenSignalerSuccess'));
const CitoyenMesSignalements = lazy(() => import('./pages/mobile/citoyen/CitoyenMesSignalements'));
const CitoyenSignalementDetail = lazy(() => import('./pages/mobile/citoyen/CitoyenSignalementDetail'));
const CitoyenDefis = lazy(() => import('./pages/mobile/citoyen/CitoyenDefis'));
const CitoyenProfil = lazy(() => import('./pages/mobile/citoyen/CitoyenProfil'));
const CitoyenEditProfil = lazy(() => import('./pages/mobile/citoyen/CitoyenEditProfil'));
const CitoyenNotifications = lazy(() => import('./pages/mobile/citoyen/CitoyenNotifications'));
const CitoyenTri = lazy(() => import('./pages/mobile/citoyen/CitoyenTri'));
const CitoyenPointsHistorique = lazy(() => import('./pages/mobile/citoyen/CitoyenPointsHistorique'));
import CitoyenLogin from './pages/mobile/citoyen/CitoyenLogin';
import CitoyenRegister from './pages/mobile/citoyen/CitoyenRegister';
import CitoyenLanding from './pages/mobile/citoyen/CitoyenLanding';
import CitoyenForgotPassword from './pages/mobile/citoyen/CitoyenForgotPassword';
import CitoyenResetPassword from './pages/mobile/citoyen/CitoyenResetPassword';
import { CitoyenAuthProvider } from './pages/mobile/citoyen/auth/CitoyenAuthContext';
import { CitoyenProtectedRoute } from './components/mobile/citoyen/CitoyenProtectedRoute';
function RootRedirect() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <CitoyenLanding />;
  }

  const role = user?.role || user?.role_par_defaut;

  if (role === 'CITOYEN') return <Navigate to="/citoyen" replace />;
  if (role === 'AGENT') return <Navigate to="/agent" replace />;
  if (role === 'GESTIONNAIRE') return <Navigate to="/gestionnaire" replace />;
  return <Navigate to="/admin" replace />;
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <CookieBanner />
        <Suspense fallback={<div style={{ display: 'none' }} aria-hidden="true" />}>
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

          {/* Mobile Routes - Agent (role-gated) */}
          <Route path="/agent" element={<ProtectedRoute requiredRole="AGENT"><AgentDashboard /></ProtectedRoute>} />
          <Route path="/agent/tournee" element={<ProtectedRoute requiredRole="AGENT"><AgentTourneePage /></ProtectedRoute>} />
          <Route path="/agent/tournee/etape/:id" element={<ProtectedRoute requiredRole="AGENT"><EtapeDetail /></ProtectedRoute>} />
          <Route path="/agent/scan" element={<ProtectedRoute requiredRole="AGENT"><ScanPage /></ProtectedRoute>} />
          <Route path="/agent/scan/result/:uid" element={<ProtectedRoute requiredRole="AGENT"><ScanResult /></ProtectedRoute>} />
          <Route path="/agent/anomalie" element={<ProtectedRoute requiredRole="AGENT"><AnomaliePage /></ProtectedRoute>} />
          <Route path="/agent/anomalie/form" element={<ProtectedRoute requiredRole="AGENT"><AnomalieForm /></ProtectedRoute>} />
          <Route path="/agent/tournee/terminer" element={<ProtectedRoute requiredRole="AGENT"><TerminerTournee /></ProtectedRoute>} />
          <Route path="/agent/historique" element={<ProtectedRoute requiredRole="AGENT"><AgentHistorique /></ProtectedRoute>} />
          <Route path="/agent/stats" element={<ProtectedRoute requiredRole="AGENT"><AgentStats /></ProtectedRoute>} />
          <Route path="/agent/profil" element={<ProtectedRoute requiredRole="AGENT"><ProfilPage basePath="/agent" /></ProtectedRoute>} />
          <Route path="/agent/profil/edit" element={<ProtectedRoute requiredRole="AGENT"><EditProfilPage basePath="/agent" /></ProtectedRoute>} />
          <Route path="/agent/notifications" element={<ProtectedRoute requiredRole="AGENT"><NotificationsPage basePath="/agent" /></ProtectedRoute>} />
          <Route path="/agent/notifications/settings" element={<ProtectedRoute requiredRole="AGENT"><NotificationSettings basePath="/agent" /></ProtectedRoute>} />

          {/* Public QR Codes Page - no auth required */}
          <Route path="/qr-codes" element={<QRCodePage />} />

          {/* Universal Scan Routes - accessible to all roles */}
          <Route path="/scan" element={<ProtectedRoute><SharedScanPage /></ProtectedRoute>} />
          <Route path="/scan/result/:uid" element={<ProtectedRoute><SharedScanResult /></ProtectedRoute>} />
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
                <GestionnaireTourneePage />
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
                <DesktopNotificationsPage />
              </RoleBasedLayout>
            </ProtectedRoute>
          } />
          <Route path="/gestionnaire/notifications" element={
            <ProtectedRoute>
              <RoleBasedLayout>
                <DesktopNotificationsPage />
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
            <Route path="/citoyen" element={<CitoyenProtectedRoute><CitoyenMobileLayout /></CitoyenProtectedRoute>}>
              <Route index element={<CitoyenHome />} />
              <Route path="carte" element={<Suspense fallback={null}><CitoyenMap /></Suspense>} />
              <Route path="signaler" element={<CitoyenSignaler />} />
              <Route path="signaler/success" element={<CitoyenSignalerSuccess />} />
              <Route path="scanner" element={<Suspense fallback={null}><CitoyenScanner /></Suspense>} />
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
                <p className="text-gray-600">Vous n'avez pas accÃ¨s Ã  cette page</p>
                <a href="/login" className="text-green-600 hover:underline">Retour Ã  la connexion</a>
              </div>
            </div>
          } />
        </Routes>
        </Suspense>
      </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
