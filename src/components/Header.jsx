import React from 'react';
import { Divider, Typography } from 'antd';
const { Title } = Typography;

export default function Header({ view, files, onFileChange }) {
    return (
        <header>
            <Title level={2}
                onClick={() => window.location.reload()}
                style={{ cursor: 'pointer' }}>
                DiffZip
            </Title>
            <Divider />
        </header>
    );
}