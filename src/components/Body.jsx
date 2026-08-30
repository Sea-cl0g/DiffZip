import React from 'react';
import Upload from './Upload';
import Toolbar from './Toolbar';
import DiffView from './DiffView';

export default function Body({ files, onFileChange }) {
    return (
        <main className="main-content">
            <Toolbar />
            <DiffView files={files} />
        </main>
    );
}