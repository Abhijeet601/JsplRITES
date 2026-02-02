import React from 'react';
import { Users, Calendar, FileText, Settings, LogOut } from 'lucide-react';

const Sidebar = ({ active, onChange }) => {
  const items = [
    { key: 'dashboard', label: 'Dashboard', icon: Users },
    { key: 'employees', label: 'Employees', icon: Users },
    { key: 'attendance', label: 'Attendance', icon: Calendar },
    { key: 'monthly-report', label: 'Monthly Reports', icon: FileText },
    { key: 'settings', label: 'Settings', icon: Settings },
    { key: 'logout', label: 'Logout', icon: LogOut }
  ];

  return (
    <aside className="w-64 bg-white/80 backdrop-blur-md border-r border-gray-100 h-[calc(100vh-72px)] sticky top-18 p-4">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-700">Admin</h2>
        <p className="text-sm text-gray-500 mt-1">Control Panel</p>
      </div>

      <nav className="flex flex-col gap-1">
        {items.map(item => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              className={`flex items-center gap-3 p-3 rounded-lg text-left transition w-full ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
            >
              <Icon size={18} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
