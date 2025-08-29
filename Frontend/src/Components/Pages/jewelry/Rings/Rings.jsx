import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
const API_URL = 'http://localhost:9000';
import "./RingsDetail.css"

const ProductCard = ({ product }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const intervalRef = useRef(null);

    const images = product.images || [];

    const startSlideshow = useCallback(() => {
        clearInterval(intervalRef.current);
        if (images.length > 1) {
            intervalRef.current = setInterval(() => {
                setCurrentImageIndex(prevIndex => (prevIndex + 1) % images.length);
            }, 1500);
        }
    }, [images]);

    useEffect(() => {
        // Only start slideshow on hover if there is no video to play
        if (isHovered && !product.video) {
            startSlideshow();
        } else {
            clearInterval(intervalRef.current);
            setCurrentImageIndex(0);
        }
        return () => clearInterval(intervalRef.current);
    }, [isHovered, startSlideshow, product.video]);


    const handleManualChange = (newIndex) => {
        setCurrentImageIndex(newIndex);
        if (isHovered && !product.video) { // Restart slideshow if hovering
            startSlideshow();
        }
    };

    const handlePrevImage = (event) => {
        event.stopPropagation();
        event.preventDefault();
        const newIndex = (currentImageIndex - 1 + images.length) % images.length;
        handleManualChange(newIndex);
    };

    const handleNextImage = (event) => {
        event.stopPropagation();
        event.preventDefault();
        const newIndex = (currentImageIndex + 1) % images.length;
        handleManualChange(newIndex);
    };

    const handleDotClick = (index, event) => {
        event.stopPropagation();
        event.preventDefault();
        handleManualChange(index);
    };

    if (images.length === 0) {
        return (
            <div className="product-card-link">
                <div className="product-card">
                    <div className="product-info" style={{ color: '#000' }}>
                        <p>No Image Available</p>
                        <h3 className="product-name">{product.name}</h3>
                        <p className="product-price">${product.price}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Link
            to={`/Rings/${product.id}`}
            className="product-card-link"
            state={{ productData: product }}
        >
            <div
                className="product-card"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* --- VIDEO & IMAGE DISPLAY LOGIC --- */}
                {isHovered && product.video ? (
                    <video
                        src={product.video}
                        className="product-video"
                        autoPlay
                        loop
                        muted
                        playsInline
                        key={product.video}
                    />
                ) : (
                    <img
                        src={images[currentImageIndex]}
                        alt={product.name}
                        className="product-image"
                        key={images[currentImageIndex]}
                    />
                )}

                {product.tagText && <span className="product-tag">{product.tagText}</span>}

                {/* --- SLIDESHOW CONTROLS (Only show if not hovering on a video) --- */}
                {!(isHovered && product.video) && images.length > 1 && (
                    <>
                        <div className={`slider-dots ${isHovered ? 'visible' : ''}`}>
                            {images.map((_, index) => (
                                <span
                                    key={index}
                                    className={`dot ${index === currentImageIndex ? 'active' : ''}`}
                                    onClick={(e) => handleDotClick(index, e)}
                                ></span>
                            ))}
                        </div>
                        <div className={`slider-controls ${isHovered ? 'visible' : ''}`}>
                            <button className="slider-arrow arrow-prev" onClick={handlePrevImage}>
                                <i className="fa fa-chevron-left"></i>
                            </button>
                            <button className="slider-arrow arrow-next" onClick={handleNextImage}>
                                <i className="fa fa-chevron-right"></i>
                            </button>
                        </div>
                    </>
                )}

                <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-price">${product.price}</p>
                </div>
            </div>
        </Link>
    );
};


export default function Rings() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isMoreLoaded, setIsMoreLoaded] = useState(false);

    useEffect(() => {
        const fetchRingProducts = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_URL}/api/products?category=Rings`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setProducts(data);
                setError(null);
            } catch (err) {
                setError(err.message);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchRingProducts();
    }, []);

    const formattedProducts = products.map(p => ({
        id: p._id,
        name: p.title,
        price: p.price,
        images: p.image.map(imgPath => `${API_URL}/${imgPath.replace(/\\/g, '/')}`),
        video: p.video ? `${API_URL}/${p.video.replace(/\\/g, '/')}` : null,
        material: p.category,
        tagText: p.tagText || null,
        description: p.description
    }));

    // Slicing logic remains the same
    const grid1Products = formattedProducts.slice(0, 4);
    const niche1Products = formattedProducts.slice(4, 8);
    const nicheNewProducts = formattedProducts.slice(8, 12);
    const grid2Products = formattedProducts.slice(12, 16);
    const niche2Products = formattedProducts.slice(16, 20);
    const loadMoreProducts = formattedProducts.slice(20, 32);

    const handleLoadMore = () => {
        setIsMoreLoaded(true);
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '5rem', fontSize: '1.5rem' }}>Loading Products...</div>;
    }

    if (error) {
        return <div style={{ textAlign: 'center', padding: '5rem', fontSize: '1.5rem', color: 'red' }}>Error: {error}</div>;
    }

    return (
        <>
            <div data-aos="fade-up" className="bzero-page-container">
                <div className={`bzero-main-content ${isFilterOpen ? 'content-blurred' : ''}`}>
                    <header className="bzero-header">
                        <div className="bzero-header-left">
                            <span className="breadcrumb">Jewelry / Rings</span>
                            <h1 className="bzero-title">
                                Rings <sup>{formattedProducts.length}</sup>
                            </h1>
                        </div>
                    </header>
                    <main className="product-grid-wrapper">
                        <div className="product-grid">
                            <div className="product-grid-left">
                                {grid1Products.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                            <div className="product-grid-right">
                                <div className="hero-image-container">
                                    <img src="/DSC02974.webp" alt="Model wearing B.zero1 jewelry" />
                                </div>
                            </div>
                        </div>
                    </main>
                    <section className="niche-section-wrapper">
                        <div data-aos="fade-up" className="niche-grid">
                            {niche1Products.map((product) => (
                                <ProductCard key={`${product.id}-a`} product={product} />
                            ))}
                        </div>
                    </section>
                    <section className="niche-section-wrapper">
                        <div data-aos="fade-up" className="niche-grid">
                            {nicheNewProducts.map((product) => (
                                <ProductCard key={`${product.id}-new`} product={product} />
                            ))}
                        </div>
                    </section>
                    {formattedProducts.length > 20 && !isMoreLoaded && (
                        <div className="load-more-container">
                            <button onClick={handleLoadMore} className="load-more-button">
                                Load More
                            </button>
                        </div>
                    )}
                    {isMoreLoaded && (
                        <section data-aos="fade-up" className="niche-section-wrapper">
                            <div className="niche-grid">
                                {loadMoreProducts.slice(0, 4).map((product) => (
                                    <ProductCard key={`${product.id}-f`} product={product} />
                                ))}
                            </div>
                            <div className="niche-grid">
                                {loadMoreProducts.slice(4, 8).map((product) => (
                                    <ProductCard key={`${product.id}-g`} product={product} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </>
    );
}