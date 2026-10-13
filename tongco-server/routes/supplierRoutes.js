const express = require("express");

const {
    createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier
} = require("../controllers/supplierController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", getSuppliers);

router.get("/:id", getSupplierById);

router.post(
    "/",
    protect,
    authorizeRoles("admin"),
    createSupplier
);

router.put(
    "/:id",
    protect,
    authorizeRoles("admin"),
    updateSupplier
);

router.delete(
    "/:id",
    protect,
    authorizeRoles("admin"),
    deleteSupplier
);

module.exports = router;