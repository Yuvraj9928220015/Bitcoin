const express = require('express');
const router = express.Router();

// Stripe Configuration Endpoint
router.get('/api/config/stripe', (req, res) => {
  try {
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      return res.status(500).json({ 
        error: 'Stripe configuration missing' 
      });
    }

    res.json({ 
      publishableKey: publishableKey 
    });
  } catch (error) {
    console.error('Error fetching Stripe config:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Stripe configuration' 
    });
  }
});

module.exports = router;