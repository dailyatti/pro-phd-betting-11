import React from 'react';
import PropTypes from 'prop-types';

/**
 * HeaderSection component displaying the title and description.
 *
 * @param {Object} props - Component props.
 * @param {boolean} props.darkMode - Toggle for dark mode styles.
 * @returns {JSX.Element} The rendered HeaderSection.
 */
const HeaderSection = ({ darkMode }) => {
    return (
        <div>
            <h2 className={`text-3xl font-bold tracking-tight mb-2 text-primary`}>
                Active Intelligence
            </h2>
            <p className={`max-w-2xl text-secondary`}>
                Upload betting slips or market screenshots. The multi-agent system will extract data, verify facts, and formulate PhD-level strategies.
            </p>
        </div>
    );
};

HeaderSection.propTypes = {
    darkMode: PropTypes.bool.isRequired,
};

export default HeaderSection;
