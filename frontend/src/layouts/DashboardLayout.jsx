import React from 'react';
import Sidebar from '../components/Sidebar';

const DashboardLayout = ({ children, currentView, onViewChange, darkMode = true }) => {
    return (
        <div className="min-h-screen font-sans selection:bg-cyan-dim transition-colors duration-500 bg-app text-primary">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {darkMode ? (
                    <div className="absolute inset-0 bg-black" />
                ) : (
                    <>
                        <div className="absolute inset-0 bg-[#FFFDF5]" />
                        <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-b from-amber-50/40 to-transparent" />
                    </>
                )}
            </div>

            <Sidebar currentView={currentView} onViewChange={onViewChange} darkMode={darkMode} />

            {/* Main content: offset for mobile top bar (pt-20) and desktop sidebar (lg:ml-64) */}
            <main className="pt-20 lg:pt-0 lg:ml-64 relative z-10 p-4 sm:p-6 lg:p-8 min-h-screen transition-all duration-300">
                <div className="max-w-[1600px] mx-auto space-y-6 lg:space-y-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
