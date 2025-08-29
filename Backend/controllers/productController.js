// controllers/productController.js

const Product = require('../models/productModel');
const fs = require('fs');
const path = require('path');

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

exports.getProducts = async (req, res) => {
    try {
        const { category } = req.query;
        const filter = {};
        if (category) {
            filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
        }
        const products = await Product.find(filter);
        res.status(200).json(products);
    } catch (error) {
        console.error("Error in getProducts:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.addProduct = async (req, res) => {
    try {
        const { title, price, category, description } = req.body;
        const images = req.files.images || [];
        const video = req.files.video ? req.files.video[0] : null;

        if (!title || !price || !category || !description || images.length === 0) {
            deleteFilesOnError(req.files);
            return res.status(400).json({ message: 'Please fill title, price, category and upload at least one image.' });
        }

        const imagePaths = images.map(file => file.path);
        const videoPath = video ? video.path : null;

        const newProduct = new Product({
            sessionId: req.sessionID,
            title,
            category,
            description,
            price,
            image: imagePaths,
            video: videoPath
        });

        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);

    } catch (error) {
        console.error("Error in addProduct:", error);
        deleteFilesOnError(req.files);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { title, price, category, description } = req.body;
        const imageOrder = req.body.imageOrder ? JSON.parse(req.body.imageOrder) : [];
        const newImageFiles = req.files.images || [];
        const newVideoFile = req.files.video ? req.files.video[0] : null;

        const product = await Product.findById(req.params.id);

        if (!product) {
            deleteFilesOnError(req.files);
            return res.status(404).json({ message: 'Product not found' });
        }

        let newFileIndex = 0;
        const finalImagePaths = imageOrder.map(item => {
            if (item.startsWith('NEW_FILE_')) {
                const newFile = newImageFiles[newFileIndex++];
                return newFile ? newFile.path : null;
            }
            return item;
        }).filter(Boolean);

        const originalImages = product.image || [];
        const imagesToDelete = originalImages.filter(imgPath => !finalImagePaths.includes(imgPath));
        imagesToDelete.forEach(imgPath => {
            fs.unlink(path.resolve(imgPath), (err) => {
                if (err) console.error('Error deleting old image:', err);
            });
        });

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

        product.title = title || product.title;
        product.price = price || product.price;
        product.category = category || product.category;
        product.description = description || product.description;
        product.image = finalImagePaths;
        product.video = finalVideoPath;

        if (product.image.length === 0) {
            deleteFilesOnError(req.files);
            return res.status(400).json({ message: "Product must have at least one image." });
        }

        const updatedProduct = await product.save();
        res.status(200).json(updatedProduct);

    } catch (error) {
        console.error("Error in updateProduct:", error);
        deleteFilesOnError(req.files);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

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

        res.status(200).json({ message: 'Product removed' });
    } catch (error) {
        console.error("Error in deleteProduct:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};