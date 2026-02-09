import React from 'react';
import Sidebar from '../components/Sidebar';

const DashboardLayout = ({ children, currentView, onViewChange, darkMode = true }) => {
    return (
        <div className={`min-h-screen font-sans selection:bg-cyan-dim transition-colors duration-500 bg-app text-primary`}>

            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {darkMode ? (
                    /* Strict Absolute Black - No decorative blobs or gradients that introduce grey/blue */
                    <div className="absolute inset-0 bg-black" />
                ) : (
                    <>
                        {/* Light Mode: Ultra-subtle Warmth that blends with Cream */}
                        <div className="absolute top-0 right-0 w-full h-[600px] bg-gradient-to-b from-[#FFFBF5] to-transparent" />
                        <div className="absolute -top-[100px] -right-[100px] w-[600px] h-[600px] bg-amber-100/10 rounded-full blur-[80px]" />
                    </>
                )}
            </div>

            <Sidebar currentView={currentView} onViewChange={onViewChange} darkMode={darkMode} />

            <main className="ml-64 relative z-10 p-8 min-h-screen transition-all duration-300">
                <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-in">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
