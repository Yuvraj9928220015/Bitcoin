import './Banner.css';

export default function Banner() {
    return (
        <>
            {/* Main Content */}
            <a href="/Pendants">
                <main data-aos="fade-up" className="main-content">
                    <div className="hero-section">
                        <div className="hero-image">
                            <img src="./public/Banner-men.webp" alt="Bulgari Hero" />
                            <div className="hero-overlay">
                                <div className="hero-text">
                                    <div className='hero-text-title'>Bitcoin butik</div>
                                    <div className="">
                                        <div class="hero-cta-btn-v4">SHOP NOW</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </a>
        </>
    );
}