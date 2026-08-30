import React from 'react';
import Upload from './Upload';
import DiffView from './DiffView';

export default function Body({ files, onFileChange }) {
    return (
        <main className="main-content">
            <DiffView files={files} />
        </main>
    );
}