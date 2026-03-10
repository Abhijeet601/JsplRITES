import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-8 sm:p-10 shadow-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-sm text-amber-200 mb-6">
          <AlertTriangle size={16} />
          404 Page Not Found
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          This route does not exist.
        </h1>
        <p className="text-slate-300 text-base sm:text-lg mb-8">
          The link is invalid, outdated, or the page was moved. Use one of the verified routes below.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-5 py-4 font-semibold text-slate-950 hover:bg-cyan-400 transition"
          >
            <Home size={18} />
            Go to Login
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-4 font-semibold hover:bg-white/10 transition"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        </div>

        <div className="mt-8 text-sm text-slate-400">
          Valid entry points: `/login`, `/register`, `/admin-login`, `/plant-login`
        </div>
      </div>
    </div>
  );
};

export default NotFound;
