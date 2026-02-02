import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserCircle, ArrowLeft, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const handleHome = () => navigate('/admin');

  if (!user) return null;

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-green-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center py-4">

          <div className="flex items-center gap-4">
            <button
              onClick={handleHome}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition"
              title="Home"
            >
              <Menu size={20} />
            </button>
            <Link to="/" className="flex items-center gap-3">
              <img src="/rites-logo.jpeg" alt="RITES Logo" className="h-8 w-auto" />
              <span className="text-xl font-bold text-white tracking-wide">Geo Attendance System</span>
            </Link>
          </div>

          <div className="flex items-center gap-4 text-white">
            <div className="hidden sm:flex items-center gap-2 text-sm bg-white/20 px-3 py-1 rounded-full">
              <UserCircle size={18} />
              <span>{user.employee_id}</span>
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
