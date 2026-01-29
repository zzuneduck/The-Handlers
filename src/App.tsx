import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { USER_ROLES } from './constants/roles';
import type { Role } from './types';

import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import DashboardLayout from './components/layout/DashboardLayout';

// Auth
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import LevelManagement from './pages/admin/LevelManagement';
import LevelHistory from './pages/admin/LevelHistory';
import TeamManagement from './pages/admin/TeamManagement';
import ConsultationManagement from './pages/admin/ConsultationManagement';
import HardwareManagement from './pages/admin/HardwareManagement';
import NoticeManagement from './pages/admin/NoticeManagement';
import PermissionSettings from './pages/admin/PermissionSettings';
import AdminStatistics from './pages/admin/Statistics';

// Handler
import HandlerDashboard from './pages/handler/Dashboard';
import ConsultationForm from './pages/handler/ConsultationForm';
import MyConsultations from './pages/handler/MyConsultations';
import ConsultationStatus from './pages/handler/ConsultationStatus';
import HandlerProfile from './pages/handler/Profile';
import HandlerList from './pages/handler/HandlerList';
import SalesRecord from './pages/handler/SalesRecord';
import MySales from './pages/handler/MySales';
import StoreSearch from './pages/handler/StoreSearch';
import WriteSuccessStory from './pages/handler/WriteSuccessStory';
import HandlerStatistics from './pages/handler/Statistics';

// PayN
import PaynDashboard from './pages/payn/Dashboard';
import PaynConsultationList from './pages/payn/ConsultationList';
import PaynConsultationDetail from './pages/payn/ConsultationDetail';
import PaynStatistics from './pages/payn/Statistics';
import PaynRanking from './pages/payn/Ranking';

// Geotech
import GeotechDashboard from './pages/geotech/Dashboard';
import GeotechHardwareList from './pages/geotech/HardwareList';
import GeotechHardwareDetail from './pages/geotech/HardwareDetail';
import InstallSchedule from './pages/geotech/InstallSchedule';
import GeotechStatistics from './pages/geotech/Statistics';
import GeotechRanking from './pages/geotech/Ranking';

// Common
import LiveDashboard from './pages/common/LiveDashboard';
import Ranking from './pages/common/Ranking';
import HandlerMap from './pages/common/HandlerMap';
import StoreMap from './pages/common/StoreMap';
import Notice from './pages/common/Notice';
import QnA from './pages/common/QnA';
import SuccessStories from './pages/common/SuccessStories';
import PaynTips from './pages/common/PaynTips';
import FreeBoard from './pages/common/FreeBoard';
import UsefulLinks from './pages/common/UsefulLinks';
import SalesTemplates from './pages/common/SalesTemplates';
import PaynManual from './pages/common/PaynManual';
import GlobalSoundProvider from './components/common/GlobalSoundProvider';
import SoundToggle from './components/common/SoundToggle';
import NotFound from './pages/common/NotFound';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/ui/Toast';
import { useToast } from './hooks/useToast';

function AppRoutes() {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-naver border-t-transparent" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={user ? <Navigate to={USER_ROLES[user.role as Role].dashboard} /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to={USER_ROLES[user.role as Role].dashboard} /> : <RegisterPage />}
      />
      <Route
        path="/forgot-password"
        element={user ? <Navigate to={USER_ROLES[user.role as Role].dashboard} /> : <ForgotPassword />}
      />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>

          {/* Admin (super_admin + sub_admin) */}
          <Route element={<RoleRoute allowedRoles={['super_admin', 'sub_admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/levels" element={<LevelManagement />} />
            <Route path="/admin/levels/history" element={<LevelHistory />} />
            <Route path="/admin/teams" element={<TeamManagement />} />
            <Route path="/admin/consultations" element={<ConsultationManagement />} />
            <Route path="/admin/hardware" element={<HardwareManagement />} />
            <Route path="/admin/notices" element={<NoticeManagement />} />
            <Route path="/admin/statistics" element={<AdminStatistics />} />
          </Route>
          <Route element={<RoleRoute allowedRoles={['super_admin']} />}>
            <Route path="/admin/permissions" element={<PermissionSettings />} />
          </Route>

          {/* Handler */}
          <Route element={<RoleRoute allowedRoles={['super_admin', 'sub_admin', 'handler']} />}>
            <Route path="/handler" element={<HandlerDashboard />} />
            <Route path="/handler/consultation/new" element={<ConsultationForm />} />
            <Route path="/handler/consultations" element={<MyConsultations />} />
            <Route path="/handler/consultations/:id" element={<ConsultationStatus />} />
            <Route path="/handler/profile" element={<HandlerProfile />} />
            <Route path="/handler/handlers" element={<HandlerList />} />
            <Route path="/handler/sales/new" element={<SalesRecord />} />
            <Route path="/handler/sales" element={<MySales />} />
            <Route path="/handler/stores" element={<StoreSearch />} />
            <Route path="/handler/success-story/new" element={<WriteSuccessStory />} />
            <Route path="/handler/statistics" element={<HandlerStatistics />} />
          </Route>

          {/* PayN Staff */}
          <Route element={<RoleRoute allowedRoles={['super_admin', 'sub_admin', 'payn_staff']} />}>
            <Route path="/payn" element={<PaynDashboard />} />
            <Route path="/payn/consultations" element={<PaynConsultationList />} />
            <Route path="/payn/consultations/:id" element={<PaynConsultationDetail />} />
            <Route path="/payn/statistics" element={<PaynStatistics />} />
            <Route path="/payn/ranking" element={<PaynRanking />} />
          </Route>

          {/* Geotech Staff */}
          <Route element={<RoleRoute allowedRoles={['super_admin', 'sub_admin', 'geotech_staff']} />}>
            <Route path="/geotech" element={<GeotechDashboard />} />
            <Route path="/geotech/hardware" element={<GeotechHardwareList />} />
            <Route path="/geotech/hardware/:id" element={<GeotechHardwareDetail />} />
            <Route path="/geotech/schedule" element={<InstallSchedule />} />
            <Route path="/geotech/statistics" element={<GeotechStatistics />} />
            <Route path="/geotech/ranking" element={<GeotechRanking />} />
          </Route>

          {/* Common (all authenticated users) */}
          <Route path="/live" element={<LiveDashboard />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/handler-map" element={<HandlerMap />} />
          <Route path="/store-map" element={<StoreMap />} />
          <Route path="/notice" element={<Notice />} />
          <Route path="/qna" element={<QnA />} />
          <Route path="/success-stories" element={<SuccessStories />} />
          <Route path="/payn-tips" element={<PaynTips />} />
          <Route path="/free-board" element={<FreeBoard />} />
          <Route path="/useful-links" element={<UsefulLinks />} />
          <Route path="/sales-templates" element={<SalesTemplates />} />
          <Route path="/payn-manual" element={<PaynManual />} />

        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <ToastProvider>
        <GlobalSoundProvider>
          <AppRoutes />
          <SoundToggle />
        </GlobalSoundProvider>
        <ToastRenderer />
      </ToastProvider>
    </BrowserRouter>
  );
}

function ToastRenderer() {
  const { toasts, remove } = useToast();
  return <ToastContainer toasts={toasts} onRemove={remove} />;
}
