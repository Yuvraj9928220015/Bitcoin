const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
    getProducts,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');

// Ensure uploads folder exists
const uploadPath = './uploads';
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function (req, file, cb) {
        // Create unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter function
const fileFilter = (req, file, cb) => {
    console.log('File being processed:', file);

    // Define allowed file types
    const imageTypes = /jpeg|jpg|png|gif|webp/;
    const videoTypes = /mp4|mov|avi|wmv|mkv|flv|webm/;
    const allTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|wmv|mkv|flv|webm/;

    const extname = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype;

    console.log('File extension:', extname);
    console.log('File mimetype:', mimetype);

    // Check if it's an image field
    if (file.fieldname === 'images') {
        const isValidImage = imageTypes.test(extname) &&
            (mimetype.startsWith('image/'));

        if (isValidImage) {
            console.log('Valid image file accepted');
            return cb(null, true);
        } else {
            console.log('Invalid image file rejected');
            return cb(new Error('Images must be jpeg, jpg, png, gif, or webp format'));
        }
    }

    // Check if it's a video field
    if (file.fieldname === 'video') {
        const isValidVideo = videoTypes.test(extname) &&
            (mimetype.startsWith('video/'));

        if (isValidVideo) {
            console.log('Valid video file accepted');
            return cb(null, true);
        } else {
            console.log('Invalid video file rejected');
            return cb(new Error('Videos must be mp4, mov, avi, wmv, mkv, flv, or webm format'));
        }
    }

    // If we get here, it's an unknown field or invalid file
    console.log('Unknown file field or invalid file type');
    cb(new Error('Invalid file type or field name'));
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
        files: 11 // 10 images + 1 video max
    }
}).fields([
    { name: 'images', maxCount: 10 },
    { name: 'video', maxCount: 1 }
]);

// Middleware to handle file upload errors
const handleUpload = (req, res, next) => {
    console.log('Upload middleware called');

    upload(req, res, (err) => {
        if (err) {
            console.error('Upload error:', err);

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

                return res.status(400).json({
                    message: message,
                    error: err.code
                });
            }

            // Custom error (from fileFilter or other sources)
            return res.status(400).json({
                message: err.message || 'File upload error'
            });
        }

        console.log('Files uploaded successfully:', req.files);
        next();
    });
};

// Debug middleware to log request details
const debugMiddleware = (req, res, next) => {
    console.log('=== Request Debug Info ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('Files:', req.files);
    console.log('========================');
    next();
};

// Routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// Add debug middleware for POST and PUT routes
router.post('/', debugMiddleware, handleUpload, addProduct);
router.put('/:id', debugMiddleware, handleUpload, updateProduct);

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