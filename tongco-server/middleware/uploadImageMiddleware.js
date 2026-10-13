const multer = require("multer");
const FileType = require("file-type");

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPEG, PNG, and WebP image files are allowed."));
        }
    }
});

const validateImageContent = async (req, res, next) => {
    try {
        if (!req.file) {
            return next();
        }

        const detectedType = await FileType.fromBuffer(req.file.buffer);

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!detectedType || !allowedTypes.includes(detectedType.mime)) {
            return res.status(400).json({
                success: false,
                message: "Invalid image file. The uploaded file content is not a supported image."
            });
        }

        next();
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Unable to validate the uploaded image."
        });
    }
};

upload.validateImageContent = validateImageContent;

module.exports = upload;