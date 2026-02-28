import React, { useState, useEffect, useRef } from 'react';
import './HouseLoader.css';

/**
 * HouseLoader – Responsive, fast preloader for the Room Rent app.
 *
 * Props:
 *   message        – string label shown below the house (default: "Constructing your space...")
 *   showPercentage – show the % counter (default: true)
 *   duration       – total simulated duration in ms (default: 1800)
 *                    Keeps progress bar smooth & predictable without
 *                    stuttering on slow or fast devices.
 */
export default function HouseLoader({
    message = 'Constructing your space...',
    showPercentage = true,
    duration = 1800,
}) {
    const [percent, setPercent] = useState(0);
    const startTimeRef = useRef(null);
    const rafRef = useRef(null);

    useEffect(() => {
        // Use requestAnimationFrame for smooth, GPU-synced progress
        const animate = (timestamp) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const elapsed = timestamp - startTimeRef.current;

            // Ease-out curve so it slows near 95% (realistic loading feel)
            const raw = Math.min(elapsed / duration, 1);
            const eased = Math.round(1 - Math.pow(1 - raw, 2.5)) * 95 + raw * 5;
            const value = Math.min(Math.round(eased), raw >= 1 ? 100 : 97);

            setPercent(value);

            if (elapsed < duration) {
                rafRef.current = requestAnimationFrame(animate);
            } else {
                setPercent(100);
            }
        };

        rafRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(rafRef.current);
    }, [duration]);

    return (
        <div className="house-loader-overlay">
            <div className="house-loader-container">
                {/* Animated house graphic */}
                <div className="house-building">
                    <div className="house-floor" />
                    <div className="house-body">
                        <div className="house-window left" />
                        <div className="house-window right" />
                        <div className="house-door" />
                    </div>
                    <div className="house-roof" />

                    {showPercentage && (
                        <div className="loader-percent">{percent}%</div>
                    )}
                </div>

                {/* Progress bar */}
                <div className="house-progress-bar">
                    <div
                        className="house-progress-fill"
                        style={{ width: `${percent}%` }}
                    />
                </div>

                {/* Label */}
                <p className="loader-msg">{message}</p>
            </div>
        </div>
    );
}
