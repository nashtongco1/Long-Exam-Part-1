const Product = require("../models/Product");
const Category = require("../models/Category");
const Supplier = require("../models/Supplier");
const cloudinary = require("../config/cloudinary");
const { HttpStatus } = require("../config/constants");

const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "bulldogs-exchange/products",
                resource_type: "image"
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        uploadStream.end(fileBuffer);
    });
};

const deleteFromCloudinary = async (publicId) => {
    if (!publicId) {
        return;
    }

    await cloudinary.uploader.destroy(publicId);
};

const createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            category,
            supplier,
            stock,
            image
        } = req.body;

        if (
            !name ||
            !description ||
            price === undefined ||
            !category ||
            !supplier ||
            stock === undefined
        ) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: "Please provide all required product fields",
                count: 0,
                data: []
            });
        }

        let imageUrl = image || "";
        let imagePublicId = "";

        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer);
            imageUrl = result.secure_url;
            imagePublicId = result.public_id;
        }

        const product = await Product.create({
            name,
            description,
            price,
            category,
            supplier,
            stock,
            image: imageUrl,
            imagePublicId
        });

        const populatedProduct = await Product.findById(product._id)
            .populate("category")
            .populate("supplier");

        res.status(HttpStatus.CREATED).json({
            success: true,
            message: "Product created successfully.",
            count: 1,
            data: [populatedProduct]
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to create product.",
            count: 0,
            data: [],
            error: error.message
        });
    }
};

const getProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            category,
            supplier,
            sort = "-createdAt",
            search
        } = req.query;

        const currentPage = Math.max(Number(page) || 1, 1);
        const pageLimit = Math.max(Number(limit) || 10, 1);
        const skip = (currentPage - 1) * pageLimit;

        const filter = {
            isActive: true
        };

        if (category) {
            const categoryData = await Category.findOne({
                name: {
                    $regex: `^${category}$`,
                    $options: "i"
                }
            });

            if (!categoryData) {
                return res.status(HttpStatus.OK).json({
                    success: true,
                    message: "Products retrieved successfully.",
                    count: 0,
                    data: [],
                    pagination: {
                        currentPage,
                        limit: pageLimit,
                        totalProducts: 0,
                        totalPages: 0,
                        hasNextPage: false,
                        hasPreviousPage: currentPage > 1
                    }
                });
            }

            filter.category = categoryData._id;
        }

        if (supplier) {
            const supplierData = await Supplier.findOne({
                name: {
                    $regex: `^${supplier}$`,
                    $options: "i"
                }
            });

            if (!supplierData) {
                return res.status(HttpStatus.OK).json({
                    success: true,
                    message: "Products retrieved successfully.",
                    count: 0,
                    data: [],
                    pagination: {
                        currentPage,
                        limit: pageLimit,
                        totalProducts: 0,
                        totalPages: 0,
                        hasNextPage: false,
                        hasPreviousPage: currentPage > 1
                    }
                });
            }

            filter.supplier = supplierData._id;
        }

        if (search) {
            filter.$or = [
                {
                    name: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    description: {
                        $regex: search,
                        $options: "i"
                    }
                }
            ];
        }

        const allowedSortFields = [
            "price",
            "name",
            "stock",
            "createdAt"
        ];

        let sortField = sort;
        let sortOrder = 1;

        if (sort.startsWith("-")) {
            sortField = sort.substring(1);
            sortOrder = -1;
        }

        if (!allowedSortFields.includes(sortField)) {
            sortField = "createdAt";
            sortOrder = -1;
        }

        const totalProducts = await Product.countDocuments(filter);

        const products = await Product.find(filter)
            .populate("category")
            .populate("supplier")
            .sort({
                [sortField]: sortOrder
            })
            .skip(skip)
            .limit(pageLimit);

        const totalPages = Math.ceil(
            totalProducts / pageLimit
        );

        res.status(HttpStatus.OK).json({
            success: true,
            message: "Products retrieved successfully.",
            count: products.length,
            data: products,
            pagination: {
                currentPage,
                limit: pageLimit,
                totalProducts,
                totalPages,
                hasNextPage: currentPage < totalPages,
                hasPreviousPage: currentPage > 1
            }
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to retrieve products.",
            count: 0,
            data: [],
            error: error.message
        });
    }
};

const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate("category")
            .populate("supplier");

        if (!product) {
            return res.status(HttpStatus.NOT_FOUND).json({
                success: false,
                message: "Product not found.",
                count: 0,
                data: []
            });
        }

        res.status(HttpStatus.OK).json({
            success: true,
            message: "Product retrieved successfully.",
            count: 1,
            data: [product]
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to retrieve product.",
            count: 0,
            data: [],
            error: error.message
        });
    }
};


const updateProduct = async (req, res) => {
    let newPublicId = null;
    let databaseUpdated = false;

    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(HttpStatus.NOT_FOUND).json({
                success: false,
                message: "Product not found.",
                count: 0,
                data: []
            });
        }

        const updateData = {
            ...req.body
        };

        const oldPublicId = product.imagePublicId;

        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer);

            newPublicId = result.public_id;
            updateData.image = result.secure_url;
            updateData.imagePublicId = result.public_id;
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        )
            .populate("category")
            .populate("supplier");

        if (!updatedProduct) {
            if (newPublicId) {
                await deleteFromCloudinary(newPublicId);
                newPublicId = null;
            }

            return res.status(HttpStatus.NOT_FOUND).json({
                success: false,
                message: "Product not found.",
                count: 0,
                data: []
            });
        }

        databaseUpdated = true;

        if (newPublicId && oldPublicId && oldPublicId !== newPublicId) {
            try {
                await deleteFromCloudinary(oldPublicId);
            } catch (cleanupError) {
                console.error("Failed to delete old product image:", cleanupError.message);
            }
        }

        return res.status(HttpStatus.OK).json({
            success: true,
            message: "Product updated successfully.",
            count: 1,
            data: [updatedProduct]
        });

    } catch (error) {
        if (newPublicId && !databaseUpdated) {
            try {
                await deleteFromCloudinary(newPublicId);
            } catch (cleanupError) {
                console.error("Failed to clean up new product image:", cleanupError.message);
            }
        }

        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to update product.",
            count: 0,
            data: [],
            error: error.message
        });
    }
};


const uploadProductImage = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(HttpStatus.NOT_FOUND).json({
                success: false,
                message: "Product not found.",
                count: 0,
                data: []
            });
        }

        if (!req.file) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: "Please upload an image file.",
                count: 0,
                data: []
            });
        }

        const result = await uploadToCloudinary(
            req.file.buffer
        );

        const oldPublicId = product.imagePublicId;

        product.image = result.secure_url;
        product.imagePublicId = result.public_id;

        await product.save();

        if (oldPublicId) {
            await deleteFromCloudinary(oldPublicId);
        }

        const updatedProduct = await Product.findById(
            product._id
        )
            .populate("category")
            .populate("supplier");

        res.status(HttpStatus.OK).json({
            success: true,
            message: "Product image uploaded successfully.",
            imageUrl: result.secure_url,
            publicId: result.public_id,
            count: 1,
            data: [updatedProduct]
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to upload product image.",
            count: 0,
            data: [],
            error: error.message
        });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(HttpStatus.NOT_FOUND).json({
                success: false,
                message: "Product not found.",
                count: 0,
                data: []
            });
        }

        if (product.imagePublicId) {
            await deleteFromCloudinary(product.imagePublicId);
        }

        await Product.findByIdAndDelete(req.params.id);

        res.status(HttpStatus.OK).json({
            success: true,
            message: "Product deleted successfully.",
            count: 1,
            data: [product]
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to delete product.",
            count: 0,
            data: [],
            error: error.message
        });
    }
};

module.exports = {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    uploadProductImage,
    deleteProduct
};
