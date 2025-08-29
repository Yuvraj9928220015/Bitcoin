// src/Celebrations.js

import Discover from "../../Home/Discover/Discover";
import Universe from "../../Home/Universe/Universe";
import "./Celebrations.css";

const Hero = ({ imageSrc, title, subtitle, ctaText }) => (
    <div className="hero-section">
        <div className="hero-image">
            <img src={imageSrc} alt="Bulgari Hero Banner" />
            <div className="hero-overlay">
                <div className="hero-text">
                    <div className='hero-text-title'>{title}</div>
                    <p className="hero-subtitle">{subtitle}</p>
                    <a href="#shop" className="cta-button">{ctaText}</a>
                </div>
            </div>
        </div>
    </div>
);

const ContentImageSection = ({ imageSrc, title, description, reverse = false }) => (
    <div className={`content-image-box ${reverse ? 'reverse' : ''}`}>
        <div className="content-image-visual">
            <img src={imageSrc} alt={title} loading="lazy" />
        </div>
        <div className="content-image-text-wrapper">
            <div className="content-image-text">
                <h3 className="section-subtitle">{title}</h3>
                <p className="section-description">
                    {description}
                </p>
            </div>
        </div>
    </div>
);



export default function Celebrations() {
    return (
        <>
            <div className="CelebrationsPage">
                <main>
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

                    <section className="page-section" data-aos="fade-up">
                        <div className="section-header">
                            <h2 className="section-title">A Celebration of Color</h2>
                            <p className="section-description">
                                Born from the collaboration between Bvlgari and National Geographic CreativeWorks, the documentary
                                'A Celebration of Color' follows Bvlgari’s Jewelry Creative Director Lucia Silvestri and Global Ambassador Priyanka Chopra Jonas through the vibrant city of Jaipur,
                                one of the gemstone capitals of the world.
                            </p>
                        </div>
                        <ContentImageSection
                            imageSrc="/Bzero5-1.webp"
                            title="A Chromatic Identity"
                            description="Known as The Pink City, Jaipur is a vibrant maze of terracotta facades, golden marigolds and spice-laden markets. But here, color is more than beauty—it’s language, woven into the very fabric of the town’s identity. Since 1727, its pink walls have drawn travelers and artisans alike. Behind them thrives a centuries-old heritage of jeweler craftsmanship and an art of gemstone cutting, introduced by master jewelers from across Rajasthan and beyond."
                        />
                    </section>

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

                    <section className="page-section" data-aos="fade-up">
                        <div className="section-header">
                            <h2 className="section-title">From Sketch to Jewel</h2>
                            <p className="section-description">
                                Our jewelry projects are meticulously planned and skillfully produced, with local artisans bringing our designs to life. We work together closely to ensure that our vision becomes a reality.
                            </p>
                        </div>
                        <div className="jewel-collage-grid">
                            <div className="collage-column-1">
                                <div className="collage-image-wrapper">
                                    <img src="/Bzero5-1.webp" alt="Inspecting a gemstone" loading="lazy" />
                                </div>
                                <div className="collage-image-wrapper">
                                    <img src="/Bzero6-2.webp" alt="Working with an artisan" loading="lazy" />
                                </div>
                            </div>
                            <div className="collage-column-2">
                                <div className="collage-image-wrapper">
                                    <img src="/Bzero20-2.webp" alt="Sharing a laugh during creation" loading="lazy" />
                                </div>
                                <div className="collage-image-wrapper">
                                    <img src="/Bzero20-1.webp" alt="Reviewing gemstone layout" loading="lazy" />
                                </div>
                            </div>
                        </div>
                        <div className="section-cta-container">
                            <div class="hero-cta-btn-v5"> Explore Bvlgari Artsmanship</div>
                        </div>
                    </section>

                    <section className="page-section" data-aos="fade-up">
                        <ContentImageSection
                            imageSrc="/Bzero5-1.webp"
                            title="A Chromatic Identity"
                            description="Known as The Pink City, Jaipur is a vibrant maze of terracotta facades, golden marigolds and spice-laden markets. But here, color is more than beauty—it’s language, woven into the very fabric of the town’s identity. Since 1727, its pink walls have drawn travelers and artisans alike. Behind them thrives a centuries-old heritage of jeweler craftsmanship and an art of gemstone cutting, introduced by master jewelers from across Rajasthan and beyond."
                        />

                    </section>

                    <div className="hero-cta-btn-v5-btn">
                        <div className="">All images credits to Celeste Sloman, Photographer.</div>
                        <div class="hero-cta-btn-v5"><a href="http://localhost:5173/Stories">BACK TO STORIES</a></div>
                    </div>

                </main>
            </div>

            <Discover />
            <Universe />
        </>
    );
}