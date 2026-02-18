import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute, MobileRoute, DesktopRoute } from './components/common/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { MobileDashboard } from './pages/mobile/Dashboard';
import { DesktopDashboard } from './pages/desktop/Dashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route element={<MainLayout />}>
            <Route path="/" element={
              <Navigate to="/dashboard" replace />
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <MobileRoute>
                  <MobileDashboard />
                </MobileRoute>
              </ProtectedRoute>
            } />
            
            <Route path="/desktop" element={
              <ProtectedRoute>
                <DesktopRoute>
                  <DesktopDashboard />
                </DesktopRoute>
              </ProtectedRoute>
            } />
          </Route>

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
