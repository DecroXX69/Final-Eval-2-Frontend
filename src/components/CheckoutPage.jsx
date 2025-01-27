import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import TopNavbar from './TopNavbar';
import MainNavbar from './MainNavbar';
import RestaurantsSection from './RestaurantsSection';
import Footer from './footer';
import styles from './CheckoutPage.module.css';
import AddressSection from './AddressSection';
import addressIcon from '../assets/address.png'; 
import Arrow from '../assets/arrow-left.png';
import Vector from '../assets/Vector.png';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartId } = useParams();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddresses, setShowAddresses] = useState(false);
  const { selectedAddress } = location.state || {};

  useEffect(() => {
    const loadCartItems = async () => {
      if (cartId) {
        try {
          setLoading(true);
          const response = await fetch(`${process.env.REACT_APP_API_URL}/api/shared-carts/${cartId}`);
          const data = await response.json();

          if (!data.success) {
            throw new Error(data.message);
          }

          setCartItems(data.cart.items);
        } catch (error) {
          setError(error.message || 'Failed to load shared cart');
          setTimeout(() => navigate('/'), 3000); 
        } finally {
          setLoading(false);
        }
      } else {
        const regularCart = JSON.parse(localStorage.getItem('cart') || '[]');
        setCartItems(regularCart);
        setLoading(false);
      }
    };

    loadCartItems();
  }, [cartId, navigate]);

  const handlePaymentClick = () => {
    const token = localStorage.getItem('token');
    
    // First check if user is logged in
    if (!token) {
      if (cartId) {
        localStorage.setItem('pendingSharedCart', cartId);
        localStorage.setItem('redirectAfterAuth', `/shared-cart/${cartId}`);
      } else {
        localStorage.setItem('redirectAfterAuth', '/checkout');
      }
      navigate('/');
      alert('Please create an account or login to proceed with payment');
      return;
    }
    
    // Then check if address is selected
    if (!selectedAddress) {
      alert('Please add a delivery address before proceeding to payment');
      setShowAddresses(true);
      return;
    }
    
    // If both checks pass, proceed to payment
    if (cartId) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    }
    navigate('/payment');
  };

  if (loading) {
    return <div className={styles.loading}>Loading cart...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  const truncateText = (text, maxLength = 35) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const salesTax = 10;
  const finalTotal = cartTotal + salesTax;

  return (
    <div className={styles.checkoutPage}>
      <TopNavbar />
      <MainNavbar />
      {showAddresses ? (
        <AddressSection onBack={() => setShowAddresses(false)} />
      ) : (
        <div className={styles.contentContainer}>
          <div className={styles.orderHeader}>
            <button className={styles.backButton} onClick={() => navigate(-1)}>
              <img src={Arrow} alt="Back" className={styles.backIcon} />
            </button>
            <h1>{cartId ? 'Shared Cart Details' : 'Your Order Details'}</h1>
          </div>

          <div className={styles.orderContent}>
            <div className={styles.leftSection}>
              <div className={styles.orderItems}>
                {cartItems.map((item) => (
                  <div key={item._id} className={styles.foodItem}>
                    <img src={item.image} alt={item.name} className={styles.foodImage} />
                    <div className={styles.itemInfo}>
                      <h3>{item.name}</h3>
                      <span className={styles.quantity}>{item.quantity}x items</span>
                    </div>
                    <span className={styles.price}>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className={styles.notesSection}>
                <h4>Notes</h4>
                <input
                  type="text"
                  placeholder="Add order notes"
                  className={styles.notesInput}
                  readOnly
                />
              </div>
            </div>

            <div className={styles.rightSection}>
              <div className={styles.deliverySection}>
                <button 
                  className={styles.addressButton} 
                  onClick={() => {
                    const token = localStorage.getItem('token');
                    if (!token) {
                      alert('Please login to add delivery address');
                      return;
                    }
                    setShowAddresses(true);
                  }}
                >
                   <div className={styles.addressContent}>
                  <img 
                    src={addressIcon} 
                    alt="Address" 
                    className={styles.addressIcon}
                  />
                  <div className={styles.addressInfo}>
                    <h3>Delivery Address</h3>
                    {selectedAddress ? (
                      <div className={styles.selectedAddress}>
                        <p>{selectedAddress.name}</p>
                        <p className={styles.truncatedAddress}>
                          {truncateText(selectedAddress.fullAddress)}
                        </p>
                      </div>
                      ) : (
                        <p>Add address</p>
                      )}
                    </div>
                  </div>
                  <img src={Vector} alt="vector" className={styles.vectorIcon} />
                </button>
              </div>

              <div className={styles.summarySection}>
                <div className={styles.summaryRow}>
                  <span className={styles.greyText}>Items</span>
                  <span>₹{cartTotal.toFixed(2)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.greyText}>Sales Tax</span>
                  <span>₹{salesTax.toFixed(2)}</span>
                </div>
                <div className={styles.subtotalRow}>
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span>₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <button 
                className={styles.paymentButton}
                onClick={handlePaymentClick}
              >
                {localStorage.getItem('token') ? 'Choose Payment Method' : 'Login to Proceed'}
              </button>
            </div>
          </div>
        </div>
      )}
      {!showAddresses && <RestaurantsSection />}
      <Footer />
    </div>
  );
};

export default CheckoutPage;