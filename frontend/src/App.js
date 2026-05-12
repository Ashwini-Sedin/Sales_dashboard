import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LeadsList from './pages/leads/LeadsList';
import LeadDetail from './pages/leads/LeadDetail';
import AdminLayout from './layouts/AdminLayout';
import UsersAdmin from './pages/admin/UsersAdmin';
import DivisionsAdmin from './pages/admin/DivisionsAdmin';
import NotificationTemplatesAdmin from './pages/admin/NotificationTemplatesAdmin';
import Reports from './pages/Reports';
import DocumentCenter from './pages/DocumentCenter';

// Placeholder components for routes
const Placeholder = ({ name }) => (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
        <p className="mt-4 text-gray-500">This module is under development.</p>
    </div>
);

const AuditLogsAdmin = () => <Placeholder name="Audit Logs" />;


function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/leads" element={<LeadsList />} />
                        <Route path="/leads/:id" element={<LeadDetail />} />
                        <Route path="/documents" element={<DocumentCenter />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/communication" element={<Placeholder name="Communication Hub" />} />

                        <Route path="/admin" element={
                            <ProtectedRoute allowedRoles={['super_admin', 'division_head']}>
                                <AdminLayout />
                            </ProtectedRoute>
                        }>
                            <Route index element={<Navigate to="users" replace />} />
                            <Route path="users" element={<UsersAdmin />} />
                            <Route path="divisions" element={<DivisionsAdmin />} />
                            <Route path="templates" element={<NotificationTemplatesAdmin />} />
                            <Route path="audit-logs" element={<AuditLogsAdmin />} />
                        </Route>

                        <Route path="/settings" element={<Placeholder name="User Settings" />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
