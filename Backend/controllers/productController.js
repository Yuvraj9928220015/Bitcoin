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
            const filePath = path.resolve(file.path);
            fs.unlink(filePath, (err) => {
                if (err) console.log('Error deleting orphaned file:', err);
            });
        });
    }
};

// Helper function to safely delete file
const deleteFile = (filePath) => {
    if (filePath) {
        const fullPath = path.resolve(filePath);
        fs.unlink(fullPath, (err) => {
            if (err) console.error('Error deleting file:', err);
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
        console.log('Request body:', req.body);
        console.log('Request files:', req.files);

        const { title, price, goldPrice, category, description } = req.body;
        // CRITICAL: Get stock value directly from req.body and handle it carefully
        const rawStock = req.body.stock; 
        
        const images = req.files?.images || [];
        const video = req.files?.video && req.files.video.length > 0 ? req.files.video[0] : null;

        console.log('Images:', images);
        console.log('Video:', video);
        console.log('Stock received (raw):', rawStock, 'Type:', typeof rawStock);

        // Validation - Check if stock is provided and is a valid number
        if (!title || !price || !goldPrice || !category || !description || rawStock === undefined || rawStock === null || rawStock === '') {
            deleteFilesOnError(req.files);
            return res.status(400).json({ 
                message: 'Please fill all required fields: title, silver price, gold price, category, description, and stock.' 
            });
        }

        if (images.length === 0) {
            deleteFilesOnError(req.files);
            return res.status(400).json({ 
                message: 'Please upload at least one image.' 
            });
        }

        // Validate and parse price and stock values
        const silverPrice = parseFloat(price);
        const goldPriceValue = parseFloat(goldPrice);
        // Correctly parse stock value
        const stockValue = parseInt(rawStock, 10); 

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
        const videoPath = video ? video.path : null;

        console.log('Image paths:', imagePaths);
        console.log('Video path:', videoPath);
        console.log('Stock value to save:', stockValue); // This is now guaranteed an integer

        const newProduct = new Product({
            sessionId: req.sessionID,
            title: title.trim(),
            category: category.trim(),
            description: description.trim(),
            price: silverPrice,
            goldPrice: goldPriceValue,
            stock: stockValue, // Assign the parsed integer value
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

        const { title, price, goldPrice, category, description } = req.body;
        // CRITICAL: Get raw stock value directly from req.body
        const rawStock = req.body.stock; 
        
        const imageOrder = req.body.imageOrder ? JSON.parse(req.body.imageOrder) : [];
        const newImageFiles = req.files?.images || [];
        const newVideoFile = req.files?.video && req.files.video.length > 0 ? req.files.video[0] : null;

        console.log('Stock received for update (raw):', rawStock, 'Type:', typeof rawStock);

        const product = await Product.findById(req.params.id);

        if (!product) {
            deleteFilesOnError(req.files);
            return res.status(404).json({ 
                message: 'Product not found' 
            });
        }

        console.log('Current product stock before update:', product.stock);

        // Handle image updates (rest of this section remains the same)
        let newFileIndex = 0;
        const finalImagePaths = imageOrder.length > 0 
            ? imageOrder.map(item => {
                if (item.startsWith('NEW_FILE_')) {
                    const newFile = newImageFiles[newFileIndex++];
                    return newFile ? newFile.path : null;
                }
                return item;
            }).filter(Boolean)
            : product.image || [];

        // If new images are uploaded but no order is specified, use the new images
        if (newImageFiles.length > 0 && imageOrder.length === 0) {
            finalImagePaths.push(...newImageFiles.map(file => file.path));
        }

        // Delete removed images
        const originalImages = product.image || [];
        const imagesToDelete = originalImages.filter(imgPath => !finalImagePaths.includes(imgPath));
        imagesToDelete.forEach(imgPath => {
            deleteFile(imgPath);
        });

        // Handle video updates (rest of this section remains the same)
        let finalVideoPath = product.video;
        const oldVideoPath = product.video;

        if (newVideoFile) {
            console.log('New video file uploaded:', newVideoFile.path);
            finalVideoPath = newVideoFile.path;
            // Delete old video if exists
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

        // Update fields - Initialize with current values from the product object
        let updatedFields = {
            title: product.title,
            price: product.price,
            goldPrice: product.goldPrice,
            stock: product.stock, // Start with existing stock
            category: product.category,
            description: product.description,
            image: finalImagePaths,
            video: finalVideoPath
        };

        // Update title if provided
        if (title !== undefined && title.trim() !== '') {
            updatedFields.title = title.trim();
        }

        // Update price if provided
        if (price !== undefined) {
            const silverPrice = parseFloat(price);
            if (isNaN(silverPrice) || silverPrice < 0) {
                deleteFilesOnError(req.files);
                return res.status(400).json({ 
                    message: 'Please provide a valid silver price (0 or greater).' 
                });
            }
            updatedFields.price = silverPrice;
        }

        // Update gold price if provided
        if (goldPrice !== undefined) {
            const goldPriceValue = parseFloat(goldPrice);
            if (isNaN(goldPriceValue) || goldPriceValue < 0) {
                deleteFilesOnError(req.files);
                return res.status(400).json({ 
                    message: 'Please provide a valid gold price (0 or greater).' 
                });
            }
            updatedFields.goldPrice = goldPriceValue;
        }

        // CRITICAL FIX: Stock update - Always process stock if it's in the request body
        // Ensure rawStock is not null, undefined or empty string before parsing
        if (rawStock !== undefined && rawStock !== null) { // Check for undefined and null
            let parsedStock;
            if (rawStock === '') { // If empty string, treat as 0
                parsedStock = 0;
            } else {
                parsedStock = parseInt(rawStock, 10);
            }

            console.log('Parsed stock value:', parsedStock);
            
            if (isNaN(parsedStock) || parsedStock < 0) {
                deleteFilesOnError(req.files);
                return res.status(400).json({ 
                    message: 'Please provide a valid stock quantity (0 or greater).' 
                });
            }
            updatedFields.stock = parsedStock; // Assign the parsed integer value
            console.log('Stock will be updated to:', parsedStock);
        }


        // Update category if provided
        if (category !== undefined && category.trim() !== '') {
            updatedFields.category = category.trim();
        }

        // Update description if provided
        if (description !== undefined && description.trim() !== '') {
            updatedFields.description = description.trim();
        }

        // Ensure product has at least one image
        if (updatedFields.image.length === 0) {
            deleteFilesOnError(req.files);
            return res.status(400).json({ 
                message: "Product must have at least one image." 
            });
        }

        console.log('Fields to update:', updatedFields);
        console.log('Stock field specifically:', updatedFields.stock, 'Type:', typeof updatedFields.stock);

        // Use findByIdAndUpdate to ensure the update happens
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { $set: updatedFields }, // Use $set to update specific fields
            { 
                new: true,           // Return the updated document
                runValidators: true, // Run model validators
                overwrite: false     // Important: Do not overwrite the entire document, only specified fields
            }
        );

        if (!updatedProduct) {
            return res.status(404).json({ 
                message: 'Product not found after update' 
            });
        }

        console.log('=== UPDATE SUCCESSFUL ===');
        console.log('Product after update:', updatedProduct);
        console.log('Updated stock value:', updatedProduct.stock, 'Type:', typeof updatedProduct.stock);
        console.log('========================');
        
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