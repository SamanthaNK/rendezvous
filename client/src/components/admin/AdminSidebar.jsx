import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart2,
  Flag,
  FileText,
  UserCheck,
  Users,
  List,
} from 'lucide-react';

const menu = [
  { label: 'Dashboard', icon: BarChart2, to: '/admin/dashboard' },
  { label: 'Flagged Events', icon: Flag, to: '/admin/flagged-events' },
  { label: 'Reports', icon: FileText, to: '/admin/reports' },
  { label: 'Verification Requests', icon: UserCheck, to: '/admin/verification-requests' },
  { label: 'Users', icon: Users, to: '/admin/users' },
  { label: 'Logs', icon: List, to: '/admin/logs' },
];

const AdminSidebar = () => (
  <aside className="w-64 h-screen bg-gradient-to-b from-teal to-dark-amaranth text-white shadow-xl fixed left-0 top-0 z-40 flex flex-col">
    <div className="h-20 flex items-center justify-center font-heading text-2xl font-bold tracking-wide border-b border-white/10">
      Admin Panel
    </div>
    <nav className="flex-1 py-8 px-4 space-y-2">
      {menu.map((item) => (
        <NavLink
          key={item.label}
          to={item.to}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all text-lg hover:bg-white/10 ${
              isActive ? 'bg-white/20 text-white font-bold' : 'text-white/80'
            }`
          }
        >
          <item.icon className="w-6 h-6" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  </aside>
);

export default AdminSidebar;
