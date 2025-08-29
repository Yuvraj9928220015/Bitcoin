import { useRef, useState } from 'react';

const PauseIcon = () => <span className="play-pause-icon">⏸</span>;
const PlayIcon = () => <span className="play-pause-icon">▶</span>;

const storiesData = [
    {
        id: 1,
        type: 'image',
        title: 'A Glimmerland to inspire the future leading generation',
        readTime: '4 Read min',
        imageUrl: '/Bzero11-1.webp',
        gridClass: 'story-1',
    },
    {
        id: 2,
        type: 'video',
        title: 'Eternally Modern: Bvlgari\'s tribute to timeless standout',
        readTime: '2 Read min',
        videoUrl: '/32.mp4',
        gridClass: 'story-2',
    },
    {
        id: 3,
        type: 'image',
        title: 'Masterpieces from the Torlonia Collection at the Louvre',
        readTime: '3 Read min',
        imageUrl: '/Bzero11-2.webp',
        gridClass: 'story-3',
    },
    {
        id: 4,
        type: 'image',
        title: 'Grand Prix d\'Horlogerie de Genève 2023',
        readTime: '2 Read min',
        imageUrl: '/Bzero12-2.webp',
        gridClass: 'story-4',
    },
    {
        id: 5,
        type: 'video',
        title: 'Bvlgari Studio',
        readTime: '4 Read min',
        videoUrl: '/32.mp4',
        gridClass: 'story-5-large',
    },
];

const additionalStories = [
    {
        id: 6,
        title: 'Luxury Timepieces Collection',
        readTime: '3 Read min',
        imageUrl: '/Bzero11-1.webp'
    },
    {
        id: 7,
        title: 'Art & Heritage',
        readTime: '5 Read min',
        imageUrl: '/Bzero11-2.webp'
    },
    {
        id: 8,
        title: 'Modern Craftsmanship',
        readTime: '2 Read min',
        imageUrl: '/Bzero12-1.webp'
    },
    {
        id: 9,
        title: 'Innovation & Design',
        readTime: '4 Read min',
        imageUrl: '/Bzero12-2.webp'
    }
];


const storiesDatas = [
    {
        id: 1,
        type: 'image',
        title: 'A Glimmerland to inspire the future leading generation',
        readTime: '4 Read min',
        imageUrl: '/Bzero11-1.webp',
        gridClass: 'storys-1',
    },
    {
        id: 2,
        type: 'video',
        title: 'Eternally Modern: Bvlgari\'s tribute to timeless standout',
        readTime: '2 Read min',
        videoUrl: '/32.mp4',
        gridClass: 'storys-2',
    },
    {
        id: 3,
        type: 'image',
        title: 'Masterpieces from the Torlonia Collection at the Louvre',
        readTime: '3 Read min',
        imageUrl: '/Bzero11-2.webp',
        gridClass: 'storys-3',
    },
    {
        id: 4,
        type: 'image',
        title: 'Grand Prix d\'Horlogerie de Genève 2023',
        readTime: '2 Read min',
        imageUrl: '/Bzero12-2.webp',
        gridClass: 'storys-4',
    },
    {
        id: 5,
        type: 'video',
        title: 'Bvlgari Studio',
        readTime: '4 Read min',
        videoUrl: '/32.mp4',
        gridClass: 'storys-5-large',
    },
];

export default function Stories() {
    const [playingVideos, setPlayingVideos] = useState({});
    const videoRefs = useRef({});

    const handlePlayPause = (e, storyId) => {
        e.stopPropagation();

        const video = videoRefs.current[storyId];
        if (video) {
            const isCurrentlyPlaying = playingVideos[storyId] !== false;

            if (isCurrentlyPlaying) {
                video.pause();
            } else {
                video.play();
            }

            setPlayingVideos(prev => ({
                ...prev,
                [storyId]: !isCurrentlyPlaying
            }));
        }
    };

    const setVideoRef = (storyId) => (ref) => {
        videoRefs.current[storyId] = ref;
    };

    return (
        <div className="stories-app">
            {/* Hero Section */}
            <main data-aos="fade-up" className="main-content">
                <div className="hero-section">
                    <div className="hero-image">
                        <img src="./public/Banner-men.webp" alt="Bulgari Hero" />
                        <div className="hero-overlay">
                            <div className="hero-text">
                                <div className='hero-text-title'>An Eternally modern Icon</div>
                                <p className="hero-subtitle">Inspirational, powerful and simply iconic.</p>
                                <div className="">
                                    <div class="hero-cta-btn-v4">SHOP B.ZERO1</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>


            {/* Main Stories Grid */}
            <section className="stories-container">
                <div className="stories-grid">
                    {storiesData.map((story) => (
                        <article key={story.id} className={`story-item ${story.gridClass}`}>
                            <div className="story-image-wrapper">
                                {story.type === 'video' ? (
                                    <div className="video-container">
                                        <video
                                            className="story-image"
                                            ref={setVideoRef(story.id)}
                                            src={story.videoUrl}
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                            onLoadedData={() => {
                                                setPlayingVideos(prev => ({ ...prev, [story.id]: true }));
                                            }}
                                        />
                                        <button
                                            className="play-pause-btn"
                                            onClick={(e) => handlePlayPause(e, story.id)}
                                            aria-label={playingVideos[story.id] !== false ? 'Pause video' : 'Play video'}
                                        >
                                            {playingVideos[story.id] !== false ? <PauseIcon /> : <PlayIcon />}
                                        </button>
                                    </div>
                                ) : (
                                    <img
                                        src={story.imageUrl}
                                        alt={story.title}
                                        className="story-image"
                                        loading="lazy"
                                    />
                                )}
                            </div>
                            <div className="story-content">
                                <h3 className="story-title">{story.title}</h3>
                                <span className="story-read-time">{story.readTime}</span>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            {/* Additional Stories Section */}
            <section className="additional-stories">
                <div className="container-fluid">
                    <div className="additional-stories-grid">
                        {additionalStories.map((story) => (
                            <div key={story.id} className="additional-story-item">
                                <div className="additional-story-image">
                                    <img src={story.imageUrl} alt={story.title} loading="lazy" />
                                </div>
                                <div className="additional-story-content">
                                    <h4 className="additional-story-title">{story.title}</h4>
                                    <span className="additional-story-time">{story.readTime}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            <section className="stories-container">
                <div className="stories-grid">
                    {storiesDatas.map((story) => (
                        <article key={story.id} className={`story-item ${story.gridClass}`}>
                            <div className="story-image-wrapper">
                                {story.type === 'video' ? (
                                    <div className="video-container">
                                        <video
                                            className="story-image"
                                            ref={setVideoRef(story.id)}
                                            src={story.videoUrl}
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                            onLoadedData={() => {
                                                setPlayingVideos(prev => ({ ...prev, [story.id]: true }));
                                            }}
                                        />
                                        <button
                                            className="play-pause-btn"
                                            onClick={(e) => handlePlayPause(e, story.id)}
                                            aria-label={playingVideos[story.id] !== false ? 'Pause video' : 'Play video'}
                                        >
                                            {playingVideos[story.id] !== false ? <PauseIcon /> : <PlayIcon />}
                                        </button>
                                    </div>
                                ) : (
                                    <img
                                        src={story.imageUrl}
                                        alt={story.title}
                                        className="story-image"
                                        loading="lazy"
                                    />
                                )}
                            </div>
                            <div className="story-content">
                                <h3 className="story-title">{story.title}</h3>
                                <span className="story-read-time">{story.readTime}</span>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}