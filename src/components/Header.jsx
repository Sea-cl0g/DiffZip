import React from 'react';
import { Divider, Typography } from 'antd';
const { Title } = Typography;

export default function Header({ view, files, onFileChange }) {
    return (
        <header>
            <Title level={2}>DiffZip</Title>
            <Divider />
        </header>
    );
}