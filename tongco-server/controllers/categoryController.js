
const Category = require("../models/Category");
const { HttpStatus } = require("../config/constants");

const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: "Category name is required"
            });
        }

        const existingCategory = await Category.findOne({ name });

        if (existingCategory) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: "Category already exists"
            });
        }

        const category = await Category.create({
            name,
            description
        });

        res.status(HttpStatus.CREATED).json({
            success: true,
            message: "Category created successfully",
            count: 1,
            data: [category]
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to create category",
            count: 0,
            data: [],
            error: error.message
        });
    }
};

const getCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });

        res.status(HttpStatus.OK).json({
            success: true,
            message: "Categories retrieved successfully",
            count: categories.length,
            data: categories
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to retrieve categories",
            count: 0,
            data: [],
            error: error.message
        });
    }
};

const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(HttpStatus.NOT_FOUND).json({
                success: false,
                message: "Category not found",
                count: 0,
                data: []
            });
        }

        res.status(HttpStatus.OK).json({
            success: true,
            message: "Category retrieved successfully",
            count: 1,
            data: [category]
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to retrieve category",
            count: 0,
            data: [],
            error: error.message
        });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(HttpStatus.NOT_FOUND).json({
                success: false,
                message: "Category not found",
                count: 0,
                data: []
            });
        }

        if (name) {
            const existingCategory = await Category.findOne({
                name,
                _id: { $ne: req.params.id }
            });

            if (existingCategory) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    success: false,
                    message: "Category already exists",
                    count: 0,
                    data: []
                });
            }
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            {
                name,
                description
            },
            {
                new: true,
                runValidators: true
            }
        );

        res.status(HttpStatus.OK).json({
            success: true,
            message: "Category updated successfully",
            count: 1,
            data: [updatedCategory]
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to update category",
            count: 0,
            data: [],
            error: error.message
        });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);

        if (!category) {
            return res.status(HttpStatus.NOT_FOUND).json({
                success: false,
                message: "Category not found",
                count: 0,
                data: []
            });
        }

        res.status(HttpStatus.OK).json({
            success: true,
            message: "Category deleted successfully",
            count: 1,
            data: [category]
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to delete category",
            count: 0,
            data: [],
            error: error.message
        });
    }
};

module.exports = {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
};
