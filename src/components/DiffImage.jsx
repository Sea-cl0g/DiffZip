import React from 'react';
import 'img-comparison-slider/dist/index.js';
import 'img-comparison-slider/dist/styles.css';

const VIEWPORT_FIT_HEIGHT = '70vh';

const mediaImageStyle = {
    width: 'auto',
    height: 'auto',
    maxWidth: '100%',
    maxHeight: VIEWPORT_FIT_HEIGHT,
    objectFit: 'contain',
    objectPosition: 'center center',
    display: 'block',
    margin: '0 auto',
};

const sliderStyle = {
    width: '100%',
    maxHeight: VIEWPORT_FIT_HEIGHT,
    display: 'block',
    margin: '0 auto',
};

export default function DiffImage({ beforeUrl, afterUrl }) {
    if (beforeUrl && afterUrl) {
        return (
            <img-comparison-slider style={sliderStyle}>
                <img
                    slot="first"
                    src={beforeUrl}
                    alt="before"
                    style={mediaImageStyle}
                />
                <img
                    slot="second"
                    src={afterUrl}
                    alt="after"
                    style={mediaImageStyle}
                />
            </img-comparison-slider>
        );
    }

    return (
        <img
            src={afterUrl || beforeUrl}
            style={mediaImageStyle}
        />
    );
}
