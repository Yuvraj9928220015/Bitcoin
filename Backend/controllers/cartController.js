const Cart = require('../models/Cart');
const crypto = require('crypto');

const generateBrowserId = (req) => {
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || req.connection.remoteAddress || '';
    const acceptLanguage = req.headers['accept-language'] || '';
    const acceptEncoding = req.headers['accept-encoding'] || '';

    const browserString = `${userAgent}-${ip}-${acceptLanguage}-${acceptEncoding}`;
    const browserHash = crypto.createHash('sha256').update(browserString).digest('hex');

    return browserHash.substring(0, 32);
};

const getBrowserIdentifier = (req) => {
    let browserId = req.headers['x-browser-id'] || req.body.browserId;

    if (!browserId) {
        if (req.session && req.session.browserId) {
            browserId = req.session.browserId;
        } else {
            browserId = generateBrowserId(req);
            if (req.session) {
                req.session.browserId = browserId;
            }
        }
    } else {
        if (req.session && !req.session.browserId) {
            req.session.browserId = browserId;
        }
    }

    return browserId;
};

const getBrowserCart = async (browserId) => {
    let cart = await Cart.findOne({ browserId: browserId });

    if (!cart) {
        console.log(`No cart found for browser ${browserId}. Creating a new one.`);
        cart = new Cart({
            browserId: browserId,
            items: [],
            createdAt: new Date(),
            updatedAt: new Date()
        });
        await cart.save();
    }

    return cart;
};

exports.getBrowserInfo = async (req, res) => {
    try {
        const browserId = getBrowserIdentifier(req);
        const isNewBrowser = !req.session.browserId || req.session.browserId !== browserId;
        req.session.browserId = browserId;
        const cart = await getBrowserCart(browserId);
        const cartCount = cart.items.reduce((count, item) => count + item.quantity, 0);

        console.log(`Browser info for ${browserId}: ${cartCount} items in cart`);

        res.json({
            browserId: browserId,
            isNewBrowser: isNewBrowser,
            cartCount: cartCount,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting browser info:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getCartItems = async (req, res) => {
    try {
        const browserId = getBrowserIdentifier(req);
        const cart = await getBrowserCart(browserId);

        console.log(`Fetching cart for browser ${browserId}: ${cart.items.length} items`);

        res.json({
            items: cart.items,
            cartCount: cart.items.reduce((count, item) => count + item.quantity, 0),
            browserId: browserId,
            lastActivity: cart.updatedAt
        });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.addItemToCart = async (req, res) => {
    try {
        const productToAdd = req.body;

        if (!productToAdd.productId || !productToAdd.name || !productToAdd.price) {
            return res.status(400).json({ message: 'Missing required product fields (productId, name, price)' });
        }

        const browserId = getBrowserIdentifier(req);
        const cart = await getBrowserCart(browserId);

        const cartItemId = productToAdd.cartItemId || productToAdd.cartId || `${productToAdd.productId}-${productToAdd.size || 'default'}-${Date.now()}`;

        console.log(`Adding item to cart for browser ${browserId}`);

        const existingItemIndex = cart.items.findIndex(item =>
            item.productId === productToAdd.productId && item.size === (productToAdd.size || 'One Size')
        );

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += productToAdd.quantity || 1;
            console.log(`Updated existing item quantity: ${cart.items[existingItemIndex].quantity}`);
        } else {
            const newItem = {
                cartItemId: cartItemId,
                productId: productToAdd.productId,
                name: productToAdd.name,
                price: productToAdd.price,
                image: productToAdd.image || '/placeholder.jpg',
                size: productToAdd.size || 'One Size',
                quantity: productToAdd.quantity || 1,
                addedAt: new Date()
            };
            cart.items.push(newItem);
            console.log(`Added new item to cart: ${newItem.name} (Size: ${newItem.size})`);
        }

        await cart.save();

        const cartCount = cart.items.reduce((count, item) => count + item.quantity, 0);

        console.log(`Item added to cart for browser ${browserId}. Total items: ${cartCount}`);

        res.status(200).json({
            items: cart.items,
            cartCount: cartCount,
            browserId: browserId,
            message: 'Item added to cart successfully'
        });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.updateCartItem = async (req, res) => {
    const { cartItemId } = req.params;
    const { amount, browserId: bodyBrowserId } = req.body;

    try {
        const browserId = getBrowserIdentifier(req);
        if (browserId !== bodyBrowserId) {
            console.warn(`Browser ID mismatch in updateCartItem: Header/Session=${browserId}, Body=${bodyBrowserId}`);
        }

        const cart = await getBrowserCart(browserId);
        const itemIndex = cart.items.findIndex(item => item.cartItemId === cartItemId);

        if (itemIndex > -1) {
            const oldQuantity = cart.items[itemIndex].quantity;
            cart.items[itemIndex].quantity += amount;

            if (cart.items[itemIndex].quantity <= 0) {
                const removedItem = cart.items[itemIndex];
                cart.items.splice(itemIndex, 1);
                console.log(`Removed item from cart: ${removedItem.name} (cartItemId: ${cartItemId})`);
            } else {
                console.log(`Updated item quantity from ${oldQuantity} to ${cart.items[itemIndex].quantity} for cartItemId: ${cartItemId}`);
            }

            cart.updatedAt = new Date();
            await cart.save();

            const cartCount = cart.items.reduce((count, item) => count + item.quantity, 0);

            res.status(200).json({
                items: cart.items,
                cartCount: cartCount,
                browserId: browserId
            });
        } else {
            console.warn(`Item with cartItemId ${cartItemId} not found in cart for browser ${browserId}`);
            res.status(404).json({ message: "Item not found in cart" });
        }
    } catch (error) {
        console.error(`Error updating cart item ${cartItemId}:`, error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.removeCartItem = async (req, res) => {
    const { cartItemId } = req.params;

    try {
        const browserId = getBrowserIdentifier(req);
        const cart = await getBrowserCart(browserId);
        const initialLength = cart.items.length;

        const itemToRemove = cart.items.find(item => item.cartItemId === cartItemId);
        cart.items = cart.items.filter(item => item.cartItemId !== cartItemId);

        if (cart.items.length < initialLength) {
            cart.updatedAt = new Date();
            await cart.save();

            const cartCount = cart.items.reduce((count, item) => count + item.quantity, 0);

            console.log(`Removed item ${itemToRemove?.name || cartItemId} from cart for browser ${browserId}`);

            res.status(200).json({
                items: cart.items,
                cartCount: cartCount,
                browserId: browserId,
                message: 'Item removed from cart successfully'
            });
        } else {
            console.warn(`Item with cartItemId ${cartItemId} not found for removal in cart for browser ${browserId}`);
            res.status(404).json({ message: "Item not found in cart" });
        }
    } catch (error) {
        console.error(`Error removing from cart item ${cartItemId}:`, error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.clearCart = async (req, res) => {
    try {
        const browserId = getBrowserIdentifier(req);
        const cart = await getBrowserCart(browserId);

        const itemCount = cart.items.length;
        cart.items = [];
        cart.updatedAt = new Date();
        await cart.save();

        console.log(`Cleared ${itemCount} items from cart for browser ${browserId}`);

        res.status(200).json({
            message: 'Cart cleared successfully',
            items: [],
            cartCount: 0,
            browserId: browserId
        });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.syncCart = async (req, res) => {
    try {
        const { localCartItems, browserId: frontendBrowserId } = req.body;
        const browserId = frontendBrowserId || getBrowserIdentifier(req);

        console.log(`Syncing cart for browser ${browserId}`);

        const cart = await getBrowserCart(browserId);
        
        if (Array.isArray(localCartItems) && localCartItems.length > 0 && cart.items.length === 0) {
            cart.items = localCartItems.map(item => ({
                cartItemId: item.cartItemId || item.cartId || `${item.productId || item.id}-${item.size || 'default'}-${Date.now()}`,
                productId: item.productId || item.id,
                name: item.name,
                price: item.price,
                image: item.image,
                size: item.size || 'One Size',
                quantity: item.quantity || 1,
                addedAt: item.addedAt ? new Date(item.addedAt) : new Date()
            }));
            cart.updatedAt = new Date();
            await cart.save();
            console.log(`Synced ${cart.items.length} items from frontend to backend (backend was empty)`);
        }
        else if (cart.items.length > 0 && (Array.isArray(localCartItems) && localCartItems.length === 0)) {
            console.log("Backend cart has items, frontend was empty. Frontend will adopt backend state.");
        }

        const cartCount = cart.items.reduce((count, item) => count + item.quantity, 0);

        res.json({
            items: cart.items,
            cartCount: cartCount,
            browserId: browserId,
            synced: true,
            message: `Cart synced. Current items: ${cart.items.length}`
        });
    } catch (error) {
        console.error('Error syncing cart:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};