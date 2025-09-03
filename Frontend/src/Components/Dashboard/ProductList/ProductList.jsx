import { useState, useEffect } from 'react';
import axios from 'axios';
import './ProductList.css'; // Make sure you have this CSS file
import Cookies from 'js-cookie'; // Import js-cookie for client-side cookie management

const API_URL = 'http://localhost:9000'; // Your backend API URL
const MAX_IMAGES = 10;

// Initial state for a new product
const initialProductState = {
    id: null,
    title: '',
    description: '',
    price: '',
    category: '',
    images: Array(MAX_IMAGES).fill(null), // Array to hold up to MAX_IMAGES image files/paths
    video: null, // To hold the video file/path
};

export default function ProductList() {
    // --- Authentication State ---
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });
    const [loginError, setLoginError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    // --- End Authentication State ---

    const [products, setProducts] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [showForm, setShowForm] = useState(false); // To show/hide add/edit product form
    const [showProductModal, setShowProductModal] = useState(false); // To show/hide product detail modal
    const [selectedProduct, setSelectedProduct] = useState(null); // Product selected for detail view
    const [currentProduct, setCurrentProduct] = useState(initialProductState); // Product being added/edited
    const [imagePreviews, setImagePreviews] = useState(Array(MAX_IMAGES).fill(null)); // URLs for image previews
    const [videoPreview, setVideoPreview] = useState(null); // URL for video preview
    const [activeMedia, setActiveMedia] = useState({ src: '', type: 'image' }); // For the main media viewer in product modal
    const [searchTerm, setSearchTerm] = useState(''); // For searching products

    // Effect to check authentication status on component mount
    useEffect(() => {
        checkAuthStatus();
    }, []);

    // Effect to fetch products only when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            fetchProducts();
        }
    }, [isAuthenticated]);

    // Function to check authentication status using the 'admin_token' cookie
    const checkAuthStatus = () => {
        const token = Cookies.get('admin_token');
        if (token) {
            // In a real app, you might want to verify this token with your backend.
            // For now, presence of the token means authenticated.
            setIsAuthenticated(true);
        } else {
            setIsAuthenticated(false);
        }
    };

    // Handles user login
    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setLoginError(''); // Clear previous errors

        try {
            const response = await axios.post(`${API_URL}/api/auth/login`, loginData);

            if (response.data.success) {
                Cookies.set('admin_token', response.data.token, { expires: 1 }); // Store token in a cookie named 'admin_token'
                setIsAuthenticated(true);
                setLoginData({ email: '', password: '' }); // Clear form
            } else {
                setLoginError(response.data.message || 'Login failed. Please try again.');
            }
        } catch (error) {
            setLoginError(error.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoggingIn(false);
        }
    };

    // Handles user logout
    const handleLogout = () => {
        Cookies.remove('admin_token'); // Remove the specific admin token
        setIsAuthenticated(false);
        setProducts([]); // Clear products on logout
    };

    // Handles input changes for the login form
    const handleLoginInputChange = (e) => {
        const { name, value } = e.target;
        setLoginData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Fetches products from the backend, including authorization header
    const fetchProducts = async () => {
        const token = Cookies.get('admin_token');
        if (!token) {
            setIsAuthenticated(false);
            return;
        }

        try {
            const response = await axios.get(`${API_URL}/api/products`, {
                headers: {
                    'Authorization': `Bearer ${token}` // Send the token in the Authorization header
                }
            });
            setProducts(response.data);
        } catch (error) {
            console.error("Error fetching products:", error);
            if (error.response?.status === 401) {
                // If unauthorized, set isAuthenticated to false to show login form
                Cookies.remove('admin_token'); // Remove invalid token
                setIsAuthenticated(false);
                setLoginError('Session expired or unauthorized. Please log in again.');
            } else {
                setLoginError('Failed to load products. Please try again later.');
            }
        }
    };

    // Handles input changes for product form fields (title, description, price, category)
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentProduct({ ...currentProduct, [name]: value });
    };

    // Handles image file selection
    const handleImageFileChange = (e, index) => {
        const file = e.target.files[0];
        if (file) {
            const newImages = [...currentProduct.images];
            const newPreviews = [...imagePreviews];

            // Revoke old URL if it exists to prevent memory leaks
            if (newPreviews[index] && newPreviews[index].startsWith('blob:')) {
                URL.revokeObjectURL(newPreviews[index]);
            }
            newImages[index] = file;
            newPreviews[index] = URL.createObjectURL(file);

            setCurrentProduct({ ...currentProduct, images: newImages });
            setImagePreviews(newPreviews);
        }
    };

    // Handles video file selection
    const handleVideoFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Revoke old URL if it exists
            if (videoPreview && videoPreview.startsWith('blob:')) {
                URL.revokeObjectURL(videoPreview);
            }
            setCurrentProduct({ ...currentProduct, video: file });
            setVideoPreview(URL.createObjectURL(file));
        }
    };

    // Handles removing an image from the form
    const handleRemoveImage = (e, index) => {
        e.preventDefault();
        e.stopPropagation();

        const newImages = [...currentProduct.images];
        const newPreviews = [...imagePreviews];

        if (newPreviews[index] && newPreviews[index].startsWith('blob:')) {
            URL.revokeObjectURL(newPreviews[index]);
        }
        newImages[index] = null;
        newPreviews[index] = null;

        setCurrentProduct({ ...currentProduct, images: newImages });
        setImagePreviews(newPreviews);
        // Reset file input value to allow re-uploading the same file
        const fileInput = document.getElementById(`image-input-${index}`);
        if (fileInput) fileInput.value = '';
    };

    // Handles removing a video from the form
    const handleRemoveVideo = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (videoPreview && videoPreview.startsWith('blob:')) {
            URL.revokeObjectURL(videoPreview);
        }

        setCurrentProduct({ ...currentProduct, video: isEditing ? '' : null });
        setVideoPreview(null);
        const fileInput = document.getElementById('video-input');
        if (fileInput) fileInput.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title', currentProduct.title);
        formData.append('description', currentProduct.description);
        formData.append('price', currentProduct.price);
        formData.append('category', currentProduct.category);

        const imageOrder = [];
        const newImageFiles = [];

        currentProduct.images.forEach(img => {
            if (typeof img === 'string') { // Existing image path
                imageOrder.push(img);
            } else if (img instanceof File) { // New image file
                imageOrder.push(`NEW_FILE_${newImageFiles.length}`);
                newImageFiles.push(img);
            }
        });

        if (imageOrder.length === 0) {
            alert('Product must have at least one image.');
            return;
        }

        formData.append('imageOrder', JSON.stringify(imageOrder));
        newImageFiles.forEach(file => {
            formData.append('images', file);
        });

        if (currentProduct.video instanceof File) { // New video file
            formData.append('video', currentProduct.video);
        } else if (isEditing && currentProduct.video === '') { // Existing video removed
            formData.append('video', '');
        }

        const token = Cookies.get('admin_token'); // Get token for API calls

        try {
            if (isEditing) {
                await axios.put(`${API_URL}/api/products/${currentProduct.id}`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`
                    },
                });
            } else {
                await axios.post(`${API_URL}/api/products`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`
                    },
                });
            }
            resetForm();
            fetchProducts();
        } catch (error) {
            if (error.response?.status === 401) {
                Cookies.remove('admin_token');
                setIsAuthenticated(false);
                alert('Session expired. Please log in again.');
            }
            alert(`Error: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleEditClick = (product) => {
        setIsEditing(true);

        const currentImagesState = Array(MAX_IMAGES).fill(null);
        const imagePreviewsState = Array(MAX_IMAGES).fill(null);

        if (product.image && product.image.length > 0) {
            product.image.slice(0, MAX_IMAGES).forEach((path, i) => {
                currentImagesState[i] = path;
                imagePreviewsState[i] = `${API_URL}/${path.replace(/\\/g, '/')}`;
            });
        }

        setCurrentProduct({
            id: product._id,
            title: product.title,
            description: product.description,
            price: product.price,
            category: product.category,
            images: currentImagesState,
            video: product.video || null,
        });
        setImagePreviews(imagePreviewsState);
        setVideoPreview(product.video ? `${API_URL}/${product.video.replace(/\\/g, '/')}` : null);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            const token = Cookies.get('admin_token');
            try {
                await axios.delete(`${API_URL}/api/products/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                fetchProducts();
            } catch (error) {
                if (error.response?.status === 401) {
                    Cookies.remove('admin_token');
                    setIsAuthenticated(false);
                    alert('Session expired. Please log in again.');
                }
                console.error("Error deleting product:", error);
            }
        }
    };

    const resetForm = () => {
        setIsEditing(false);
        setShowForm(false);
        imagePreviews.forEach(p => { if (p && p.startsWith('blob:')) URL.revokeObjectURL(p) });
        if (videoPreview && videoPreview.startsWith('blob:')) URL.revokeObjectURL(videoPreview);

        setCurrentProduct(initialProductState);
        setImagePreviews(Array(MAX_IMAGES).fill(null));
        setVideoPreview(null);
    };

    const openProductView = (product) => {
        setSelectedProduct(product);
        if (product.image && product.image.length > 0) {
            setActiveMedia({ src: `${API_URL}/${product.image[0].replace(/\\/g, '/')}`, type: 'image' });
        } else if (product.video) {
            setActiveMedia({ src: `${API_URL}/${product.video.replace(/\\/g, '/')}`, type: 'video' });
        } else {
            setActiveMedia({ src: '', type: 'image' });
        }
        setShowProductModal(true);
    };

    // Closes the product detail modal
    const closeModal = () => {
        setShowProductModal(false);
        setSelectedProduct(null);
        setActiveMedia({ src: '', type: 'image' });
    };

    // Filters products based on search term
    const filteredProducts = products.filter(product =>
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Render login form if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="product-login-container">
                <div className="login-card">
                    <div className="login-header">
                        <h1>Admin Panel Login</h1>
                    </div>

                    <form onSubmit={handleLogin} className="login-form">
                        {loginError && (
                            <div className="login-error">
                                {loginError}
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={loginData.email}
                                onChange={handleLoginInputChange}
                                required
                                placeholder="Enter your email"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={loginData.password}
                                onChange={handleLoginInputChange}
                                required
                                placeholder="Enter your password"
                            />
                        </div>

                        <button
                            type="submit"
                            className={`login-btn ${isLoggingIn ? 'loading' : ''}`}
                            disabled={isLoggingIn}
                        >
                            {isLoggingIn ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Render product management interface if authenticated
    return (
        <div className="product-list-page">
            <main className="main-content">
                <header className="page-header">
                    <h1>Products Management</h1>
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search by title, category or description..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="header-actions">
                        <button onClick={() => { resetForm(); setIsEditing(false); setShowForm(true); }} className="add-product-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            Add Product
                        </button>
                        <button onClick={handleLogout} className="logout-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                            Logout
                        </button>
                    </div>
                </header>

                <div className="product-table-container">
                    <table className="product-table">
                        <thead>
                            <tr>
                                <th className="image-col">Image</th>
                                <th>Title</th>
                                <th>Description</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th className="actions-col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                                <tr key={product._id}>
                                    <td data-label="Image" onClick={() => openProductView(product)}>
                                        <img
                                            src={product.image && product.image.length > 0 ? `${API_URL}/${product.image[0].replace(/\\/g, '/')}` : 'https://via.placeholder.com/150'}
                                            alt={product.title}
                                            className="table-product-image"
                                        />
                                    </td>
                                    <td data-label="Title" onClick={() => openProductView(product)}>
                                        <span className="product-title-cell">{product.title}</span>
                                    </td>
                                    <td data-label="Description" onClick={() => openProductView(product)}>
                                        <span className='description'>{product.description}</span>
                                    </td>
                                    <td data-label="Category" onClick={() => openProductView(product)}>
                                        <span className="category-tag">{product.category}</span>
                                    </td>
                                    <td data-label="Price" onClick={() => openProductView(product)}>${Number(product.price).toFixed(2)}</td>
                                    <td data-label="Actions">
                                        <div className="table-actions">
                                            <button onClick={() => handleEditClick(product)} className="action-btn" title="Edit Product">
                                                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83l3.75 3.75l1.83-1.83M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Z" /></svg>
                                            </button>
                                            <button onClick={() => handleDelete(product._id)} className="action-btn" title="Delete Product">
                                                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12Z" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="6" className="empty-state"><div className="empty-state-content"><h3>No products found</h3><p>Add a new product to get started!</p></div></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* ADD/EDIT FORM MODAL */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
                            <button onClick={resetForm} className="close-btn">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="product-form">
                            <div className="form-group">
                                <label htmlFor="title">Product Title</label>
                                <input id="title" type="text" name="title" value={currentProduct.title} onChange={handleInputChange} required />
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Product Description</label>
                                <textarea id="description" name="description" value={currentProduct.description} onChange={handleInputChange} required rows="4"></textarea>
                            </div>

                            <div className="form-row">
                                <div className="form-group"><label htmlFor="price">Price</label><input id="price" type="number" name="price" value={currentProduct.price} onChange={handleInputChange} required step="0.01" min="0" /></div>
                                <div className="form-group"><label htmlFor="category">Category</label><input id="category" type="text" name="category" value={currentProduct.category} onChange={handleInputChange} required /></div>
                            </div>

                            {/* NEW: Combined layout for Images and Video */}
                            <div className="form-group-flex">
                                <div className="form-group form-group-images">
                                    <label className="form-label">Product Images (up to {MAX_IMAGES})</label>
                                    <div className="image-upload-grid">
                                        {Array.from({ length: MAX_IMAGES }).map((_, index) => (
                                            <div key={index} className="image-upload-slot">
                                                <label htmlFor={`image-input-${index}`} className="image-upload-label">
                                                    {imagePreviews[index] ? <img src={imagePreviews[index]} alt={`Preview ${index}`} className="image-preview" /> : <svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>}
                                                </label>
                                                {imagePreviews[index] && <button type="button" className="remove-media-btn" onClick={(e) => handleRemoveImage(e, index)}>×</button>}
                                                <input type="file" id={`image-input-${index}`} onChange={(e) => handleImageFileChange(e, index)} accept="image/*" style={{ display: 'none' }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group form-group-video">
                                    <label className="form-label">Product Video (Optional)</label>
                                    <div className="video-upload-slot">
                                        <label htmlFor="video-input" className="video-upload-label">
                                            {videoPreview ? (
                                                <video src={videoPreview} muted loop className="video-preview" />
                                            ) : (
                                                <div className="video-placeholder">
                                                    <svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M17 10.5V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3.5l4 4v-11l-4 4Z" /></svg>
                                                    <span>Add Video</span>
                                                </div>
                                            )}
                                        </label>
                                        {videoPreview && <button type="button" className="remove-media-btn" onClick={handleRemoveVideo}>×</button>}
                                        <input type="file" id="video-input" onChange={handleVideoFileChange} accept="video/*" style={{ display: 'none' }} />
                                    </div>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">{isEditing ? 'Update Product' : 'Add Product'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PRODUCT VIEW MODAL */}
            {showProductModal && selectedProduct && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content product-view-modal" onClick={(e) => e.stopPropagation()}>
                        <button onClick={closeModal} className="close-btn modal-close-top-right">×</button>
                        <div className="product-view-grid">
                            <div className="gallery-container">
                                <div className="main-media-wrapper">
                                    {activeMedia.type === 'video' ? (
                                        <video src={activeMedia.src} className="main-product-media" controls autoPlay muted loop />
                                    ) : (
                                        <img src={activeMedia.src || 'https://via.placeholder.com/400'} alt={selectedProduct.title} className="main-product-media" />
                                    )}
                                </div>
                                <div className="thumbnail-list">
                                    {selectedProduct.image && selectedProduct.image.map((img, index) => (
                                        <button key={`img-${index}`} className={`thumbnail-btn ${activeMedia.src.includes(img.replace(/\\/g, '/')) && activeMedia.type === 'image' ? 'active' : ''}`} onClick={() => setActiveMedia({ src: `${API_URL}/${img.replace(/\\/g, '/')}`, type: 'image' })}>
                                            <img src={`${API_URL}/${img.replace(/\\/g, '/')}`} alt={`Thumbnail ${index + 1}`} />
                                        </button>
                                    ))}
                                    {selectedProduct.video && (
                                        <button key="vid-thumb" className={`thumbnail-btn video-thumb ${activeMedia.src.includes(selectedProduct.video.replace(/\\/g, '/')) && activeMedia.type === 'video' ? 'active' : ''}`} onClick={() => setActiveMedia({ src: `${API_URL}/${selectedProduct.video.replace(/\\/g, '/')}`, type: 'video' })}>
                                            <video src={`${API_URL}/${selectedProduct.video.replace(/\\/g, '/')}`} muted />
                                            <div className="play-icon-overlay">
                                                <svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5.14v14l11-7l-11-7Z"></path></svg>
                                            </div>
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="info-container">
                                <span className="info-category-badge">{selectedProduct.category}</span>
                                <h2 className="info-title">{selectedProduct.title}</h2>
                                <p className="info-description">{selectedProduct.description}</p>
                                <div className="info-price">${Number(selectedProduct.price).toFixed(2)}</div>
                                <div className="info-actions">
                                    <button onClick={() => { closeModal(); handleEditClick(selectedProduct); }} className="btn-primary">Edit Product</button>
                                    <p></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}