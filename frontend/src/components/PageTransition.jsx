import React from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Lightweight page transition wrapper.
 * Applies a CSS fade-in + slide-up animation when the route changes.
 * Uses CSS animations instead of framer-motion to keep the bundle small.
 */
const PageTransition = ({ children }) => {
    const location = useLocation();

    return (
        <div
            key={location.pathname}
            className="page-enter"
        >
            {children}
        </div>
    );
};

export default PageTransition;
