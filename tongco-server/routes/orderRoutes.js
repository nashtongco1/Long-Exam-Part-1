
const express = require("express");

const {
    addToCart,
    getCart,
    checkoutOrder,
    getMyOrders,
    getAllOrders,
    confirmOrder,
    markOrderReady,
    markOrderDelivered
} = require("../controllers/orderController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/cart", protect, authorizeRoles("customer"), addToCart);

router.get("/cart", protect, authorizeRoles("customer"), getCart);

router.post("/checkout", protect, authorizeRoles("customer"), checkoutOrder);

router.get("/my-orders", protect, authorizeRoles("customer"), getMyOrders);

router.get("/", protect, authorizeRoles("admin"), getAllOrders);

router.put("/:id/confirm", protect, authorizeRoles("admin"), confirmOrder);

router.put("/:id/ready", protect, authorizeRoles("admin"), markOrderReady);

router.put("/:id/delivered", protect, authorizeRoles("customer"), markOrderDelivered);

module.exports = router;
