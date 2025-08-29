import React, { useEffect, useRef } from 'react';
import '@splidejs/splide/dist/css/splide.min.css';
import Splide from '@splidejs/splide';

import './Slider.css';

const slides = [
    {
        src: '/download-1.png',
        alt: 'B.zero1 Necklace',
        topText: 'New Arrival',
        bottomText: 'B.zero1 Necklace'
    },
    {
        src: '/download-2.png',
        alt: 'Serpenti Ring',
        topText: 'New Arrival',
        bottomText: 'Serpenti Ring'
    },
    {
        src: '/download-3.png',
        alt: 'Octo Watch',
        topText: 'New Arrival',
        bottomText: 'Octo Finissimo'
    },
    {
        src: '/download-4.png',
        alt: 'Fiorever Earrings',
        topText: 'New Arrival',
        bottomText: 'Fiorever Earrings'
    },
    {
        src: '/download-5.png',
        alt: 'Divas',
        topText: 'New Arrival',
        bottomText: 'Fiorever Earrings'
    },
    {
        src: '/download-6.png',
        alt: 'Bvlgari Aluminium',
        topText: 'New Arrival',
        bottomText: 'Aluminium Watch'
    },
    {
        src: '/download-7.png',
        alt: 'Parentesi Bracelet',
        topText: 'New Arrival',
        bottomText: 'Parentesi Bracelet'
    },
];

export default function Slider() {
    const splideRef = useRef(null);

    useEffect(() => {
        if (splideRef.current) {
            const splide = new Splide(splideRef.current, {
                perPage: 5,
                focus: 'center',
                type: 'loop',
                arrows: true,
                pagination: false,
                gap: '1rem',
                autoplay: true,
                interval: 3000,
                pauseOnHover: true,
                speed: 800,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                breakpoints: {
                    992: {
                        perPage: 3,
                        gap: '0.8rem',
                        focus: 'center',
                    },
                    576: {
                        perPage: 1,
                        gap: '0.5rem',
                        focus: 'center',
                    },
                },
            });

            splide.mount();

            return () => {
                splide.destroy();
            };
        }
    }, []);

    return (
        <>
            <div data-aos="fade-up" className="slider-container">
                <section
                    ref={splideRef}
                    className="splide modern-slider"
                    aria-label="Image gallery carousel"
                >
                    <div className="splide__track">
                        <ul className="splide__list">
                            {slides.map((slide, index) => (
                                <li key={index} className="splide__slide modern-slide">
                                    <div className="slide-content">
                                        <div className="image-wrapper">
                                            <img
                                                src={slide.src}
                                                alt={slide.alt}
                                                loading="lazy"
                                            />
                                            <div className="top-text">{slide.topText}</div>
                                            <div className="bottom-text">{slide.bottomText}</div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <div className="custom-separator">
                    • • <span className="star">✶</span> •  •
                </div>

            </div>
        </>
    );
}