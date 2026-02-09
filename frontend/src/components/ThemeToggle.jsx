import React from 'react';
import PropTypes from 'prop-types';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = ({ darkMode, setDarkMode, className = "" }) => {
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => setDarkMode((v) => !v)}
            className={`ui-toggle-switch ${className}`}
            data-checked={String(darkMode)}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
            <div className="ui-toggle-icon sun">
                <Sun size={14} />
            </div>
            <div className="ui-toggle-icon moon">
                <Moon size={14} />
            </div>
            <div className="ui-toggle-handle">
                {darkMode ? <Moon size={12} fill="currentColor" /> : <Sun size={12} fill="currentColor" />}
            </div>
        </div>
    );
};

ThemeToggle.propTypes = {
    darkMode: PropTypes.bool.isRequired,
    setDarkMode: PropTypes.func.isRequired,
    className: PropTypes.string
};

export default ThemeToggle;
