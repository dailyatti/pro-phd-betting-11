import React from 'react';
import {
  BrainCircuit,
  LayoutDashboard,
  Settings,
  HelpCircle,
  History
} from 'lucide-react';

const NavItem = ({ icon: Icon, label, isActive, onClick, darkMode }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
      ${isActive
        ? 'bg-cyan-dim text-cyan border border-cyan/20 shadow-sm'
        : 'text-secondary hover:bg-elevated hover:text-primary hover:pl-5 hover:shadow-sm'
      }`}
  >
    <Icon size={18} className={isActive
      ? 'text-cyan'
      : 'text-tertiary group-hover:text-primary transition-colors'
    } />
    <span className={`text-sm tracking-wide ${isActive ? 'font-black' : 'font-bold'}`}>{label}</span>
    {isActive && (
      <div className={`ml-auto w-1.5 h-1.5 rounded-full bg-cyan shadow-glow-cyan`} />
    )}
  </button>
);

const Sidebar = ({ currentView, onViewChange, version = "5.2.1", darkMode = true }) => {
  return (
    <aside className={`w-64 h-screen fixed left-0 top-0 flex flex-col z-50 transition-colors duration-300 app-sidebar`}>
      {/* Brand Header */}
      <div className={`p-6 border-b border-subtle bg-sidebar`}>
        <div className="flex items-center gap-3 mb-1">
          <div className={`p-2 rounded-lg shadow-lg bg-gradient-to-br from-cyan-600 to-blue-700 shadow-glow-cyan`}>
            <BrainCircuit size={24} className="text-white" />
          </div>
          <div>
            <h1 className={`font-black text-lg leading-tight tracking-tight text-primary`}>
              PhD <span className={'text-cyan'}>INTEL</span>
            </h1>
            <p className={`text-[10px] font-mono tracking-wider text-tertiary`}>v{version}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className={`px-4 py-2 text-xs font-black uppercase tracking-widest text-secondary/70`}>
          Platform
        </div>

        <NavItem
          icon={LayoutDashboard}
          label="Dashboard"
          isActive={currentView === 'dashboard'}
          onClick={() => onViewChange('dashboard')}
          darkMode={darkMode}
        />

        <NavItem
          icon={History}
          label="History"
          isActive={currentView === 'history'}
          onClick={() => onViewChange('history')}
          darkMode={darkMode}
        />

        <div className={`px-4 py-2 mt-6 text-xs font-black uppercase tracking-widest text-secondary/70`}>
          System
        </div>

        <NavItem
          icon={Settings}
          label="Configuration"
          isActive={currentView === 'settings'}
          onClick={() => onViewChange('settings')}
          darkMode={darkMode}
        />

        <NavItem
          icon={HelpCircle}
          label="Methodology"
          isActive={currentView === 'methodology'}
          onClick={() => onViewChange('methodology')}
          darkMode={darkMode}
        />
      </nav>

      {/* Footer / User Status */}
      <div className={`p-4 border-t border-subtle bg-panel`}>
        <div className={`p-3 rounded-xl flex items-center gap-3 bg-elevated border border-subtle`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gold to-[#b49020] flex items-center justify-center text-xs font-black text-white shadow-md">
            PhD
          </div>
          <div className="flex-1 overflow-hidden">
            <p className={`text-xs font-bold truncate text-primary`}>Pro License</p>
            <p className="text-[10px] text-emerald-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              System Active
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
