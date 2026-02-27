import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';

const FeedbackPopup = ({ type, message, onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [onClose, duration]);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <Check size={48} color="#34d399" className="feedback-icon success" />;
            case 'error':
                return <X size={48} color="#ef4444" className="feedback-icon error" />;
            case 'warning':
                return <AlertCircle size={48} color="#ffd166" className="feedback-icon warning" />;
            default:
                return null;
        }
    };

    return (
        <div className="feedback-overlay">
            <div className={`feedback-content ${type}`}>
                <div className="icon-wrapper">
                    {getIcon()}
                </div>
                <h3 className="feedback-message">{message}</h3>
            </div>
            <style>{`
                .feedback-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    animation: fadeIn 0.3s ease-out;
                }
                .feedback-content {
                    background: var(--bg-card, #111827);
                    border: 1px solid var(--border, rgba(148, 163, 184, 0.2));
                    padding: 2.5rem;
                    border-radius: 24px;
                    text-align: center;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    max-width: 400px;
                    width: 90%;
                    transform-origin: center;
                    animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .icon-wrapper {
                    margin-bottom: 1.5rem;
                    display: flex;
                    justify-content: center;
                }
                .feedback-icon.success {
                    animation: tickIn 0.5s ease-out forwards;
                }
                .feedback-icon.error {
                    animation: shake 0.4s ease-in-out;
                }
                .feedback-icon.warning {
                    animation: pulse 1s ease-in-out infinite;
                }
                .feedback-message {
                    margin: 0;
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--text, #f9fafb);
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.8); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                @keyframes tickIn {
                    0% { transform: scale(0); opacity: 0; }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                }
            `}</style>
        </div>
    );
};

export default FeedbackPopup;
