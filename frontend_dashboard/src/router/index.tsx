import { createBrowserRouter, Navigate } from 'react-router-dom';
import React, { Suspense } from 'react';
import { AuthLayout } from '../layouts/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';

import { StudentLogin } from '../features/auth/StudentLogin';
import { PlaceholderView } from '../components/common/PlaceholderView';
import { LiveMap } from '../features/student/LiveMap';
import { StudentRoutesView } from '../features/student/StudentRoutesView';
import { StudentSchedulesView } from '../features/student/StudentSchedulesView';
import { StudentSettingsView } from '../features/student/StudentSettingsView';
import { DriverLogin } from '../features/auth/DriverLogin';
import { DriverLiveMap } from '../features/driver/DriverLiveMap';
import { DriverOccupancy } from '../features/driver/DriverOccupancy';
import { DriverSettings } from '../features/driver/DriverSettings';
import { AdminLogin } from '../features/auth/AdminLogin';
import { SuperAdminLogin } from '../features/auth/SuperAdminLogin';
import { OtpVerification } from '../features/auth/OtpVerification';
import { RouteSelection } from '../features/auth/RouteSelection';

import { StudentsView } from '../features/admin/StudentsView';
import { DriversView } from '../features/admin/DriversView';
import { RoutesView } from '../features/admin/RoutesView';
import { BusesView } from '../features/admin/BusesView';
import { StopsView } from '../features/admin/StopsView';
import { FleetLiveMap } from '../features/admin/FleetLiveMap';

import { FeeDashboard } from '../features/payment/FeeDashboard';
import { AdminFeePanel } from '../features/admin/AdminFeePanel';
import { NotificationCenter } from '../features/notifications/NotificationCenter';
import { EtaPrediction } from '../features/analytics/EtaPrediction';

import { FinanceDashboard } from '../features/finance/FinanceDashboard';
import { PaymentLedger } from '../features/finance/PaymentLedger';
import { RefundManagement } from '../features/finance/RefundManagement';
import { FinanceSettings } from '../features/finance/FinanceSettings';
import { AuditLogs } from '../features/finance/AuditLogs';


import { StudentGuard } from './guards/StudentGuard';
import { DriverGuard } from './guards/DriverGuard';
import { AdminGuard } from './guards/AdminGuard';
import { SuperAdminGuard } from './guards/SuperAdminGuard';

// Route-Level Code Splitting (Lazy Loading)
const StudentDashboard = React.lazy(() => import('../features/student/StudentDashboard').then(m => ({ default: m.StudentDashboard })));
const DriverDashboard = React.lazy(() => import('../features/driver/DriverDashboard').then(m => ({ default: m.DriverDashboard })));
const AdminDashboard = React.lazy(() => import('../features/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const SuperAdminDashboard = React.lazy(() => import('../features/superadmin/SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard })));

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={
    <div className="flex h-screen w-full items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  }>
    {children}
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/auth/student" replace />,
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'student', element: <StudentLogin /> },
      { path: 'driver', element: <DriverLogin /> },
      { path: 'admin', element: <AdminLogin /> },
      { path: 'superadmin', element: <SuperAdminLogin /> },
      { path: 'verify-otp', element: <OtpVerification /> },
      { path: 'route-selection', element: <RouteSelection /> },
    ],
  },
  {
    path: '/student',
    element: <DashboardLayout />,
    children: [
      {
        element: <StudentGuard />,
        children: [
          { path: 'dashboard', element: <SuspenseWrapper><StudentDashboard /></SuspenseWrapper> },
          { path: 'map', element: <LiveMap /> },
          { path: 'routes', element: <StudentRoutesView /> },
          { path: 'schedules', element: <StudentSchedulesView /> },
          { path: 'fees', element: <FeeDashboard /> },
          { path: 'notifications', element: <NotificationCenter /> },
          { path: 'settings', element: <StudentSettingsView /> },
        ],
      },
    ],
  },
  {
    path: '/driver',
    element: <DashboardLayout />,
    children: [
      {
        element: <DriverGuard />,
        children: [
          { path: 'dashboard', element: <SuspenseWrapper><DriverDashboard /></SuspenseWrapper> },
          { path: 'route', element: <DriverLiveMap /> },
          { path: 'occupancy', element: <DriverOccupancy /> },
          { path: 'settings', element: <DriverSettings /> },
        ],
      },
    ],
  },
  {
    path: '/admin',
    element: <DashboardLayout />,
    children: [
      {
        element: <AdminGuard />,
        children: [
          { path: 'dashboard', element: <SuspenseWrapper><AdminDashboard /></SuspenseWrapper> },
          { path: 'map', element: <FleetLiveMap /> },
          { path: 'students', element: <StudentsView /> },
          { path: 'drivers', element: <DriversView /> },
          { path: 'routes', element: <RoutesView /> },
          { path: 'buses', element: <BusesView /> },
          { path: 'stops', element: <StopsView /> },
          { path: 'fees', element: <AdminFeePanel /> },
          { path: 'finance', element: <FinanceDashboard /> },
          { path: 'finance/ledger', element: <PaymentLedger /> },
          { path: 'finance/refunds', element: <RefundManagement /> },
          { path: 'finance/settings', element: <FinanceSettings /> },
          { path: 'finance/audit', element: <AuditLogs /> },
        ],
      },
    ],
  },

  {
    path: '/superadmin',
    element: <DashboardLayout />,
    children: [
      {
        element: <SuperAdminGuard />,
        children: [
          { path: 'dashboard', element: <SuspenseWrapper><SuperAdminDashboard /></SuspenseWrapper> },
          { path: 'admins', element: <PlaceholderView title="Admin Management" /> },
          { path: 'analytics', element: <EtaPrediction /> },
          { path: 'settings', element: <PlaceholderView title="System Settings" /> },
        ],
      },
    ],
  },
  {
    path: '/unauthorized',
    element: (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">403</h1>
          <p className="text-slate-500 mt-2">You do not have permission to view this page.</p>
        </div>
      </div>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
