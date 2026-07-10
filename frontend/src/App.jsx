import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProjectHome from './pages/ProjectHome';
import MechanicalWorkspace from './pages/MechanicalWorkspace';
import ElectricalWorkspace from './pages/ElectricalWorkspace';
import CivilWorkspace from './pages/CivilWorkspace';
import AdminPanel from './pages/AdminPanel';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const AppRoutes = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/projects/:id" element={<ProjectHome />} />
          <Route path="/projects/:id/mechanical" element={<MechanicalWorkspace />} />
          <Route path="/projects/:id/electrical" element={<ElectricalWorkspace />} />
          <Route path="/projects/:id/civil" element={<CivilWorkspace />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
      <footer className="py-4 px-6 border-t border-slate-900 text-center text-xs text-slate-600">
        Enterprise CAPEX Estimation System • Strictly Protected Under Corporate Confidentiality
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
