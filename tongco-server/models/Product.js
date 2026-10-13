const mongoose = require("mongoose");
const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true
        },
        description: {
            type: String,
            required: [true, "Product description is required"],
            trim: true
        },
        price: {
            type: Number,
            required: [true, "Product price is required"],
            min: 0
        },
        stock: {
            type: Number,
            required: [true, "Stock is required"],
            min: 0,
            default: 0
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: [true, "Category is required"]
        },
        supplier: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Supplier",
            required: [true, "Supplier is required"]
        },
        image: {
            type: String,
            default: ""
        },
        imagePublicId: {
            type: String,
            default: ""
        },
        isActive: {
            type: Boolean,
            default: true
        },
        isAvailable: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ supplier: 1 });
productSchema.index({ price: 1 });

module.exports = mongoose.model("Product", productSchema);