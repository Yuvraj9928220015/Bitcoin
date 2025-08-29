import { Link } from 'react-router-dom';
import { IoClose } from 'react-icons/io5';
import { useCart } from '../context/CartContext';
import './AddedToCartNotification.css';

const AddedToCartNotification = ({ item, onClose }) => {
    const { openCart } = useCart();

    const handleViewBag = () => {
        openCart();
        onClose();
    };

    if (!item) return null;

    return (
        <>
            <div className="added-to-cart-notification">
                <div className="notification-image-container">
                    <img src={item.image} alt={item.name} />
                </div>
                <div className="notification-content">
                    <button className="notification-close-btn" onClick={onClose} aria-label="Close notification">
                        <IoClose size={20} />
                    </button>
                    <p>You have added this creation to your shopping bag</p>
                    <div className="notification-actions">
                        <span>View </span>
                        <button onClick={handleViewBag} className="notification-link-btn">
                            Shopping Bag
                        </button>
                        <span> or go to </span>
                        <Link to="/checkout" onClick={onClose} className="notification-link">
                            Checkout
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AddedToCartNotification;