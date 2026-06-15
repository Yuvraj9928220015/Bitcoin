// routes/productRoute.js

const Product = require('../models/productModel');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    getProducts,
    getProductById,
    getProductByName,
    addProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');

const uploadPath = './uploads';
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const imageTypes = /jpeg|jpg|png|gif|webp/;
    const videoTypes = /mp4|mov|avi|wmv|mkv|flv|webm/;

    const extname = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype;

    if (file.fieldname === 'images') {
        const isValidImage = imageTypes.test(extname) && mimetype.startsWith('image/');
        if (isValidImage) return cb(null, true);
        return cb(new Error('Images must be jpeg, jpg, png, gif, or webp format'));
    }

    if (file.fieldname === 'video') {
        const isValidVideo = videoTypes.test(extname) && mimetype.startsWith('video/');
        if (isValidVideo) return cb(null, true);
        return cb(new Error('Videos must be mp4, mov, avi, wmv, mkv, flv, or webm format'));
    }

    cb(new Error('Invalid file type or field name'));
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024,
        files: 11
    }
}).fields([
    { name: 'images', maxCount: 10 },
    { name: 'video', maxCount: 1 }
]);

const handleUpload = (req, res, next) => {
    upload(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                let message = 'Upload Error';
                switch (err.code) {
                    case 'LIMIT_FILE_SIZE':
                        message = 'File too large. Maximum size is 100MB per file.';
                        break;
                    case 'LIMIT_FILE_COUNT':
                        message = 'Too many files. Maximum is 10 images and 1 video.';
                        break;
                    case 'LIMIT_FIELD_COUNT':
                        message = 'Too many fields in the request.';
                        break;
                    case 'LIMIT_UNEXPECTED_FILE':
                        message = 'Unexpected file field. Only "images" and "video" fields are allowed.';
                        break;
                    default:
                        message = `Upload Error: ${err.message}`;
                }
                return res.status(400).json({ message, error: err.code });
            }
            return res.status(400).json({ message: err.message || 'File upload error' });
        }
        next();
    });
};

// Debug middleware (remove in production)
const debugMiddleware = (req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log('=== Request Debug ===');
        console.log('Method:', req.method, '| URL:', req.url);
        console.log('Body:', req.body);
        console.log('Files:', req.files);
        console.log('====================');
    }
    next();
};

router.get('/', getProducts);

// Get by slug — used for SEO-friendly URLs (must be BEFORE /:id)
router.get('/slug/:slug', async (req, res) => {
    try {
        const product = await Product.findOne({ slug: req.params.slug });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get by name (must be BEFORE /:id)
router.get('/name/:name', getProductByName);

// Get by MongoDB _id (must be LAST specific GET route)
router.get('/:id', getProductById);

router.post('/', handleUpload, debugMiddleware, addProduct);
router.put('/:id', handleUpload, debugMiddleware, updateProduct);
router.delete('/:id', deleteProduct);

// Error handling middleware
router.use((error, req, res, next) => {
    console.error('Router error:', error);
    res.status(500).json({
        message: 'Internal server error',
        error: error.message
    });
});

module.exports = router;