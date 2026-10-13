
const Order = require("../models/Order");
const Product = require("../models/Product");
const { HttpStatus } = require("../config/constants");


const addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const requestedQuantity = Number(quantity);

        if (!req.user?._id) {
            return res.status(401).json({
                success: false,
                message: "Please log in to add products to your cart"
            });
        }

        if (!productId || !Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: "Product and valid quantity are required"
            });
        }

        const product = await Product.findById(productId);

        if (!product || product.isAvailable === false || product.isActive === false) {
            return res.status(HttpStatus.NOT_FOUND).json({
                success: false,
                message: "Product not found or unavailable"
            });
        }

        if (requestedQuantity > product.stock) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: "Not enough product stock"
            });
        }

        let cart = await Order.findOne({
            user: req.user._id,
            status: "cart"
        });

        if (!cart) {
            cart = new Order({
                user: req.user._id,
                items: [],
                totalAmount: 0,
                status: "cart",
                paymentStatus: "pending",
                shippingAddress: "Pending"
            });
        }

        const existingItem = cart.items.find(
            (item) => item.product.toString() === product._id.toString()
        );

        if (existingItem) {
            const newQuantity = Number(existingItem.quantity) + requestedQuantity;

            if (newQuantity > product.stock) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    success: false,
                    message: "Not enough product stock"
                });
            }

            existingItem.quantity = newQuantity;
            existingItem.price = product.price;
        } else {
            cart.items.push({
                product: product._id,
                quantity: requestedQuantity,
                price: product.price
            });
        }

        cart.totalAmount = cart.items.reduce(
            (total, item) => total + Number(item.price) * Number(item.quantity),
            0
        );

        await cart.save();

        const populatedCart = await Order.findById(cart._id).populate(
            "items.product",
            "name price image stock isAvailable"
        );

        return res.status(HttpStatus.OK).json({
            success: true,
            message: "Product added to cart successfully",
            count: populatedCart.items.length,
            data: [populatedCart]
        });
    } catch (error) {
        console.error("Add to Cart Error:", error);

        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to add product to cart",
            error: error.message
        });
    }
};


const getCart = async (req, res) => {
    try {
        const cart = await Order.findOne({
            user: req.user._id,
            status: "cart"
        }).populate(
            "items.product",
            "name price image stock isAvailable"
        );

        if (!cart) {
            return res.status(HttpStatus.OK).json({
                success: true,
                message: "Cart retrieved successfully",
                count: 0,
                data: []
            });
        }

        res.status(HttpStatus.OK).json({
            success: true,
            message: "Cart retrieved successfully",
            count: cart.items.length,
            data: [cart]
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to retrieve cart",
            error: error.message
        });
    }
};

const checkoutOrder = async (req, res) => {
    try {
        const { shippingAddress } = req.body;

        if (!shippingAddress) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: "Shipping address is required"
            });
        }

        const cart = await Order.findOne({
            user: req.user._id,
            status: "cart"
        });

        if (!cart || cart.items.length === 0) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: "Cart is empty"
            });
        }

        for (const item of cart.items) {
            const product = await Product.findById(item.product);

            if (!product) {
                return res.status(HttpStatus.NOT_FOUND).json({
                    success: false,
                    message: "A product in the cart no longer exists"
                });
            }

            if (!product.isAvailable) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    success: false,
                    message: `${product.name} is unavailable`
                });
            }

            if (product.stock < item.quantity) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    success: false,
                    message: `Not enough stock for ${product.name}`
                });
            }
        }

        for (const item of cart.items) {
            const product = await Product.findById(item.product);

            product.stock -= item.quantity;

            if (product.stock === 0) {
                product.isAvailable = false;
            }

            await product.save();
        }

        cart.status = "ongoing";
        cart.paymentStatus = "pending";
        cart.shippingAddress = shippingAddress;
        cart.orderDate = new Date();

        await cart.save();

        const order = await Order.findById(cart._id)
            .populate(
                "items.product",
                "name price image stock isAvailable"
            );

        res.status(HttpStatus.OK).json({
            success: true,
            message: "Order placed successfully",
            count: 1,
            data: [order]
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to checkout order",
            error: error.message
        });
    }
};

const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            user: req.user._id,
            status: {
                $ne: "cart"
            }
        })
            .populate(
                "items.product",
                "name price image"
            )
            .sort({ createdAt: -1 });

        res.status(HttpStatus.OK).json({
            success: true,
            message: "Orders retrieved successfully",
            count: orders.length,
            data: orders
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to retrieve orders",
            error: error.message
        });
    }
};

const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            status: {
                $ne: "cart"
            }
        })
            .populate("user", "name email")
            .populate(
                "items.product",
                "name price image"
            )
            .sort({ createdAt: -1 });

        res.status(HttpStatus.OK).json({
            success: true,
            message: "Orders retrieved successfully",
            count: orders.length,
            data: orders
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to retrieve orders",
            error: error.message
        });
    }
};

const confirmOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(HttpStatus.NOT_FOUND).json({
                success: false,
                message: "Order not found"
            });
        }

        if (order.status !== "ongoing") {
            return res.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: "Only ongoing orders can be confirmed"
            });
        }

        order.status = "confirmed";

        await order.save();

        res.status(HttpStatus.OK).json({
            success: true,
            message: "Order confirmed successfully",
            count: 1,
            data: [order]
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to confirm order",
            error: error.message
        });
    }
};

const markOrderReady = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(HttpStatus.NOT_FOUND).json({
                success: false,
                message: "Order not found"
            });
        }

        if (order.status !== "confirmed") {
            return res.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: "Order must be confirmed first"
            });
        }

        order.status = "ready";

        await order.save();

        res.status(HttpStatus.OK).json({
            success: true,
            message: "Order is ready for claiming",
            count: 1,
            data: [order]
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to update order",
            error: error.message
        });
    }
};

const markOrderDelivered = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(HttpStatus.NOT_FOUND).json({
                success: false,
                message: "Order not found"
            });
        }

        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(HttpStatus.FORBIDDEN).json({
                success: false,
                message: "You are not authorized to update this order"
            });
        }

        if (order.status !== "ready") {
            return res.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: "Only ready orders can be marked as received"
            });
        }

        order.status = "delivered";

        await order.save();

        const updatedOrder = await Order.findById(order._id)
            .populate(
                "items.product",
                "name price image"
            );

        res.status(HttpStatus.OK).json({
            success: true,
            message: "Item received successfully. Order marked as delivered.",
            count: 1,
            data: [updatedOrder]
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to mark order as delivered",
            error: error.message
        });
    }
};

module.exports = {
    addToCart,
    getCart,
    checkoutOrder,
    getMyOrders,
    getAllOrders,
    confirmOrder,
    markOrderReady,
    markOrderDelivered
};
