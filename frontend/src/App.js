import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LeadsList from './pages/leads/LeadsList';
import LeadDetail from './pages/leads/LeadDetail';
import Pipeline from './pages/Pipeline';
import AdminLayout from './layouts/AdminLayout';
import UsersAdmin from './pages/admin/UsersAdmin';
import DivisionsAdmin from './pages/admin/DivisionsAdmin';
import NotificationTemplatesAdmin from './pages/admin/NotificationTemplatesAdmin';
import TemplateLibraryAdmin from './pages/admin/TemplateLibraryAdmin';
import Reports from './pages/Reports';
import DocumentCenter from './pages/DocumentCenter';
import GenerateDoc from './pages/GenerateDoc';
import ESignature from './pages/ESignature';
import Notifications from './pages/admin/Notifications';
import CommunicationHub from './pages/CommunicationHub';

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
            <ThemeProvider>
                <AuthProvider>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/leads" element={<LeadsList />} />
                            <Route path="/leads/:id" element={<LeadDetail />} />
                            <Route path="/lead-view" element={<Navigate to="/leads/dd84aa1e-0427-4543-9902-189aeeb01538" replace />} />
                            <Route path="/pipeline" element={<Pipeline />} />
                            <Route path="/documents" element={<DocumentCenter />} />
                            <Route path="/generate-doc" element={<GenerateDoc />} />
                            <Route path="/e-signature" element={<ESignature />} />
                            <Route path="/reports" element={<Reports />} />
                            <Route path="/communication" element={<CommunicationHub />} />
                            <Route path="/emails" element={<CommunicationHub />} />

                            <Route path="/admin" element={
                                <ProtectedRoute allowedRoles={['admin', 'division_head', 'Chief Executive Officer', 'Division Head']}>
                                    <AdminLayout />
                                </ProtectedRoute>
                            }>
                                <Route index element={<Navigate to="users" replace />} />
                                <Route path="users" element={<UsersAdmin />} />
                                <Route path="divisions" element={<DivisionsAdmin />} />
                                <Route path="notification-templates" element={<NotificationTemplatesAdmin />} />
                                <Route path="templates" element={<TemplateLibraryAdmin />} />
                                <Route path="audit-logs" element={<AuditLogsAdmin />} />
                            </Route>

                            <Route path="/admin/notifications" element={
                                <ProtectedRoute allowedRoles={['admin', 'division_head', 'Chief Executive Officer', 'Division Head']}>
                                    <Notifications />
                                </ProtectedRoute>
                            } />

                            <Route path="/settings" element={<Placeholder name="User Settings" />} />
                        </Route>

                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}

export default App;
