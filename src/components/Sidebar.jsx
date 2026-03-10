import React from 'react';
import {
  Users,
  Calendar,
  FileText,
  Settings,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

const Sidebar = ({ active, onChange }) => {
  const items = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'employees', label: 'Employees', icon: Users },
    { key: 'attendance', label: 'Attendance', icon: Calendar },
    { key: 'monthly-report', label: 'Monthly Reports', icon: FileText },
    { key: 'settings', label: 'Settings', icon: Settings },
    { key: 'logout', label: 'Logout', icon: LogOut }
  ];

  return (
    <aside className="w-64 h-[calc(100vh-72px)] sticky top-18 overflow-y-auto border-r border-slate-200/80 bg-[linear-gradient(180deg,#f8fbff_0%,#eef6ff_55%,#ffffff_100%)] p-4 shadow-xl md:shadow-none">
      <div className="mb-6 rounded-2xl border border-cyan-100 bg-white/80 p-4 shadow-sm backdrop-blur">
        <div className="mb-3 inline-flex rounded-xl bg-cyan-500/10 p-2 text-cyan-700">
          <ShieldCheck size={20} />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Admin Panel</h2>
        <p className="mt-1 text-xs text-slate-500">Operations, approvals and reports</p>
      </div>

      <nav className="flex flex-col gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          const isLogout = item.key === 'logout';

          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              className={`group flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition w-full font-medium text-sm border ${
                isActive
                  ? 'border-cyan-500 bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                  : isLogout
                  ? 'border-red-100 bg-white/80 text-red-600 hover:bg-red-50'
                  : 'border-transparent bg-white/70 text-slate-700 hover:border-cyan-100 hover:bg-white hover:shadow-sm'
              }`}
            >
              <span
                className={`rounded-xl p-2 ${
                  isActive
                    ? 'bg-white/15'
                    : isLogout
                    ? 'bg-red-100 text-red-600'
                    : 'bg-slate-100 text-slate-600 group-hover:bg-cyan-50 group-hover:text-cyan-700'
                }`}
              >
                <Icon size={18} />
              </span>
              <span className="flex-1">{item.label}</span>
              {!isLogout && (
                <ChevronRight
                  size={16}
                  className={`transition ${isActive ? 'text-white/80' : 'text-slate-300 group-hover:text-cyan-500'}`}
                />
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
