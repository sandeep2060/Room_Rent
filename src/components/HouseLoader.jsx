import React, { useState, useEffect } from 'react';
import './HouseLoader.css';

export default function HouseLoader({ message = "Constructing your space...", showPercentage = true }) {
    const [percent, setPercent] = useState(0);

    useEffect(() => {
        // Simulate progress for visual feedback
        const interval = setInterval(() => {
            setPercent(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + Math.floor(Math.random() * 5) + 1;
            });
        }, 100);

        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            width: '100vw',
            background: 'var(--bg-solid)',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 9999
        }}>
            <div className="house-loader-container">
                <div className="house-building">
                    <div className="house-floor"></div>
                    <div className="house-body">
                        <div className="house-window left"></div>
                        <div className="house-window right"></div>
                        <div className="house-door"></div>
                    </div>
                    <div className="house-roof"></div>

                    {showPercentage && (
                        <div className="loader-percent">{percent}%</div>
                    )}
                </div>

                <div className="house-progress-bar">
                    <div
                        className="house-progress-fill"
                        style={{ width: `${percent}%` }}
                    ></div>
                </div>

                <p className="loader-msg">{message}</p>
            </div>
        </div>
    );
}
