const Product = require('../models/productModel');
const fs = require('fs');
const path = require('path');

// Helper function to delete files on error (handles arrays or single file objects)
const deleteFilesOnError = (files) => {
    if (!files) return;
    const allFiles = [];

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

        if (category) {
            filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
        }

        let sort = {};
        if (sortBy) {
            const order = sortOrder === 'desc' ? -1 : 1;
            sort[sortBy] = order;
        } else {
            sort = { createdAt: -1 };
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
        console.log('=== ADD PRODUCT START ===');
        console.log('Request body:', req.body);
        console.log('Request files:', req.files);

        const { title, price, goldPrice, category, description, stock, hasSilver, hasGold } = req.body;

        const images = req.files?.images || [];
        const videoFile = req.files?.video && req.files.video.length > 0 ? req.files.video[0] : (req.files?.video || null);

        // Parse boolean flags
        const isSilverProduct = hasSilver === 'true' || hasSilver === true;
        const isGoldProduct = hasGold === 'true' || hasGold === true;

        console.log('Has Silver Product:', isSilverProduct);
        console.log('Has Gold Product:', isGoldProduct);
        console.log('Silver Price received:', price);
        console.log('Gold Price received:', goldPrice);
        console.log('Stock received:', stock);

        // Validation - basic required fields
        if (!title || !category || !description) {
            deleteFilesOnError(req.files);
            return res.status(400).json({
                message: 'Please fill all required fields: title, category, and description.'
            });
        }

        // At least one product type must be selected
        if (!isSilverProduct && !isGoldProduct) {
            deleteFilesOnError(req.files);
            return res.status(400).json({
                message: 'Please select at least one product type (Silver or Gold).'
            });
        }

        if (!images || images.length === 0) {
            deleteFilesOnError(req.files);
            return res.status(400).json({
                message: 'Please upload at least one image.'
            });
        }

        // Parse and validate prices based on product type
        let silverPrice = null;
        let goldPriceValue = null;

        // If silver product, validate silver price
        if (isSilverProduct) {
            if (!price || price === '' || price === 'undefined') {
                deleteFilesOnError(req.files);
                return res.status(400).json({
                    message: 'Silver price is required for Silver products.'
                });
            }
            silverPrice = parseFloat(price);
            if (isNaN(silverPrice) || silverPrice < 0) {
                deleteFilesOnError(req.files);
                return res.status(400).json({
                    message: 'Please provide a valid silver price (0 or greater).'
                });
            }
        }

        // If gold product, validate gold price
        if (isGoldProduct) {
            if (!goldPrice || goldPrice === '' || goldPrice === 'undefined') {
                deleteFilesOnError(req.files);
                return res.status(400).json({
                    message: 'Gold price is required for Gold products.'
                });
            }
            goldPriceValue = parseFloat(goldPrice);
            if (isNaN(goldPriceValue) || goldPriceValue < 0) {
                deleteFilesOnError(req.files);
                return res.status(400).json({
                    message: 'Please provide a valid gold price (0 or greater).'
                });
            }
        }

        // Parse stock
        let stockValue = 0;
        if (stock !== undefined && stock !== null && stock !== '') {
            stockValue = Number(stock);
            if (isNaN(stockValue) || stockValue < 0) {
                deleteFilesOnError(req.files);
                return res.status(400).json({
                    message: 'Please provide a valid stock quantity (0 or greater).'
                });
            }
        }

        const imagePaths = images.map(file => file.path);
        const videoPath = videoFile ? videoFile.path : null;

        console.log('Final values to save:');
        console.log('- Has Silver:', isSilverProduct);
        console.log('- Has Gold:', isGoldProduct);
        console.log('- Silver price:', silverPrice);
        console.log('- Gold price:', goldPriceValue);
        console.log('- Stock:', stockValue);

        const newProduct = new Product({
            sessionId: req.sessionID,
            title: title.trim(),
            category: category.trim(),
            description: description.trim(),
            price: silverPrice,
            goldPrice: goldPriceValue,
            stock: stockValue,
            hasSilver: isSilverProduct,
            hasGold: isGoldProduct,
            image: imagePaths,
            video: videoPath
        });

        const savedProduct = await newProduct.save();
        console.log('✅ Product saved successfully:', savedProduct);

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

        const { title, price, goldPrice, category, description, stock, hasSilver, hasGold } = req.body;

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

        // Parse boolean flags
        const isSilverProduct = hasSilver === 'true' || hasSilver === true;
        const isGoldProduct = hasGold === 'true' || hasGold === true;

        console.log('Has Silver Product:', isSilverProduct);
        console.log('Has Gold Product:', isGoldProduct);
        console.log('Silver Price received:', price);
        console.log('Gold Price received:', goldPrice);
        console.log('Stock received:', stock);

        const product = await Product.findById(req.params.id);

        if (!product) {
            deleteFilesOnError(req.files);
            return res.status(404).json({
                message: 'Product not found'
            });
        }

        console.log('Current product before update:', {
            hasSilver: product.hasSilver,
            hasGold: product.hasGold,
            price: product.price,
            goldPrice: product.goldPrice,
            stock: product.stock
        });

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

        // Build updated fields
        let updatedFields = {
            title: product.title,
            price: product.price,
            goldPrice: product.goldPrice,
            stock: product.stock,
            hasSilver: product.hasSilver,
            hasGold: product.hasGold,
            category: product.category,
            description: product.description,
            image: finalImagePaths,
            video: finalVideoPath
        };

        // Update title
        if (title !== undefined && String(title).trim() !== '') {
            updatedFields.title = String(title).trim();
        }

        // Update category
        if (category !== undefined && String(category).trim() !== '') {
            updatedFields.category = String(category).trim();
        }

        // Update description
        if (description !== undefined && String(description).trim() !== '') {
            updatedFields.description = String(description).trim();
        }

        // Update product type flags
        if (hasSilver !== undefined) {
            updatedFields.hasSilver = isSilverProduct;
        }

        if (hasGold !== undefined) {
            updatedFields.hasGold = isGoldProduct;
        }

        // Validate at least one product type
        if (!updatedFields.hasSilver && !updatedFields.hasGold) {
            deleteFilesOnError(req.files);
            return res.status(400).json({
                message: 'Please select at least one product type (Silver or Gold).'
            });
        }

        // Update silver price
        if (updatedFields.hasSilver) {
            if (price !== undefined) {
                if (price === '' || price === null || price === 'undefined') {
                    deleteFilesOnError(req.files);
                    return res.status(400).json({
                        message: 'Silver price is required for Silver products.'
                    });
                }
                const silverPrice = parseFloat(price);
                if (isNaN(silverPrice) || silverPrice < 0) {
                    deleteFilesOnError(req.files);
                    return res.status(400).json({
                        message: 'Please provide a valid silver price (0 or greater).'
                    });
                }
                updatedFields.price = silverPrice;
            }
        } else {
            // If not a silver product, set price to null
            updatedFields.price = null;
        }

        // Update gold price
        if (updatedFields.hasGold) {
            if (goldPrice !== undefined) {
                if (goldPrice === '' || goldPrice === null || goldPrice === 'undefined') {
                    deleteFilesOnError(req.files);
                    return res.status(400).json({
                        message: 'Gold price is required for Gold products.'
                    });
                }
                const goldPriceValue = parseFloat(goldPrice);
                if (isNaN(goldPriceValue) || goldPriceValue < 0) {
                    deleteFilesOnError(req.files);
                    return res.status(400).json({
                        message: 'Please provide a valid gold price (0 or greater).'
                    });
                }
                updatedFields.goldPrice = goldPriceValue;
            }
        } else {
            // If not a gold product, set goldPrice to null
            updatedFields.goldPrice = null;
        }

        // Update stock
        if (stock !== undefined) {
            let parsedStock;
            if (stock === '' || stock === null) {
                parsedStock = 0;
            } else {
                parsedStock = Number(stock);
            }

            if (isNaN(parsedStock) || parsedStock < 0) {
                deleteFilesOnError(req.files);
                return res.status(400).json({
                    message: 'Please provide a valid stock quantity (0 or greater).'
                });
            }

            updatedFields.stock = parsedStock;
        }

        // Ensure at least one image
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
        console.log('✅ Product after update:', {
            hasSilver: updatedProduct.hasSilver,
            hasGold: updatedProduct.hasGold,
            silverPrice: updatedProduct.price,
            goldPrice: updatedProduct.goldPrice,
            stock: updatedProduct.stock
        });

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