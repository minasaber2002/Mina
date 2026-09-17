/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SchoolProvider, useSchool } from './context/SchoolContext';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';

const MainLayout: React.FC = () => {
  const { currentUser } = useSchool();

  if (!currentUser) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />
      <main className="flex-1 pb-12">
        {currentUser.role === 'super_admin' ? (
          <SuperAdminDashboard />
        ) : currentUser.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <TeacherDashboard />
        )}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <SchoolProvider>
      <MainLayout />
    </SchoolProvider>
  );
}
