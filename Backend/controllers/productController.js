const Product = require('../models/productModel');
const fs = require('fs');
const path = require('path');

// Helper function to delete files on error
const deleteFilesOnError = (files) => {
    if (!files) return;
    const allFiles = [];
    if (files.images) allFiles.push(...files.images);
    if (files.video) allFiles.push(...files.video);

    if (allFiles.length > 0) {
        allFiles.forEach(file => {
            fs.unlink(file.path, (err) => {
                if (err) console.log('Error deleting orphaned file:', err);
            });
        });
    }
};

// Get all products with optional category filter
exports.getProducts = async (req, res) => {
    try {
        const { category, sortBy, sortOrder } = req.query;
        const filter = {};
        
        // Apply category filter if provided
        if (category) {
            filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
        }

        // Build sort object
        let sort = {};
        if (sortBy) {
            const order = sortOrder === 'desc' ? -1 : 1;
            sort[sortBy] = order;
        } else {
            sort = { createdAt: -1 }; // Default sort by newest first
        }

        const products = await Product.find(filter).sort(sort);
        
        res.status(200).json(products);
    } catch (error) {
        console.error("Error in getProducts:", error);
        res.status(500).json({ 
            message: 'Server Error', 
            error: error.message 
        });
    }
};

// Get single product by ID
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ 
                message: 'Product not found' 
            });
        }
        
        res.status(200).json(product);
    } catch (error) {
        console.error("Error in getProductById:", error);
        
        // Handle invalid ObjectId
        if (error.name === 'CastError') {
            return res.status(400).json({ 
                message: 'Invalid product ID' 
            });
        }
        
        res.status(500).json({ 
            message: 'Server Error', 
            error: error.message 
        });
    }
};

// Add new product
exports.addProduct = async (req, res) => {
    try {
        const { title, price, goldPrice, category, description } = req.body;
        const images = req.files.images || [];
        const video = req.files.video ? req.files.video[0] : null;

        // Validation
        if (!title || !price || !goldPrice || !category || !description || images.length === 0) {
            deleteFilesOnError(req.files);
            return res.status(400).json({ 
                message: 'Please fill all required fields: title, silver price, gold price, category, description and upload at least one image.' 
            });
        }

        // Validate price values
        const silverPrice = parseFloat(price);
        const goldPriceValue = parseFloat(goldPrice);
        
        if (isNaN(silverPrice) || silverPrice <= 0) {
            deleteFilesOnError(req.files);
            return res.status(400).json({ 
                message: 'Please provide a valid silver price.' 
            });
        }
        
        if (isNaN(goldPriceValue) || goldPriceValue <= 0) {
            deleteFilesOnError(req.files);
            return res.status(400).json({ 
                message: 'Please provide a valid gold price.' 
            });
        }

        const imagePaths = images.map(file => file.path);
        const videoPath = video ? video.path : null;

        const newProduct = new Product({
            sessionId: req.sessionID,
            title: title.trim(),
            category: category.trim(),
            description: description.trim(),
            price: silverPrice, // Silver Price
            goldPrice: goldPriceValue, // Gold Price
            image: imagePaths,
            video: videoPath
        });

        const savedProduct = await newProduct.save();
        res.status(201).json({
            message: 'Product created successfully',
            product: savedProduct
        });

    } catch (error) {
        console.error("Error in addProduct:", error);
        deleteFilesOnError(req.files);
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                message: 'Validation Error', 
                errors 
            });
        }
        
        res.status(500).json({ 
            message: 'Server Error', 
            error: error.message 
        });
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    try {
        const { title, price, goldPrice, category, description } = req.body;
        const imageOrder = req.body.imageOrder ? JSON.parse(req.body.imageOrder) : [];
        const newImageFiles = req.files.images || [];
        const newVideoFile = req.files.video ? req.files.video[0] : null;

        const product = await Product.findById(req.params.id);

        if (!product) {
            deleteFilesOnError(req.files);
            return res.status(404).json({ 
                message: 'Product not found' 
            });
        }

        // Handle image updates
        let newFileIndex = 0;
        const finalImagePaths = imageOrder.map(item => {
            if (item.startsWith('NEW_FILE_')) {
                const newFile = newImageFiles[newFileIndex++];
                return newFile ? newFile.path : null;
            }
            return item;
        }).filter(Boolean);

        // Delete removed images
        const originalImages = product.image || [];
        const imagesToDelete = originalImages.filter(imgPath => !finalImagePaths.includes(imgPath));
        imagesToDelete.forEach(imgPath => {
            fs.unlink(path.resolve(imgPath), (err) => {
                if (err) console.error('Error deleting old image:', err);
            });
        });

        // Handle video updates
        let finalVideoPath = product.video;
        const oldVideoPath = product.video;

        if (newVideoFile) {
            finalVideoPath = newVideoFile.path;
            if (oldVideoPath) {
                fs.unlink(path.resolve(oldVideoPath), (err) => {
                    if (err) console.error('Error deleting old video:', err);
                });
            }
        } else if (req.body.video === '') {
            finalVideoPath = null;
            if (oldVideoPath) {
                fs.unlink(path.resolve(oldVideoPath), (err) => {
                    if (err) console.error('Error deleting old video:', err);
                });
            }
        }

        // Validate prices if provided
        let silverPrice = product.price;
        let goldPriceValue = product.goldPrice;
        
        if (price) {
            silverPrice = parseFloat(price);
            if (isNaN(silverPrice) || silverPrice <= 0) {
                deleteFilesOnError(req.files);
                return res.status(400).json({ 
                    message: 'Please provide a valid silver price.' 
                });
            }
        }
        
        if (goldPrice) {
            goldPriceValue = parseFloat(goldPrice);
            if (isNaN(goldPriceValue) || goldPriceValue <= 0) {
                deleteFilesOnError(req.files);
                return res.status(400).json({ 
                    message: 'Please provide a valid gold price.' 
                });
            }
        }

        // Update product fields
        product.title = title ? title.trim() : product.title;
        product.price = silverPrice; // Silver Price
        product.goldPrice = goldPriceValue; // Gold Price
        product.category = category ? category.trim() : product.category;
        product.description = description ? description.trim() : product.description;
        product.image = finalImagePaths;
        product.video = finalVideoPath;

        // Ensure product has at least one image
        if (product.image.length === 0) {
            deleteFilesOnError(req.files);
            return res.status(400).json({ 
                message: "Product must have at least one image." 
            });
        }

        const updatedProduct = await product.save();
        res.status(200).json({
            message: 'Product updated successfully',
            product: updatedProduct
        });

    } catch (error) {
        console.error("Error in updateProduct:", error);
        deleteFilesOnError(req.files);
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                message: 'Validation Error', 
                errors 
            });
        }
        
        if (error.name === 'CastError') {
            return res.status(400).json({ 
                message: 'Invalid product ID' 
            });
        }
        
        res.status(500).json({ 
            message: 'Server Error', 
            error: error.message 
        });
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ 
                message: 'Product not found' 
            });
        }

        // Delete associated files
        if (product.image && product.image.length > 0) {
            product.image.forEach(imgPath => {
                fs.unlink(path.resolve(imgPath), (err) => {
                    if (err) console.log('Error deleting image file:', err);
                });
            });
        }

        if (product.video) {
            fs.unlink(path.resolve(product.video), (err) => {
                if (err) console.log('Error deleting video file:', err);
            });
        }

        await Product.deleteOne({ _id: req.params.id });

        res.status(200).json({ 
            message: 'Product deleted successfully' 
        });
    } catch (error) {
        console.error("Error in deleteProduct:", error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({ 
                message: 'Invalid product ID' 
            });
        }
        
        res.status(500).json({ 
            message: 'Server Error', 
            error: error.message 
        });
    }
};
