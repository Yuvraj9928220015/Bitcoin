const express = require("express");
const { submitAffiliateApplication } = require("../controllers/affiliateController");

const router = express.Router();

// POST /api/affiliate/apply
router.post("/apply", submitAffiliateApplication);

module.exports = router;