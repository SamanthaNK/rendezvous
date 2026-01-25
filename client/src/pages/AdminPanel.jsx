import React from 'react';
import AdminSidebar from '../components/admin/AdminSidebar';

const AdminPanel = ({ children }) => {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-200">
      <AdminSidebar />
      <main className="flex-1 p-8 md:p-12 lg:p-16 bg-white rounded-l-3xl shadow-xl ml-0 md:ml-64 transition-all">
        {children}
      </main>
    </div>
  );
};

export default AdminPanel;
