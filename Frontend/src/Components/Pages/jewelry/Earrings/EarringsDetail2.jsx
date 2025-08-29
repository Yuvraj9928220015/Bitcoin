import { useState, useRef } from 'react';
import { FaPlus } from "react-icons/fa6";
import Header from '../../../Home/Header/Header';
import Discover from '../../../Home/Discover/Discover';
import "./EarringsDetail2.css"
import { CiPlay1 } from "react-icons/ci";
import { CiPause1 } from "react-icons/ci";
// import Universe from '../../../Home/Universe/Universe';

const PauseIcon = () => <span><CiPause1 /></span>;
const PlayIcon = () => <span><CiPlay1 /></span>;

const RingsDetail2 = () => {

    const [isPlaying, setIsPlaying] = useState(true);
    const videoRef = useRef(null);

    const handlePlayPause = () => {
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const [isExpanded, setIsExpanded] = useState(false);
    const toggleReadMore = () => {
        setIsExpanded(!isExpanded);
    };

    const fullText = "Drawing inspiration from the world’s most renowned amphitheater, the Colosseum, the B.zero1 earrings in 18 kt yellow gold are a groundbreaking expression of Bvlgari’s creative vision. The purity of their distinctive spiral, is a metaphor for the harmony of past, present and future - reflected in the magnificence of the eternal city - and the emblem of the pioneering spirit of the collection.";
    const shortText = "Drawing inspiration from the world’s most renowned amphitheater, the Colosseum, the B.zero1 earrings in 18 kt yellow gold are a groundbreaking expression of Bvlgari’s...";

    return (
        <>
            <div className="product-details-page">

                <div data-aos="fade-up" className="description-container">
                    <div className="info-section">
                        <div className="info-column description-column">
                            <div className="info-title">
                                <h3>DESCRIPTION</h3>
                                <FaPlus />
                            </div>
                            <p className="description-text">
                                {isExpanded ? fullText : shortText}
                            </p>
                            <button onClick={toggleReadMore} className="read-more-btn">
                                {isExpanded ? "Read Less" : "Read More"}
                            </button>
                        </div>

                        <div className="info-column details-column">
                            <div className="info-title">
                                <h3>DETAILS</h3>
                            </div>
                            <div className="details-grid">
                                <div className="detail-item">
                                    <span>Ref:</span>
                                    <span>361778</span>
                                </div>
                                <div className="detail-item">
                                    <span>Material:</span>
                                    <span>Yellow gold</span>
                                </div>
                                <div className="detail-item">
                                    <span>Diamonds (Carats):</span>
                                    <span>0.22</span>
                                </div>
                                <div className="detail-item">
                                    <span>Made In:</span>
                                    <span>Italy</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Header />

                {/* UPDATED: Replaced Bootstrap classes with custom classes for a self-contained component */}
                <section data-aos="fade-up" className="bvlgari-section">
                    <div className="bvlgari-content-wrapper">
                        <div className="bvlgari-text-content">
                            <h2 className="section-title">
                                Complimentary Bvlgari signature box with every order
                            </h2>
                            <p className="section-description">
                                Every creation is carefully handcrafted and delivered in iconic Bvlgari packaging, inspired by the splendour of the Eternal City.
                            </p>
                            <p className="section-description">
                                Designed to preserve Bvlgari's magnificent creations over time, the packaging contains no harmful chemicals and is made from paper sourced from sustainable forests, wood fibre, 100% pure silk and natural latex from rubber trees.
                            </p>
                            <p className="section-description small-text">
                                Note that the box size and design may vary slightly depending on the product purchased.
                            </p>
                        </div>

                        <div className="bvlgari-video-content">
                            <div className="video-container">
                                <video
                                    ref={videoRef}
                                    src="/32.mp4"
                                    className="bvlgari-video"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                >
                                    Your browser does not support the video tag.
                                </video>
                                <button className="play-pause-btn" onClick={handlePlayPause}>
                                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* UPDATED: Cleaned up JSX and added meaningful class names */}
                <section data-aos="fade-up" className="exclusive-section">
                    <div className="exclusive-section-title">Exclusive Bvlgari services</div>
                    <div className="exclusive-grid">
                        <div className="exclusive-card">
                            <img className="exclusive-card-image" src="/Bzero20-1.webp" alt="Exclusive item 1" />
                            <div className="exclusive-card-content">
                                <h4 className="exclusive-card-title">Lorem, ipsum dolor.</h4>
                                <p className="exclusive-card-description">Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur atque consectetur natus officiis ipsam.</p>
                            </div>
                        </div>
                        <div className="exclusive-card">
                            <img className="exclusive-card-image" src="/Bzero12-1.webp" alt="Exclusive item 2" />
                            <div className="exclusive-card-content">
                                <h4 className="exclusive-card-title">Lorem, ipsum dolor.</h4>
                                <p className="exclusive-card-description">Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur atque consectetur natus officiis ipsam.</p>
                            </div>
                        </div>
                        <div className="exclusive-card">
                            <img className="exclusive-card-image" src="/Bzero8-1.webp" alt="Exclusive item 3" />
                            <div className="exclusive-card-content">
                                <h4 className="exclusive-card-title">Lorem, ipsum dolor.</h4>
                                <p className="exclusive-card-description">Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur atque consectetur natus officiis ipsam.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/*  */}
                <a href="/Bzero">
                    <main data-aos="fade-up" className="main-content">
                        <div className="hero-section">
                            <div className="hero-image">
                                <img src="/Banner-men.webp" alt="Bulgari Hero" />
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
                </a>

                {/*  */}


                <Discover />
                {/* <Universe /> */}
            </div>
        </>
    );
};

export default RingsDetail2;