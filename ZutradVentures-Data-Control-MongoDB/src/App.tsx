import { Routes, Route } from 'react-router';
import { useState } from 'react';
import { ProtectedRoute } from './components/ProtectedRoute';

import LoginPage from './pages/Login/LoginPage';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import AdminPage from './pages/Admin/AdminPage';
import AllUsers from './pages/Admin/AllUsers';
import AllClients from './pages/Admin/AllClients';
import ClientMachinesPage from './pages/ClientMachines/ClientMachinesPage';
import ReportsPage from './pages/Reports/ReportsPage';
import MaintenancePage from './pages/Maintenance/MaintenancePage';
import SupplyPage from './pages/SupplyPage/SupplyPage';
import StorePage from './pages/Store/StorePage';
import MacsaStorePage from './pages/Store/Macsa/MacsaStorePage';
import SavemaStorePage from './pages/Store/Savema/SavemaStorePage';
import SojetStorePage from './pages/Store/Sojet/SojetStorePage';
import BestCodeStorePage from './pages/Store/BestCode/BestCodeStorePage';
import NotFoundPage from './pages/NotFound/NotFoundPage';
import Invoices from './pages/ReceptionUploads/InvoicesPage';
import GrnsPage from './pages/ReceptionUploads/GrnsPage';
import PurchaseOrdersPage from './pages/ReceptionUploads/PurchaseOrdersPage';
import QuotationsPage from './pages/ReceptionUploads/QuotationsPage';

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <>
      <Routes>
        {/* ── Public routes — no login required ── */}
        <Route path='/' element={<LoginPage />} />
        <Route path='/passwordreset' element={<ForgotPassword />} />

        {/* ── Admin only ── */}
        <Route path='/admin' element={
          <ProtectedRoute page="admin">
            <AdminPage searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </ProtectedRoute>
        } />
        <Route path='/admin/users' element={
          <ProtectedRoute page="admin">
            <AllUsers searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </ProtectedRoute>
        } />
        <Route path='/admin/clients' element={
          <ProtectedRoute page="admin">
            <AllClients searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </ProtectedRoute>
        } />

        {/* ── Everyone ── */}
        <Route path='/clients' element={
          <ProtectedRoute page="clients">
            <ClientMachinesPage searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </ProtectedRoute>
        } />
        <Route path='/reports' element={
          <ProtectedRoute page="reports">
            <ReportsPage searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </ProtectedRoute>
        } />

        {/* ── Admin + Engineers (+ special permission) ── */}
        <Route path='/maintenance' element={
          <ProtectedRoute page="maintenance">
            <MaintenancePage searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </ProtectedRoute>
        } />

        {/* ── Admin + Receptionists (+ special permission) ── */}
        <Route path='/supply' element={
          <ProtectedRoute page="supply">
            <SupplyPage searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </ProtectedRoute>
        } />

        <Route path='/invoices' 
          element={<ProtectedRoute page="invoices">
            <Invoices searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </ProtectedRoute>
        } />
        <Route path='/grns' 
          element={
            <ProtectedRoute page="invoices">
          <GrnsPage searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
          </ProtectedRoute>
        }/>
        <Route path='/purchaseorders' 
          element={
            <ProtectedRoute page="invoices">
          <PurchaseOrdersPage searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
          </ProtectedRoute>
        }/>
        <Route path='/quotations' 
          element={<ProtectedRoute page="invoices">
            <QuotationsPage searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
          </ProtectedRoute>
          }
        />

        {/* ── Admin + special permission only ── */}
        <Route path='/store' element={
          <ProtectedRoute page="store">
            <StorePage searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </ProtectedRoute>
        } />
        <Route path='/store/macsa-store' element={
          <ProtectedRoute page="store">
            <MacsaStorePage searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </ProtectedRoute>
        } />
        <Route path='/store/savema-store' element={
          <ProtectedRoute page="store">
            <SavemaStorePage searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </ProtectedRoute>
        } />
        <Route path='/store/sojet-store' element={
          <ProtectedRoute page="store">
            <SojetStorePage searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </ProtectedRoute>
        } />
        <Route path='/store/bestcode-store' element={
          <ProtectedRoute page="store">
            <BestCodeStorePage searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </ProtectedRoute>
        } />

        {/* ── 404 ── */}
        <Route path='*' element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
