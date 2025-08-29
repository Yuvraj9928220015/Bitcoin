import { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { FaRegHeart } from "react-icons/fa";
import { FaPlus } from "react-icons/fa6";
import { BsShare, BsQuestionCircle, BsArrowLeftRight, BsX, BsTruck, BsArrowLeftShort, BsArrowRightShort } from "react-icons/bs";
import ManDetail2 from './ManDetail2';
import { useCart } from '../../../context/CartContext';
import "./ManDetail.css";

const API_URL = 'http://localhost:9000';

// --- HELPER FUNCTIONS ---

const getDeliveryDateRange = () => {
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + 7);

    const formatDate = (date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[date.getMonth()];
        return `${day} ${month}`;
    };

    const year = deliveryDate.getFullYear();
    const todayFormatted = formatDate(today);
    const deliveryFormatted = formatDate(deliveryDate);

    return `${todayFormatted} - ${deliveryFormatted}, ${year}`;

};

const formatProductData = (productData) => {
    if (!productData) return null;
    return {
        id: productData.id || productData._id,
        name: productData.name || productData.title,
        price: productData.price,
        description: productData.description || "No description available.",
        images: productData.images || [],
        video: productData.video || null,
        breadcrumbs: ['Home', 'Products', 'Pendant', productData.name || productData.title],
        priceInfo: "Taxes and duties included",
        variationInfo: "Also available in other materials",
        sizes: [
            { name: '4.5', available: true }, { name: '5', available: true },
            { name: '5.5', available: true }, { name: '6', available: false },
            { name: '6.5', available: true }, { name: '7', available: true },
            { name: '7.5', available: false }, { name: '8', available: true },
        ]
    };
};



const ShareModal = ({ isOpen, onClose }) => {
    const [copySuccess, setCopySuccess] = useState('');
    useEffect(() => { if (isOpen) { setCopySuccess(''); } }, [isOpen]);
    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 2000);
        } catch (err) {
            setCopySuccess('Failed to copy!');
            setTimeout(() => setCopySuccess(''), 2000);
        }
    };
    if (!isOpen) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="product-modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}><BsX /></button>
                <h3 className="modal-title">Share this Product</h3>
                <p className="modal-subtitle">Copy the link to share it with the world.</p>
                <div className="share-input-group">
                    <input type="text" value={window.location.href} readOnly />
                    <button onClick={copyToClipboard} className={copySuccess === 'Copied!' ? 'success' : ''}>
                        {copySuccess || 'Copy'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const QuestionModal = ({ isOpen, onClose, productName }) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        alert('Thank you for your question! We will get back to you soon.');
        onClose();
    };
    if (!isOpen) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="product-modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}><BsX /></button>
                <h3 className="modal-title">Ask a Question</h3>
                <p className="modal-subtitle">About: <strong>{productName}</strong></p>
                <form onSubmit={handleSubmit} className="question-form">
                    <div className="form-group">
                        <label htmlFor="name">Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            placeholder="Your Name"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            placeholder="your@email.com"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="question">Your Question</label>
                        <textarea
                            id="question"
                            name="question"
                            rows="4"
                            required
                            placeholder="Type your question here...">
                        </textarea>
                    </div>
                    <button type="submit" className="pdp-btn pdp-submit-question">Submit Question</button>
                </form>
            </div>
        </div>
    );
};

const CompareSidebar = ({ isOpen, onClose, productsToCompare, onRemoveProduct }) => {
    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={onClose}></div>
            <aside className={`compare-sidebar ${isOpen ? 'open' : ''}`}>
                <header className="sidebar-header">
                    <h3>Compare Products</h3>
                    <button className="sidebar-close-btn" onClick={onClose}><BsX /></button>
                </header>
                <div className="sidebar-content">
                    {productsToCompare.length === 0 ? (
                        <p>Add a product to start comparing.</p>
                    ) : (
                        <div className="compare-product-list">
                            {productsToCompare.map(p => (
                                <div key={p.id} className="compare-product-item">
                                    <img src={p.images[0]} alt={p.name} />
                                    <div className="compare-product-info">
                                        <h4>{p.name}</h4>
                                        <span>${p.price.toFixed(2)}</span>
                                    </div>
                                    <button className="remove-compare-btn" onClick={() => onRemoveProduct(p.id)}>
                                        <BsX />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <footer className="sidebar-footer">
                    <button className="pdp-btn pdp-compare-action" disabled={productsToCompare.length < 2}>
                        Compare Now ({productsToCompare.length})
                    </button>
                    <button className="pdp-btn-secondary" onClick={onClose}>Continue Shopping</button>
                </footer>
            </aside>
        </>
    );
};


// --- MAIN COMPONENT ---
const ManDetail = () => {
    const { ManId } = useParams();
    const location = useLocation();
    const { addToCart } = useCart();

    const [product, setProduct] = useState(() => formatProductData(location.state?.productData));
    const [loading, setLoading] = useState(!product);
    const [error, setError] = useState(null);

    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [quantity, setQuantity] = useState(1);

    const [isCompareOpen, setIsCompareOpen] = useState(false);
    const [isQuestionOpen, setIsQuestionOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);

    const [compareList, setCompareList] = useState([]);

    // --- Data Fetching Effect ---
    useEffect(() => {
        window.scrollTo(0, 0);

        if (product && product.id === ManId) {
            setLoading(false);
            return;
        }

        const fetchProductDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${API_URL}/api/products/${ManId}`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                const formattedApiProduct = {
                    ...data,
                    name: data.title,
                    images: data.image.map(imgPath => `${API_URL}/${imgPath.replace(/\\/g, '/')}`),
                    video: data.video ? `${API_URL}/${data.video.replace(/\\/g, '/')}` : null
                };
                setProduct(formatProductData(formattedApiProduct));
            } catch (err) {
                setError(err.message);
                setProduct(null);
            } finally {
                setLoading(false);
            }
        };

        fetchProductDetails();
    }, [ManId, product]);

    const mediaItems = useMemo(() => {
        if (!product) return [];

        const items = [];

        if (product.images) {
            product.images.forEach(imgSrc => {
                items.push({ type: 'image', src: imgSrc, thumbnail: imgSrc });
            });
        }

        if (product.video) {
            items.push({
                type: 'video',
                src: product.video,
                thumbnail: product.images?.[0] || ''
            });
        }

        return items;
    }, [product]);

    useEffect(() => {
        setCurrentMediaIndex(0);
    }, [ManId]);


    const handleAddToCompare = () => {
        if (!product) return;
        const isAlreadyInList = compareList.some(item => item.id === product.id);
        if (!isAlreadyInList) {
            setCompareList(prevList => [...prevList, product]);
        }
        setIsCompareOpen(true);
    };

    const handleRemoveFromCompare = (id) => {
        setCompareList(prevList => prevList.filter(p => p.id !== id));
    };

    const handleAddToCart = () => {
        if (!product || !selectedSize) return;
        addToCart(product, selectedSize, quantity);
        alert(`${product.name} (Size: ${selectedSize}) added to cart!`);
    };

    const handlePrevMedia = () => {
        setCurrentMediaIndex(prev => (prev === 0 ? mediaItems.length - 1 : prev - 1));
    };

    const handleNextMedia = () => {
        setCurrentMediaIndex(prev => (prev + 1) % mediaItems.length);
    };

    const increaseQuantity = () => setQuantity(prev => prev + 1);
    const decreaseQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

    if (loading) return <div className="pdp-loading">Loading Product Details...</div>;
    if (error) return <div className="pdp-error">Error: {error}</div>;
    if (!product) return <div className="pdp-loading">Product not found.</div>;

    const currentMedia = mediaItems[currentMediaIndex];
    const detailImages = product.images.slice(0, 3);


    const [isExpanded, setIsExpanded] = useState(false);
    const toggleReadMore = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <>
            <div data-aos="fade-up" className="product-pdp-page-wrapper">
                <div className="pdp-page-wrapper">
                    <div className="pdp-breadcrumbs-container">
                        <nav className="pdp-breadcrumbs">
                            {product.breadcrumbs.map((crumb, index) => (
                                <span key={index}>
                                    {crumb} {index < product.breadcrumbs.length - 1 && ' / '}
                                </span>
                            ))}
                        </nav>
                    </div>

                    <div data-aos="fade-up" className="pdp-main-content">
                        <div className="pdp-main-media-container">
                            {currentMedia && currentMedia.type === 'image' ? (
                                <img
                                    src={currentMedia.src}
                                    alt={`${product.name} view ${currentMediaIndex + 1}`}
                                    className="pdp-main-media"
                                    key={currentMedia.src}
                                />
                            ) : currentMedia && currentMedia.type === 'video' ? (
                                <video
                                    src={currentMedia.src}
                                    className="pdp-main-media"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    key={currentMedia.src}
                                />
                            ) : (
                                <div className="pdp-no-image">No Media Available</div>
                            )}

                            {mediaItems.length > 1 && (
                                <>
                                    <button onClick={handlePrevMedia} className="pdp-nav-arrow pdp-prev"><BsArrowLeftShort /></button>
                                    <button onClick={handleNextMedia} className="pdp-nav-arrow pdp-next"><BsArrowRightShort /></button>
                                </>
                            )}
                        </div>

                        <div className="pdp-details-container">
                            <div className="pdp-header">
                                <h1 className="pdp-title">{product.name}</h1>
                                {/* <button className="pdp-wishlist-btn" title="Add to Wishlist"><FaRegHeart /></button> */}
                            </div>

                            <div className="pdp-price-review-row">
                                <span className="pdp-price">${product.price?.toFixed(2)}</span>
                                <div className="pdp-reviews">
                                    <span className="pdp-stars">☆☆☆☆☆</span>
                                    <a href="#reviews" className="pdp-review-count">(0 reviews)</a>
                                </div>
                            </div>

                            <div className="pdp-options-grid">
                                <div className="pdp-option-group">
                                    <label className="pdp-option-label" htmlFor="size-select">Chains Size:</label>
                                    <select id="size-select" className="pdp-select" value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)}>
                                        <option value="" disabled>Choose an option</option>
                                        {product.sizes?.map((size) => (
                                            <option key={size.name} value={size.name} disabled={!size.available}>
                                                {size.name} {!size.available && ' (Out of stock)'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="pdp-option-group">
                                    <label className="pdp-option-label" htmlFor="type-select">Type:</label>
                                    <select id="type-select" className="pdp-select" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                                        <option value="" disabled>Choose an option</option>
                                        <option value="gold">Gold</option>
                                        <option value="silver">Silver</option>
                                        <option value="platinum">Platinum</option>
                                    </select>
                                </div>
                            </div>

                            <div className="Product-Quantity">Quantity</div>
                            <div className="pdp-cart-row">
                                <div className="pdp-quantity-selector">
                                    <button onClick={decreaseQuantity} disabled={quantity <= 1}>-</button>
                                    <span>{quantity}</span>
                                    <button onClick={increaseQuantity}>+</button>
                                </div>
                                <button className="pdp-btn pdp-add-to-cart" onClick={handleAddToCart} disabled={!selectedSize}>
                                    {selectedSize ? 'Add to cart' : 'Select a size'}
                                </button>
                            </div>

                            <div className="pdp-actions">
                                <button className="pdp-btn pdp-buy-now">Buy Now</button>
                            </div>

                            <div className="pdp-meta-actions">
                                <button onClick={handleAddToCompare}><BsArrowLeftRight /><span>Compare</span></button>
                                <button onClick={() => setIsQuestionOpen(true)}><BsQuestionCircle /><span>Ask a Question</span></button>
                                <button onClick={() => setIsShareOpen(true)}><BsShare /><span>Share</span></button>
                            </div>

                            <div className="pdp-delivery-info">
                                <div className="pdp-delivery-item">
                                    <BsTruck className="pdp-delivery-icon" />
                                    <div>
                                        <strong>Estimated Delivery</strong>
                                        <span>{getDeliveryDateRange()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="Payment-component">
                                <img src="https://bitcoinbutik.com/wp-content/themes/minimog/assets/woocommerce/product-trust-badge.png" alt="Secure Checkout" />
                                <div className="">Guaranteed safe & secure checkout</div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            <div data-aos="fade-up" className="product-detail-images-container">
                <div className="container-fluid">
                    <div className="row">
                        {detailImages.map((imageSrc, index) => (
                            <div key={index} className="col-12 col-md-6 col-lg-4 mb-4">
                                <div className="Product-Detail-Box">
                                    <img src={imageSrc} alt={`${product.name} view ${index + 1}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <CompareSidebar
                isOpen={isCompareOpen}
                onClose={() => setIsCompareOpen(false)}
                productsToCompare={compareList}
                onRemoveProduct={handleRemoveFromCompare}
            />
            <QuestionModal isOpen={isQuestionOpen} onClose={() => setIsQuestionOpen(false)} productName={product.name} />
            <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />


            <div data-aos="fade-up" className="description-container">
                <div className="info-section">
                    <div className="info-column description-column">
                        <div className="info-title">
                            <h3>DESCRIPTION</h3>
                            <FaPlus />
                        </div>
                        <p className="description-text">
                            <div className="pdp-header">
                                <div className="pdp-description">{product.description}</div>
                            </div>
                        </p>
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

            <ManDetail2 />
        </>
    );
};

export default ManDetail;