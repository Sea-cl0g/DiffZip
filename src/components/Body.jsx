import React from 'react';
import Upload from './Upload';
import DiffView from './DiffView';

export default function Body({ view, files, onFileChange }) {
    if (view === 'diff') {
        return (
            <main className="main-content">
                <DiffView files={files} />
            </main>
        );
    }
    return (
        <main className="main-content">
            <Upload onFileChange={onFileChange} />
        </main>
    );
}