import React, { useState, useEffect, useRef } from 'react';
import { CiPlay1 } from "react-icons/ci";
import { CiPause1 } from "react-icons/ci";
import './Header.css';

const layoutsData = [
    // {
    //     type: 'two-column',
    //     videos: [
    //         {
    //             id: 1,
    //             src: '/5-video.mp4',
    //             title: 'A Bold evolution',
    //             description: 'A jewel beyond time and trends. Discover the future-oriented and always innovative spirit of the iconic B.zero1 jewelry collection.',
    //         },
    //         {
    //             id: 2,
    //             src: '/32.mp4',
    //             title: 'Timeless Radiance',
    //             description: 'Experience the shimmer of our latest collection, crafted for the modern individual.',
    //         },
    //     ],
    // },
    // {
    //     type: 'two-column',
    //     videos: [
    //         {
    //             id: 3,
    //             src: '/32.mp4',
    //             title: 'Art of Creation',
    //             description: 'Witness the meticulous craftsmanship behind every masterpiece.',
    //         },
    //         {
    //             id: 4,
    //             src: '/5-video.mp4',
    //             title: 'Legacy of Design',
    //             description: 'A tribute to heritage, reimagined for tomorrow\'s world.',
    //         },
    //     ],
    // },
    {
        type: 'single-column',
        videos: [
            {
                id: 5,
                src: '/5-video.mp4',
                // title: 'The Solitaire',
                // description: 'Pure, singular, and breathtaking. The ultimate expression of elegance.',
            },
        ],
    },
];

const Header = () => {
    const [currentLayoutIndex, setCurrentLayoutIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const videoRefs = useRef([]);

    useEffect(() => {
        if (!isPlaying) return;

        const timer = setTimeout(() => {
            setCurrentLayoutIndex((prevIndex) => (prevIndex + 1) % layoutsData.length);
        }, 5000);

        return () => clearTimeout(timer);
    }, [currentLayoutIndex, isPlaying]);

    useEffect(() => {
        videoRefs.current.forEach(video => {
            if (video) {
                if (isPlaying) {
                    video.play().catch(error => console.log("Autoplay was prevented:", error));
                } else {
                    video.pause();
                }
            }
        });
    }, [isPlaying, currentLayoutIndex]);


    const handleTogglePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleIndicatorClick = (index) => {
        setCurrentLayoutIndex(index);
    };

    const addToRefs = (el) => {
        if (el && !videoRefs.current.includes(el)) {
            videoRefs.current.push(el);
        }
    };

    return (
        <>
            <div className="header-section-enhanced">
                <div className="header-content">
                    {layoutsData.map((layout, layoutIndex) => (
                        <div
                            key={layoutIndex}
                            className={`layout-wrapper-enhanced ${layoutIndex === currentLayoutIndex ? 'active' : ''}`}
                        >
                            <div className={layout.type === 'single-column' ? 'single-column' : 'two-column-grid'}>
                                {layout.videos.map((video, videoIndex) => (
                                    <div className="video-box" key={video.id} style={{ '--animation-delay': `${videoIndex * 0.10}s` }}>
                                        <video
                                            ref={addToRefs}
                                            className="video-element"
                                            src={video.src}
                                            autoPlay
                                            muted
                                            loop
                                            playsInline
                                        ></video>
                                        <div className="gradient-overlay"></div>
                                        <div className="content-overlay">
                                            <div className="overlay-content">
                                                <h2 className="video-title">{video.title}</h2>
                                                <p className="Header-video-description">{video.description}</p>
                                                <div className="">
                                                    <div class="hero-cta-btn-v4">Discover The Collection</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <button className="Header-play-pause-btn" onClick={handleTogglePlayPause}>
                    {isPlaying ? <span><CiPause1 /></span> : <span><CiPlay1 /></span>}
                </button>
            </div>
        </>
    );
};

export default Header;