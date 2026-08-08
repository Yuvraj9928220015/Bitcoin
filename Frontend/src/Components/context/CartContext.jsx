import { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

const API_URL = 'http://localhost:9000/api/cart';

const generateBrowserId = () => {
    let browserId = localStorage.getItem('bitcoine_browser_id');

    if (!browserId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        const userAgent = navigator.userAgent.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '');
        browserId = `browser_${userAgent}_${timestamp}_${random}`;

        localStorage.setItem('bitcoine_browser_id', browserId);
        localStorage.setItem('bitcoine_browser_created', new Date().toISOString());
    }

    return browserId;
};

// Local storage helpers
const saveCartToLocalStorage = (items, cartCount) => {
    try {
        const cartData = {
            items: items,
            cartCount: cartCount,
            lastUpdated: new Date().toISOString(),
            browserId: generateBrowserId()
        };
        localStorage.setItem('bitcoine_cart', JSON.stringify(cartData));
    } catch (error) {
        console.error('Failed to save cart to localStorage:', error);
    }
};

const loadCartFromLocalStorage = () => {
    try {
        const stored = localStorage.getItem('bitcoine_cart');
        if (stored) {
            const cartData = JSON.parse(stored);
            const lastUpdated = new Date(cartData.lastUpdated);
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            if (lastUpdated > thirtyDaysAgo) {
                return cartData;
            } else {
                localStorage.removeItem('bitcoine_cart');
            }
        }
    } catch (error) {
        console.error('Failed to load cart from localStorage:', error);
        localStorage.removeItem('bitcoine_cart');
    }
    return null;
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [addedItemNotification, setAddedItemNotification] = useState(null);
    const [browserInfo, setBrowserInfo] = useState({ browserId: null, isNewBrowser: true });
    const [isLoading, setIsLoading] = useState(true);
    const [cartCount, setCartCount] = useState(0);
    const [browserId] = useState(generateBrowserId());

    useEffect(() => {
        const initializeCart = async () => {
            console.log("CartContext: Initializing browser-specific cart...");
            try {
                setIsLoading(true);

                const localCart = loadCartFromLocalStorage();
                if (localCart && localCart.items) {
                    setCartItems(localCart.items);
                    setCartCount(localCart.cartCount || 0);
                    console.log('CartContext: Loaded cart from localStorage:', localCart.items.length, 'items');
                }

                const browserResponse = await fetchWithCredentials(`${API_URL}/browser-info`);

                if (browserResponse.ok) {
                    const browserData = await browserResponse.json();
                    console.log('CartContext: Browser data received:', browserData);
                    setBrowserInfo(browserData);
                }

                const cartResponse = await fetchWithCredentials(API_URL);

                if (cartResponse.ok) {
                    const cartData = await cartResponse.json();
                    console.log('CartContext: Backend cart data:', cartData);

                    const validCartData = Array.isArray(cartData.items) ? cartData.items : [];

                    if (validCartData.length > 0 || (localCart && localCart.items.length === 0)) {
                        setCartItems(validCartData);
                        setCartCount(cartData.cartCount || 0);
                        saveCartToLocalStorage(validCartData, cartData.cartCount || 0);
                    } else if (localCart && localCart.items.length > 0) {
                        await syncCartToBackend(localCart.items);
                        const reSyncCartResponse = await fetchWithCredentials(API_URL);
                        if (reSyncCartResponse.ok) {
                            const reSyncCartData = await reSyncCartResponse.json();
                            setCartItems(reSyncCartData.items);
                            setCartCount(reSyncCartData.cartCount);
                            saveCartToLocalStorage(reSyncCartData.items, reSyncCartData.cartCount);
                        }
                    } else {
                        setCartItems([]);
                        setCartCount(0);
                        saveCartToLocalStorage([], 0);
                    }
                } else {
                    console.warn('CartContext: Backend not available, using localStorage only');
                    if (localCart) {
                        setCartItems(localCart.items || []);
                        setCartCount(localCart.cartCount || 0);
                    } else {
                        setCartItems([]);
                        setCartCount(0);
                    }
                }

            } catch (error) {
                console.error("CartContext: Failed to initialize cart:", error);
                const localCart = loadCartFromLocalStorage();
                if (localCart) {
                    setCartItems(localCart.items || []);
                    setCartCount(localCart.cartCount || 0);
                } else {
                    setCartItems([]);
                    setCartCount(0);
                }
            } finally {
                setIsLoading(false);
                console.log("CartContext: Initialization complete.");
            }
        };

        initializeCart();
    }, []);

    const fetchWithCredentials = async (url, options = {}) => {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'X-Browser-ID': browserId,
                ...options.headers,
            },
            credentials: 'include',
            ...options
        };
        return fetch(url, defaultOptions);
    };

    const syncCartToBackend = async (items) => {
        try {
            console.log("CartContext: Attempting to sync local cart to backend...");
            const response = await fetchWithCredentials(`${API_URL}/sync`, {
                method: 'POST',
                body: JSON.stringify({
                    localCartItems: items,
                    browserId: browserId
                }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log('CartContext: Successfully synced cart to backend. Backend state:', data);
                setCartItems(data.items);
                setCartCount(data.cartCount);
                saveCartToLocalStorage(data.items, data.cartCount);
                return true;
            } else {
                console.error(`CartContext: Failed to sync cart to backend. Status: ${response.status}`);
            }
        } catch (error) {
            console.error('CartContext: Failed to sync cart to backend:', error);
        }
        return false;
    };

    const addToCart = async (product, size, quantity = 1) => {
        const cartItemId = `${product.id}-${size || 'default'}-${Date.now()}`;
        const newItem = {
            id: product.id,
            cartId: cartItemId,  // Keep for backward compatibility
            cartItemId: cartItemId,  // This is what backend expects
            productId: product.id,
            name: product.name,
            price: product.price,
            image: product.images?.[0] || product.image || '/placeholder.jpg',
            size: size || 'One Size',
            quantity: quantity,
            addedAt: new Date().toISOString()
        };

        try {
            // Optimistic update for immediate UI feedback
            const updatedItemsOptimistic = [...cartItems];
            const existingItemIndexOptimistic = updatedItemsOptimistic.findIndex(item =>
                item.productId === product.id && item.size === (size || 'One Size')
            );

            if (existingItemIndexOptimistic > -1) {
                updatedItemsOptimistic[existingItemIndexOptimistic].quantity += quantity;
            } else {
                updatedItemsOptimistic.push(newItem);
            }

            const newCartCountOptimistic = updatedItemsOptimistic.reduce((count, item) => count + item.quantity, 0);

            setCartItems(updatedItemsOptimistic);
            setCartCount(newCartCountOptimistic);
            saveCartToLocalStorage(updatedItemsOptimistic, newCartCountOptimistic);

            setAddedItemNotification(newItem);
            setTimeout(() => setAddedItemNotification(null), 3000);

            // Now, send the update to the backend
            const response = await fetchWithCredentials(`${API_URL}/add`, {
                method: 'POST',
                body: JSON.stringify({
                    ...newItem,
                    browserId: browserId
                }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log('CartContext: Backend add successful, updating state with backend data.');
                setCartItems(data.items);
                setCartCount(data.cartCount);
                saveCartToLocalStorage(data.items, data.cartCount);
            } else {
                console.error(`CartContext: Backend add failed: ${response.status}`);
                throw new Error(`Backend add failed: ${response.status}`);
            }

            return { success: true };
        } catch (error) {
            console.error("CartContext: Failed to add item to cart:", error);
            const localCart = loadCartFromLocalStorage();
            if (localCart) {
                setCartItems(localCart.items);
                setCartCount(localCart.cartCount);
            }
            return { success: false, error };
        }
    };

    const updateQuantity = async (cartItemId, amount) => {
        console.log(`CartContext: Updating quantity for item ${cartItemId} by ${amount}`);

        try {
            // Optimistic update for immediate UI feedback
            const updatedItemsOptimistic = cartItems.map(item => {
                const itemId = item.cartItemId || item.cartId;
                if (itemId === cartItemId) {
                    const newQuantity = item.quantity + amount;
                    return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
                }
                return item;
            }).filter(Boolean);

            const newCartCountOptimistic = updatedItemsOptimistic.reduce((count, item) => count + item.quantity, 0);

            setCartItems(updatedItemsOptimistic);
            setCartCount(newCartCountOptimistic);
            saveCartToLocalStorage(updatedItemsOptimistic, newCartCountOptimistic);

            // Now, send the update to the backend
            const response = await fetchWithCredentials(`${API_URL}/update/${cartItemId}`, {
                method: 'PUT',
                body: JSON.stringify({ amount, browserId: browserId }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log('CartContext: Backend quantity update successful, updating state with backend data.');
                setCartItems(data.items || []);
                setCartCount(data.cartCount || 0);
                saveCartToLocalStorage(data.items, data.cartCount);
            } else {
                console.error(`CartContext: Backend quantity update failed. Status: ${response.status}`);
                throw new Error(`Backend quantity update failed: ${response.status}`);
            }

            return { success: true };
        } catch (error) {
            console.error("CartContext: Failed to update item quantity:", error);
            const localCart = loadCartFromLocalStorage();
            if (localCart) {
                setCartItems(localCart.items);
                setCartCount(localCart.cartCount);
            }
            return { success: false, error };
        }
    };

    const removeFromCart = async (cartItemId) => {
        console.log(`CartContext: Removing item ${cartItemId}`);

        try {
            // Optimistic update
            const updatedItemsOptimistic = cartItems.filter(item => {
                const itemId = item.cartItemId || item.cartId;
                return itemId !== cartItemId;
            });
            const newCartCountOptimistic = updatedItemsOptimistic.reduce((count, item) => count + item.quantity, 0);

            setCartItems(updatedItemsOptimistic);
            setCartCount(newCartCountOptimistic);
            saveCartToLocalStorage(updatedItemsOptimistic, newCartCountOptimistic);

            // Backend call
            const response = await fetchWithCredentials(`${API_URL}/remove/${cartItemId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                console.log('CartContext: Successfully removed item from backend.');
            } else {
                console.error(`CartContext: Failed to remove item from backend. Status: ${response.status}`);
                throw new Error(`Backend remove failed: ${response.status}`);
            }

            return { success: true };
        } catch (error) {
            console.error("CartContext: Failed to remove item from cart:", error);
            const localCart = loadCartFromLocalStorage();
            if (localCart) {
                setCartItems(localCart.items);
                setCartCount(localCart.cartCount);
            }
            return { success: false, error };
        }
    };

    const clearCart = async () => {
        try {
            // Optimistic update
            setCartItems([]);
            setCartCount(0);
            localStorage.removeItem('bitcoine_cart');

            const response = await fetchWithCredentials(`${API_URL}/clear`, {
                method: 'DELETE'
            });

            if (response.ok) {
                console.log('CartContext: Successfully cleared backend cart');
            } else {
                console.error(`CartContext: Failed to clear backend cart. Status: ${response.status}`);
                throw new Error(`Backend clear failed: ${response.status}`);
            }

            return { success: true };
        } catch (error) {
            console.error("CartContext: Failed to clear cart:", error);
            return { success: false, error };
        }
    };

    const getCartCount = () => {
        return cartItems.reduce((count, item) => count + item.quantity, 0);
    };

    const subtotal = cartItems.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 0)), 0);

    const value = {
        cartItems,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        getCartCount,
        subtotal,
        addedItemNotification,
        closeAddedToCartNotification: () => setAddedItemNotification(null),
        browserInfo,
        browserId,
        isLoading
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>
};