import React from 'react';

export default function Header() {
    return (
        <header>
            <h2
                onClick={() => window.location.reload()}
                style={{ cursor: 'pointer', display: 'inline-block', margin: 0 }}
            >
                DiffZip
            </h2>
        </header>
    );
}