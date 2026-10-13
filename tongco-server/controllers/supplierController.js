
const Supplier = require("../models/Supplier");
const { HttpStatus } = require("../config/constants");

const createSupplier = async (req, res) => {
    try {
        const {
            name,
            contactPerson,
            email,
            phone,
            address
        } = req.body;

        if (!name) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: "Supplier name is required"
            });
        }

        const existingSupplier = await Supplier.findOne({
            name: {
                $regex: `^${name}$`,
                $options: "i"
            }
        });

        if (existingSupplier) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: "Supplier already exists"
            });
        }

        const supplier = await Supplier.create({
            name,
            contactPerson,
            email,
            phone,
            address
        });

        res.status(HttpStatus.CREATED).json({
            success: true,
            message: "Supplier created successfully",
            count: 1,
            data: [supplier]
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to create supplier",
            error: error.message
        });
    }
};

const getSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find().sort({ name: 1 });

        res.status(HttpStatus.OK).json({
            success: true,
            message: "Suppliers retrieved successfully",
            count: suppliers.length,
            data: suppliers
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to retrieve suppliers",
            error: error.message
        });
    }
};

const getSupplierById = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(HttpStatus.NOT_FOUND).json({
                success: false,
                message: "Supplier not found",
                count: 0,
                data: []
            });
        }

        res.status(HttpStatus.OK).json({
            success: true,
            message: "Supplier retrieved successfully",
            count: 1,
            data: [supplier]
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to retrieve supplier",
            error: error.message
        });
    }
};

const updateSupplier = async (req, res) => {
    try {
        const {
            name,
            contactPerson,
            email,
            phone,
            address
        } = req.body;

        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(HttpStatus.NOT_FOUND).json({
                success: false,
                message: "Supplier not found"
            });
        }

        if (name) {
            const existingSupplier = await Supplier.findOne({
                name: {
                    $regex: `^${name}$`,
                    $options: "i"
                },
                _id: {
                    $ne: req.params.id
                }
            });

            if (existingSupplier) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    success: false,
                    message: "Supplier already exists"
                });
            }

            supplier.name = name;
        }

        if (contactPerson !== undefined) {
            supplier.contactPerson = contactPerson;
        }

        if (email !== undefined) {
            supplier.email = email;
        }

        if (phone !== undefined) {
            supplier.phone = phone;
        }

        if (address !== undefined) {
            supplier.address = address;
        }

        await supplier.save();

        res.status(HttpStatus.OK).json({
            success: true,
            message: "Supplier updated successfully",
            count: 1,
            data: [supplier]
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to update supplier",
            error: error.message
        });
    }
};

const deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(HttpStatus.NOT_FOUND).json({
                success: false,
                message: "Supplier not found"
            });
        }

        await supplier.deleteOne();

        res.status(HttpStatus.OK).json({
            success: true,
            message: "Supplier deleted successfully",
            count: 1,
            data: [supplier]
        });
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Failed to delete supplier",
            error: error.message
        });
    }
};

module.exports = {
    createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier
};
