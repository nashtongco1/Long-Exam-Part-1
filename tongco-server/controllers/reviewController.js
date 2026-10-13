
const Review = require("../models/Review");
const Product = require("../models/Product");
const { HttpStatus } = require("../config/constants");

const createReview = async (req, res) => {
    try {
        const { product, rating, comment } = req.body;

        const numericRating = Number(rating);
        const cleanComment =
            typeof comment === "string"
                ? comment.trim()
                : "";

        if (!product || !cleanComment) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: "Product, rating, and comment are required"
            });
        }

        if (
            !Number.isInteger(numericRating) ||
            numericRating < 1 ||
            numericRating > 5
        ) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: "Rating must be between 1 and 5"
            });
        }

        const productExists = await Product.findById(product);

        if (!productExists) {
            return res.status(HttpStatus.NOT_FOUND).json({
                success: false,
                message: "Product not found"
            });
        }

        const existingReview = await Review.findOne({
            product,
            user: req.user._id
        });

        if (existingReview) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: "You already reviewed this product"
            });
        }

        const review = await Review.create({
            product,
            user: req.user._id,
            rating: numericRating,
            comment: cleanComment
        });

        const populatedReview = await Review.findById(
            review._id
        )
            .populate("user", "name email")
            .populate("product", "name");

        res.status(HttpStatus.CREATED).json({
            success: true,
            message: "Review created successfully",
            count: 1,
            data: [populatedReview]
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to create review",
            error: error.message
        });
    }
};

const getReviews = async (req, res) => {
    try {
        const filter = {};

        if (req.query.product) {
            filter.product = req.query.product;
        }

        const reviews = await Review.find(filter)
            .populate("user", "name email")
            .populate("product", "name")
            .sort({ createdAt: -1 });

        res.status(HttpStatus.OK).json({
            success: true,
            message: "Reviews retrieved successfully",
            count: reviews.length,
            data: reviews
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to retrieve reviews",
            error: error.message
        });
    }
};

const getReviewById = async (req, res) => {
    try {
        const review = await Review.findById(
            req.params.id
        )
            .populate("user", "name email")
            .populate("product", "name");

        if (!review) {
            return res.status(HttpStatus.NOT_FOUND).json({
                success: false,
                message: "Review not found",
                count: 0,
                data: []
            });
        }

        res.status(HttpStatus.OK).json({
            success: true,
            message: "Review retrieved successfully",
            count: 1,
            data: [review]
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to retrieve review",
            error: error.message
        });
    }
};

const updateReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;

        const review = await Review.findById(
            req.params.id
        );

        if (!review) {
            return res.status(HttpStatus.NOT_FOUND).json({
                success: false,
                message: "Review not found"
            });
        }

        const isOwner =
            review.user.toString() ===
            req.user._id.toString();

        const isAdmin =
            req.user.role?.toLowerCase() === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(HttpStatus.FORBIDDEN).json({
                success: false,
                message: "You are not authorized to update this review"
            });
        }

        if (rating !== undefined) {
            const numericRating = Number(rating);

            if (
                !Number.isInteger(numericRating) ||
                numericRating < 1 ||
                numericRating > 5
            ) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    success: false,
                    message: "Rating must be between 1 and 5"
                });
            }

            review.rating = numericRating;
        }

        if (comment !== undefined) {
            const cleanComment =
                typeof comment === "string"
                    ? comment.trim()
                    : "";

            if (!cleanComment) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    success: false,
                    message: "Review comment cannot be empty"
                });
            }

            review.comment = cleanComment;
        }

        await review.save();

        const updatedReview = await Review.findById(
            review._id
        )
            .populate("user", "name email")
            .populate("product", "name");

        res.status(HttpStatus.OK).json({
            success: true,
            message: "Review updated successfully",
            count: 1,
            data: [updatedReview]
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to update review",
            error: error.message
        });
    }
};

const deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(
            req.params.id
        );

        if (!review) {
            return res.status(HttpStatus.NOT_FOUND).json({
                success: false,
                message: "Review not found"
            });
        }

        const isOwner =
            review.user.toString() ===
            req.user._id.toString();

        const isAdmin =
            req.user.role?.toLowerCase() === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(HttpStatus.FORBIDDEN).json({
                success: false,
                message: "You are not authorized to delete this review"
            });
        }

        await review.deleteOne();

        res.status(HttpStatus.OK).json({
            success: true,
            message: "Review deleted successfully",
            count: 1,
            data: [review]
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to delete review",
            error: error.message
        });
    }
};

module.exports = {
    createReview,
    getReviews,
    getReviewById,
    updateReview,
    deleteReview
};
