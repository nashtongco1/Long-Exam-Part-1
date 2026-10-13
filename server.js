
const dotenv = require("dotenv");

dotenv.config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const connectDB = require("./tongco-server/config/db");

const authRoutes = require("./tongco-server/routes/authRoutes");
const userRoutes = require("./tongco-server/routes/userRoutes");
const productRoutes = require("./tongco-server/routes/productRoutes");
const categoryRoutes = require("./tongco-server/routes/categoryRoutes");
const supplierRoutes = require("./tongco-server/routes/supplierRoutes");
const reviewRoutes = require("./tongco-server/routes/reviewRoutes");
const orderRoutes = require("./tongco-server/routes/orderRoutes");

const auditLogger = require("./tongco-server/middleware/auditLoggerMiddleware");

const { apiLimiter } = require("./tongco-server/middleware/rateLimiterMiddleware");

const { notFound, errorHandler } = require("./tongco-server/middleware/errorMiddleware");

connectDB();

const app = express();

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "data:"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
            upgradeInsecureRequests: []
        }
    },
    frameguard: {
        action: "sameorigin"
    },
    referrerPolicy: {
        policy: "strict-origin-when-cross-origin"
    }
}));

const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
        "Origin",
        "X-Requested-With",
        "Accept",
        "Content-Type",
        "Authorization"
    ]
};

app.use(cors(corsOptions));

app.use(express.json({
    limit: "10mb"
}));

app.use(express.urlencoded({
    extended: true,
    limit: "10mb"
}));

app.use(auditLogger);

app.use("/api", (req, res, next) => {
    if (
        req.path === "/users" ||
        req.path.startsWith("/users/") ||
        req.path === "/v1/users" ||
        req.path.startsWith("/v1/users/")
    ) {
        return next();
    }

    return apiLimiter(req, res, next);
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/orders", orderRoutes);

app.use("/api/v1/products", productRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/suppliers", supplierRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/users", userRoutes);

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Bulldogs Exchange API Running"
    });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
