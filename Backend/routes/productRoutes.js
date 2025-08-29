// routes/productRoutes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
    getProducts,
    addProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
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

const handleUpload = (req, res, next) => {
    upload(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ message: `Multer Error: ${err.message}` });
            }
            return res.status(400).json({ message: err.message });
        }
        next();
    });
};

router.get('/', getProducts);
router.post('/', handleUpload, addProduct);
router.put('/:id', handleUpload, updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;