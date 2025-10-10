const Product = require('../models/productModel');
const fs = require('fs');
const path = require('path');

// Helper function to delete files on error (handles arrays or single file objects)
const deleteFilesOnError = (files) => {
    if (!files) return;
    const allFiles = [];

    // files may be like { images: [fileObj,...], video: [fileObj] } or single file objects depending on multer config
    if (files.images) {
        if (Array.isArray(files.images)) {
            allFiles.push(...files.images);
        } else {
            allFiles.push(files.images);
        }
    }

    if (files.video) {
        if (Array.isArray(files.video)) {
            allFiles.push(...files.video);
        } else {
            allFiles.push(files.video);
        }
    }

    if (allFiles.length > 0) {
        allFiles.forEach(file => {
            if (!file || !file.path) return;
            const filePath = path.resolve(file.path);
            fs.unlink(filePath, (err) => {
                if (err) console.log('Error deleting orphaned file:', err);
                else console.log('Deleted orphaned file:', filePath);
            });
        });
    }
};

// Helper function to safely delete file path (string)
const deleteFile = (filePath) => {
    if (!filePath) return;
    const fullPath = path.resolve(filePath);
    fs.unlink(fullPath, (err) => {
        if (err) console.error('Error deleting file:', fullPath, err);
        else console.log('Deleted file:', fullPath);
    });
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
        console.log('Request body:', req.body);
        console.log('Request files:', req.files);

        const { title, price, goldPrice, category, description, stock } = req.body;

        const images = req.files?.images || [];
        // normalize video to single file path (if provided as array or single)
        const videoFile = req.files?.video && req.files.video.length > 0 ? req.files.video[0] : (req.files?.video || null);

        console.log('Images:', images);
        console.log('Video file:', videoFile);
        console.log('Stock received:', stock, 'Type:', typeof stock);

        // Validation
        if (!title || !price || !goldPrice || !category || !description) {
            deleteFilesOnError(req.files);
            return res.status(400).json({
                message: 'Please fill all required fields: title, silver price, gold price, category, and description.'
            });
        }

        if (!images || images.length === 0) {
            deleteFilesOnError(req.files);
            return res.status(400).json({
                message: 'Please upload at least one image.'
            });
        }

        // Validate and parse values
        const silverPrice = parseFloat(price);
        const goldPriceValue = parseFloat(goldPrice);

        // stock may come as '', undefined, '4', or number. Use Number() and fallback to 0 for '' or invalid.
        let stockValue = 0;
        if (stock !== undefined && stock !== null && stock !== '') {
            stockValue = Number(stock);
            if (isNaN(stockValue)) stockValue = 0;
        }

        if (isNaN(silverPrice) || silverPrice < 0) {
            deleteFilesOnError(req.files);
            return res.status(400).json({
                message: 'Please provide a valid silver price (0 or greater).'
            });
        }

        if (isNaN(goldPriceValue) || goldPriceValue < 0) {
            deleteFilesOnError(req.files);
            return res.status(400).json({
                message: 'Please provide a valid gold price (0 or greater).'
            });
        }

        if (isNaN(stockValue) || stockValue < 0) {
            deleteFilesOnError(req.files);
            return res.status(400).json({
                message: 'Please provide a valid stock quantity (0 or greater).'
            });
        }

        const imagePaths = images.map(file => file.path);
        const videoPath = videoFile ? videoFile.path : null;

        console.log('Stock value to save:', stockValue);

        const newProduct = new Product({
            sessionId: req.sessionID,
            title: title.trim(),
            category: category.trim(),
            description: description.trim(),
            price: silverPrice,
            goldPrice: goldPriceValue,
            stock: stockValue,
            image: imagePaths,
            video: videoPath
        });

        const savedProduct = await newProduct.save();
        console.log('Product saved successfully:', savedProduct);

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
        console.log('=== UPDATE PRODUCT START ===');
        console.log('Update request body:', req.body);
        console.log('Update request files:', req.files);

        const { title, price, goldPrice, category, description, stock } = req.body;

        // imageOrder may be a JSON string; parse safely
        let imageOrder = [];
        if (req.body.imageOrder) {
            try {
                imageOrder = JSON.parse(req.body.imageOrder);
            } catch (err) {
                console.warn('Could not parse imageOrder JSON:', err);
                imageOrder = [];
            }
        }

        const newImageFiles = req.files?.images || [];
        const newVideoFile = req.files?.video && req.files.video.length > 0 ? req.files.video[0] : (req.files?.video || null);

        console.log('Stock received for update:', stock, 'Type:', typeof stock);

        const product = await Product.findById(req.params.id);

        if (!product) {
            deleteFilesOnError(req.files);
            return res.status(404).json({
                message: 'Product not found'
            });
        }

        console.log('Current product stock before update:', product.stock);

        // Handle image updates
        let newFileIndex = 0;
        const finalImagePaths = imageOrder.length > 0
            ? imageOrder.map(item => {
                if (typeof item === 'string' && item.startsWith('NEW_FILE_')) {
                    const newFile = newImageFiles[newFileIndex++];
                    return newFile ? newFile.path : null;
                }
                return item;
            }).filter(Boolean)
            : (product.image || []);

        if (newImageFiles.length > 0 && imageOrder.length === 0) {
            finalImagePaths.push(...newImageFiles.map(file => file.path));
        }

        // Delete removed images (files present in DB but not in finalImagePaths)
        const originalImages = product.image || [];
        const imagesToDelete = originalImages.filter(imgPath => !finalImagePaths.includes(imgPath));
        imagesToDelete.forEach(imgPath => {
            deleteFile(imgPath);
        });

        // Handle video updates
        let finalVideoPath = product.video;
        const oldVideoPath = product.video;

        if (newVideoFile) {
            console.log('New video file uploaded:', newVideoFile.path);
            finalVideoPath = newVideoFile.path;
            if (oldVideoPath) {
                deleteFile(oldVideoPath);
            }
        } else if (req.body.video === '' || req.body.removeVideo === 'true') {
            console.log('Removing video');
            finalVideoPath = null;
            if (oldVideoPath) {
                deleteFile(oldVideoPath);
            }
        }

        // Build updated fields defaulting to existing product values
        let updatedFields = {
            title: product.title,
            price: product.price,
            goldPrice: product.goldPrice,
            stock: product.stock,
            category: product.category,
            description: product.description,
            image: finalImagePaths,
            video: finalVideoPath
        };

        // Update title
        if (title !== undefined && String(title).trim() !== '') {
            updatedFields.title = String(title).trim();
        }

        // Update price
        if (price !== undefined && price !== '') {
            const silverPrice = parseFloat(price);
            if (isNaN(silverPrice) || silverPrice < 0) {
                deleteFilesOnError(req.files);
                return res.status(400).json({
                    message: 'Please provide a valid silver price (0 or greater).'
                });
            }
            updatedFields.price = silverPrice;
        }

        // Update goldPrice
        if (goldPrice !== undefined && goldPrice !== '') {
            const goldPriceValue = parseFloat(goldPrice);
            if (isNaN(goldPriceValue) || goldPriceValue < 0) {
                deleteFilesOnError(req.files);
                return res.status(400).json({
                    message: 'Please provide a valid gold price (0 or greater).'
                });
            }
            updatedFields.goldPrice = goldPriceValue;
        }

        // ✅ FIXED: Stock update - now checks for undefined properly
        if (stock !== undefined) {
            console.log('Stock field received:', stock, 'Type:', typeof stock);
            
            let parsedStock;
            if (stock === '' || stock === null) {
                parsedStock = 0;
            } else {
                parsedStock = Number(stock);
            }

            console.log('Parsed stock value:', parsedStock);

            if (isNaN(parsedStock) || parsedStock < 0) {
                deleteFilesOnError(req.files);
                return res.status(400).json({
                    message: 'Please provide a valid stock quantity (0 or greater).'
                });
            }

            updatedFields.stock = parsedStock;
            console.log('✅ Stock will be updated to:', parsedStock);
        }

        // category
        if (category !== undefined && String(category).trim() !== '') {
            updatedFields.category = String(category).trim();
        }

        // description
        if (description !== undefined && String(description).trim() !== '') {
            updatedFields.description = String(description).trim();
        }

        // Ensure at least one image remains
        if (!updatedFields.image || updatedFields.image.length === 0) {
            deleteFilesOnError(req.files);
            return res.status(400).json({
                message: "Product must have at least one image."
            });
        }

        console.log('Final fields to update:', updatedFields);

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            updatedFields,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedProduct) {
            return res.status(404).json({
                message: 'Product not found after update'
            });
        }

        console.log('=== UPDATE SUCCESSFUL ===');
        console.log('Product after update:', updatedProduct);
        console.log('Updated stock value:', updatedProduct.stock);

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
                deleteFile(imgPath);
            });
        }

        if (product.video) {
            deleteFile(product.video);
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