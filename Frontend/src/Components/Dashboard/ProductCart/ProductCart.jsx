import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import "./ProductCart.css";

export default function ProductCart() {
    const { cartItems, subtotal, updateQuantity, removeFromCart } = useCart();
    const [cartData, setCartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalItems, setTotalItems] = useState(0);

    useEffect(() => {
        fetchCartData();
    }, [cartItems]);

    const fetchCartData = () => {
        try {
            setLoading(true);
            if (cartItems && cartItems.length > 0) {
                setCartData(cartItems);
                const total = cartItems.reduce((sum, item) => sum + item.quantity, 0);
                setTotalItems(total);
            } else {
                setCartData([]);
                setTotalItems(0);
            }
        } catch (error) {
            console.error('Error fetching cart data:', error);
            setCartData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityUpdate = (cartId, change) => {
        updateQuantity(cartId, change);
    };

    const handleRemoveItem = (cartId) => {
        if (window.confirm('Are you sure you want to remove this item?')) {
            removeFromCart(cartId);
        }
    };

    const calculateItemTotal = (price, quantity) => {
        return (price * quantity).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    if (loading) {
        return (
            <div className="product-cart-container">
                <div className="loading-spinner">Loading cart data...</div>
            </div>
        );
    }

    return (
        <>
            <div className="product-cart-container">
                <div className="cart-header">
                    <h1>Shopping Cart Management</h1>
                    <div className="cart-stats">
                        <div className="stat-item">
                            <span className="stat-label">Total Items:</span>
                            <span className="stat-value">{totalItems}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Subtotal:</span>
                            <span className="stat-value">${subtotal.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}</span>
                        </div>
                    </div>
                </div>

                {cartData.length === 0 ? (
                    <div className="empty-cart">
                        <h2>No items in cart</h2>
                        <p>The shopping cart is currently empty.</p>
                    </div>
                ) : (
                    <div className="cart-table-container">
                        <table className="cart-table">
                            <thead>
                                <tr>
                                    <th>Image</th>
                                    <th>Product Details</th>
                                    <th>Product ID</th>
                                    <th>Size</th>
                                    <th>Price</th>
                                    <th>Quantity</th>
                                    <th>Total</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cartData.map((item, index) => (
                                    <tr key={item.cartId || index} className="cart-row">
                                        <td className="image-cell">
                                            <img
                                                src={item.image || '/placeholder.jpg'}
                                                alt={item.name || 'Product'}
                                                className="product-image"
                                            />
                                        </td>
                                        <td className="product-details">
                                            <div className="product-name">{item.name || 'Unknown Product'}</div>
                                            <div className="product-description">{item.description || 'No description'}</div>
                                        </td>
                                        <td className="product-id">
                                            <span className="id-badge">{item.id || 'N/A'}</span>
                                        </td>
                                        <td className="product-size">
                                            {item.size || 'N/A'}
                                        </td>
                                        <td className="product-price">
                                            ${item.price ? item.price.toLocaleString('en-US', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            }) : '0.00'}
                                        </td>
                                        <td className="quantity-cell">
                                            <div className="quantity-controls">
                                                <button
                                                    className="qty-btn decrease"
                                                    onClick={() => handleQuantityUpdate(item.cartId, -1)}
                                                    disabled={item.quantity <= 1}
                                                >
                                                    -
                                                </button>
                                                <span className="quantity-display">{item.quantity || 0}</span>
                                                <button
                                                    className="qty-btn increase"
                                                    onClick={() => handleQuantityUpdate(item.cartId, 1)}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </td>
                                        <td className="total-price">
                                            <strong>${calculateItemTotal(item.price || 0, item.quantity || 0)}</strong>
                                        </td>
                                        <td className="actions-cell">
                                            <button
                                                className="remove-btn"
                                                onClick={() => handleRemoveItem(item.cartId)}
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="summary-row">
                                    <td colSpan="6" className="summary-label">
                                        <strong>Cart Summary:</strong>
                                    </td>
                                    <td className="summary-total">
                                        <strong>${subtotal.toLocaleString('en-US', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}</strong>
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}

                <div className="cart-actions">
                    <button className="refresh-btn" onClick={fetchCartData}>
                        Refresh Data
                    </button>
                    <div className="export-options">
                        <button className="export-btn">Export to CSV</button>
                        <button className="print-btn">Print Report</button>
                    </div>
                </div>
            </div>
        </>
    );
}