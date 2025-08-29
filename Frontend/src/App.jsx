// App.jsx
import axios from 'axios';
import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Navbar from "./Components/Navbar/Navbar";
import AOS from 'aos';
import 'aos/dist/aos.css';
import Home from './Components/Home/Home';
import Footer from './Components/Footer/Footer';
import Pendants from './Components/Pages/jewelry/BZERO/Pendants';
import ProductDetail from './Components/Pages/jewelry/BZERO/ProductDetail';
import ProductDetail2 from './Components/Pages/jewelry/BZERO/ProductDetails2';
import ProductList from './Components/Dashboard/ProductList/ProductList';
import Celebrations from './Components/Pages/Celebrations/Celebrations';
import Stories from './Components/Pages/Stories/Stories';
import Bracelets from './Components/Pages/jewelry/Bracelets/Bracelets';
import BraceletsDetail2 from './Components/Pages/jewelry/Bracelets/BraceletsDetail2';
import BraceletsDetail from './Components/Pages/jewelry/Bracelets/BraceletsDetail';
import Rings from './Components/Pages/jewelry/Rings/Rings';
import RingsDetail2 from './Components/Pages/jewelry/Rings/RingsDetail2';
import RingsDetail from './Components/Pages/jewelry/Rings/RingsDetail';
import Earrings from './Components/Pages/jewelry/Earrings/Earrings';
import EarringsDetail2 from './Components/Pages/jewelry/Earrings/EarringsDetail2';
import EarringsDetail from './Components/Pages/jewelry/Earrings/EarringsDetail';
import Contact from './Components/Contact/Contact';
import About from './Components/About/About';
import { CartProvider } from './Components/context/CartContext';
import AddedToCartNotification from './Components/context/AddedToCartNotification';
import CheckoutPage from './Components/Pages/CheckoutPage/CheckoutPage';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import Man from './Components/Pages/jewelry/Man/Man';
import ManDetail from './Components/Pages/jewelry/Man/ManDetail';
import ManDetail2 from './Components/Pages/jewelry/Man/ManDetail2';
import NewArrival from './Components/Pages/NewArrival/NewArrival';
import Privacy from './Components/Pages/Privacy/Privacy';
import FAQ from './Components/Pages/FAQ/FAQ';
import Return from './Components/Pages/Return/Return';
import Terms from './Components/Pages/Terms/Terms';
axios.defaults.baseURL = 'http://localhost:9000';
axios.defaults.withCredentials = true;


function App() {
  useEffect(() => {
    AOS.init({
      duration: 1400,
      once: true,
    });
  }, []);

  const [stripePromise, setStripePromise] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        console.log('🔄 Loading Stripe configuration...');

        const response = await axios.get('/api/config/stripe');
        const { publishableKey } = response.data;

        if (!publishableKey) {
          throw new Error('No publishable key received from server');
        }

        console.log('✅ Stripe publishable key loaded:', publishableKey);

        const stripe = await loadStripe(publishableKey);
        setStripePromise(Promise.resolve(stripe));
        setIsLoading(false);

        console.log('✅ Stripe.js loaded successfully');

      } catch (error) {
        console.error('❌ Failed to initialize Stripe:', error);
        setError(`Failed to load payment system. Please refresh the page. Error: ${error.message}`);
        setIsLoading(false);
      }
    };

    initializeStripe();
  }, []);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '5px solid #e3e3e3',
          borderTop: '5px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ marginTop: '1rem', color: '#666', fontSize: '1.1rem' }}>
          Loading payment system...
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: '2rem',
          borderRadius: '10px',
          textAlign: 'center',
          maxWidth: '500px',
          border: '1px solid #f5c6cb'
        }}>
          <h2>❌ Payment System Error</h2>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <CartProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/Pendants" element={<Pendants />} />
            <Route path="/About" element={<About />} />
            <Route path="/Bracelets" element={<Bracelets />} />
            <Route path="/Rings" element={<Rings />} />
            <Route path="/Earrings" element={<Earrings />} />
            <Route path="/Man" element={<Man />} />
            <Route path="/ProductDetail2" element={<ProductDetail2 />} />
            <Route path="/BraceletsDetail2" element={<BraceletsDetail2 />} />
            <Route path="/EarringsDetail2" element={<EarringsDetail2 />} />
            <Route path="/RingsDetail2" element={<RingsDetail2 />} />
            <Route path="/ManDetail2" element={<ManDetail2 />} />
            <Route path="/product/:productId" element={<ProductDetail />} />
            <Route path="/Bracelets/:BraceletsId" element={<BraceletsDetail />} />
            <Route path="/Rings/:RingsId" element={<RingsDetail />} />
            <Route path="/Earrings/:EarringsId" element={<EarringsDetail />} />
            <Route path="/Man/:ManId" element={<ManDetail />} />
            <Route path="/Celebrations" element={<Celebrations />} />
            <Route path="/Stories" element={<Stories />} />
            <Route path="/NewArrival" element={<NewArrival />} />
            <Route path="/Privacy" element={<Privacy />} />
            <Route path="/FAQ" element={<FAQ />} />
            <Route path="/Return" element={<Return />} />
            <Route path="/Terms" element={<Terms />} />
            <Route path="/ProductList" element={<ProductList />} />
            <Route path="/Contact" element={<Contact />} />
            <Route path="/AddedToCartNotification" element={<AddedToCartNotification />} />
            <Route path="/CheckoutPage" element={
              stripePromise ? (
                <Elements stripe={stripePromise}>
                  <CheckoutPage />
                </Elements>
              ) : (
                <div>Loading payment components...</div>
              )
            } />
          </Routes>
          <Footer />
        </BrowserRouter>
      </CartProvider>
    </>
  );
}

export default App;