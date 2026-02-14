import React, { useState, useEffect, useCallback } from 'react';
import {
  BrainCircuit,
  LayoutDashboard,
  Settings,
  BookOpen,
  History,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

const NavItem = ({ icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group relative overflow-hidden
      ${isActive
        ? 'bg-gradient-to-r from-cyan-500/15 to-transparent text-primary border border-cyan-500/15'
        : 'text-secondary hover:bg-elevated hover:text-primary'
      }`}
  >
    <Icon size={18} className={isActive
      ? 'text-cyan-400'
      : 'text-tertiary group-hover:text-primary transition-colors'
    } />
    <span className={`text-sm tracking-wide flex-1 text-left ${isActive ? 'font-black' : 'font-bold'}`}>{label}</span>
    {isActive && (
      <ChevronRight size={14} className="text-cyan-400 opacity-60" />
    )}
  </button>
);

const Sidebar = ({ currentView, onViewChange, version = "6.0", darkMode = true }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on navigation
  const handleNav = useCallback((view) => {
    onViewChange(view);
    setMobileOpen(false);
  }, [onViewChange]);

  // Close on ESC
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      {/* Brand Header */}
      <div className="p-6 border-b border-subtle bg-sidebar">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl shadow-lg bg-gradient-to-br from-cyan-600 to-blue-700">
              <BrainCircuit size={22} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-lg leading-tight tracking-tight text-primary">
                PhD <span className="text-cyan">INTEL</span>
              </h1>
              <p className="text-[10px] font-mono tracking-wider text-tertiary">v{version} — Research Lab</p>
            </div>
          </div>
          {/* Close button - mobile only */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-2 rounded-xl text-tertiary hover:text-primary hover:bg-elevated transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-tertiary">
          Platform
        </div>

        <NavItem
          icon={LayoutDashboard}
          label="Dashboard"
          isActive={currentView === 'dashboard'}
          onClick={() => handleNav('dashboard')}
        />

        <NavItem
          icon={History}
          label="History"
          isActive={currentView === 'history'}
          onClick={() => handleNav('history')}
        />

        <div className="px-4 py-2 mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-tertiary">
          System
        </div>

        <NavItem
          icon={Settings}
          label="Configuration"
          isActive={currentView === 'settings'}
          onClick={() => handleNav('settings')}
        />

        <NavItem
          icon={BookOpen}
          label="Methodology"
          isActive={currentView === 'methodology'}
          onClick={() => handleNav('methodology')}
        />
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-subtle bg-panel">
        <div className="p-3 rounded-xl flex items-center gap-3 bg-elevated border border-subtle">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 flex items-center justify-center text-[10px] font-black text-white shadow-md tracking-wider">
            PhD
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold truncate text-primary">Research License</p>
            <p className="text-[10px] text-emerald-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
              System Active
            </p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 border-b border-subtle app-sidebar">
        <button
          onClick={() => setMobileOpen(true)}
          className={`p-2.5 rounded-xl transition-colors ${darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-700">
            <BrainCircuit size={16} className="text-white" />
          </div>
          <span className="font-black text-sm text-primary">
            PhD <span className="text-cyan">INTEL</span>
          </span>
        </div>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar (slide-in) */}
      <aside
        className={`lg:hidden fixed left-0 top-0 h-screen w-72 z-[70] flex flex-col transition-transform duration-300 ease-out app-sidebar ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar (always visible) */}
      <aside className="hidden lg:flex w-64 h-screen fixed left-0 top-0 flex-col z-50 transition-colors duration-300 app-sidebar">
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
