import './Main.css';

export default function Main() {
    return (
        <>
            {/* Jewelry Showcase Section */}
            <div data-aos="fade-up" className="jewelry-showcase">
                <div className="showcase-container">
                    <div className="showcase-section serpenti-section">
                        <a href="">
                            <img
                                src="./public/Main-Banner-1.webp"
                                alt="Serpenti Jewelry"
                                className="showcase-image"
                            />
                        </a>
                        <div className="overlay-gradient"></div>
                        <div className="main-content-overlay">
                            <a href="/Pendants">
                                <div className="main-content-wrapper">
                                    <h2 className="showcase-title">
                                        Unbreakable Satoshi Pendant
                                    </h2>
                                    <div class="hero-cta-btn-v4">$195.00 - $135.00</div>
                                </div>
                            </a>
                        </div>
                    </div>

                    <div className="showcase-section divas-section">
                        <img
                            src="./public/Main-Banner-2.webp"
                            alt="Divas Dream Jewelry"
                            className="showcase-image"
                        />
                        <div className="overlay-gradient"></div>
                        <div className="main-content-overlay">
                            <a href="/Pendants">
                                <div className="main-content-wrapper">
                                    <h2 className="showcase-title">
                                        Radiant Reserve Pendant
                                    </h2>
                                    <div class="hero-cta-btn-v4">$175.00 - $380.00</div>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Video Section */}
            <div className="">
                <a href="/Celebrations">
                    <main data-aos="fade-up" className="main-content">
                        <div className="hero-section">
                            <div className="hero-image">
                                <img src="./public/Main-Banner-3.webp" alt="Bulgari Hero" />
                                <div className="hero-overlay">
                                    <div className="hero-text">
                                        <div className="">
                                            <div class="hero-cta-btn-v4">JOIN THE JOURNEY</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </a>
            </div>
        </>
    );
}