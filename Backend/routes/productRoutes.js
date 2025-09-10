const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
    getProducts,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100000000 // 100MB limit
    },
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|wmv/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Error: Images or Videos Only! (jpeg, jpg, png, gif, webp, mp4, mov, avi, wmv)'));
        }
    }
}).fields([
    { name: 'images', maxCount: 10 },
    { name: 'video', maxCount: 1 }
]);

// Middleware to handle file upload errors
const handleUpload = (req, res, next) => {
    upload(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ 
                    message: `Upload Error: ${err.message}`,
                    error: err.code 
                });
            }
            return res.status(400).json({ 
                message: err.message 
            });
        }
        next();
    });
};

// Routes
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', handleUpload, addProduct);
router.put('/:id', handleUpload, updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
