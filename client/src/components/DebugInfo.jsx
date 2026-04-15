import React from 'react';

const DebugInfo = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const mode = import.meta.env.MODE;
    const dev = import.meta.env.DEV;

    // Only show in development or if explicitly enabled
    if (!dev && !localStorage.getItem('show_debug')) {
        return null;
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: 10,
            right: 10,
            background: 'rgba(0,0,0,0.9)',
            color: '#0f0',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '11px',
            fontFamily: 'monospace',
            zIndex: 9999,
            maxWidth: '300px',
            border: '1px solid #0f0'
        }}>
            <div style={{ marginBottom: '5px', fontWeight: 'bold', color: '#ff0' }}>
                🐛 Debug Info
            </div>
            <div>Mode: {mode}</div>
            <div>Dev: {dev ? 'true' : 'false'}</div>
            <div>API URL: {apiUrl || 'NOT SET'}</div>
            <div>Origin: {window.location.origin}</div>
            <div style={{ marginTop: '5px', fontSize: '9px', color: '#888' }}>
                To hide: localStorage.removeItem('show_debug')
            </div>
        </div>
    );
};

export default DebugInfo;
