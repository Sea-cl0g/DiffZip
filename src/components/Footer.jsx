import React from 'react';
import { Divider, Flex } from 'antd';
import AboutButton from './AboutButton';

export default function Footer() {
    return (
        <>
            <Flex justify="center" style={{ paddingBottom: 16 }}>
                <AboutButton />
            </Flex>
        </>
    );
}