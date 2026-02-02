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
    <aside className="w-64 bg-white border-r border-gray-200 h-[calc(100vh-72px)] sticky top-18 p-4 overflow-y-auto shadow-lg md:shadow-none">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
        <p className="text-xs text-gray-500 mt-1">Navigation</p>
      </div>

      <nav className="flex flex-col gap-2">
        {items.map(item => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition w-full font-medium text-sm ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-700 hover:bg-blue-50'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
