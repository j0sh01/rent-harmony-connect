import React from 'react';
import Sidebar from '@/components/ui/Sidebar';
import Navbar from '@/components/Navbar';

const DashboardLayout = ({ role = 'admin', children }) => {
  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Sidebar role={role} />
      <div className="ml-[240px]">
        <Navbar />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 
