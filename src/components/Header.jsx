import React from 'react';

export default function Header() {
    return (
        <header>
            <h1
                onClick={() => window.location.reload()}
                style={{ cursor: 'pointer', display: 'inline-block', margin: 0 }}
            >
                DiffZip
            </h1>
        </header>
    );
}