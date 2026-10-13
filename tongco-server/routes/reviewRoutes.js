const express = require("express");

const {
    createReview,
    getReviews,
    getReviewById,
    updateReview,
    deleteReview
} = require("../controllers/reviewController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", getReviews);

router.get("/:id", getReviewById);

router.post(
    "/",
    protect,
    authorizeRoles("customer"),
    createReview
);

router.put(
    "/:id",
    protect,
    authorizeRoles("customer", "admin"),
    updateReview
);

router.delete(
    "/:id",
    protect,
    authorizeRoles("customer", "admin"),
    deleteReview
);

module.exports = router;