const express = require('express');
const router = express.Router();

const userController = require("../controllers/userController")
const productController = require("../controllers/productController")
const cartController = require("../controllers/cartController")
const orderController = require("../controllers/orderController")
const { authorization } = require("../middlewares/auth-mw")


// --- User APIs -----------------------------------------------------------------------------------------------------------------------------------------------
router.post("/register", userController.registerUser)
router.post("/login", userController.loginUser)
router.get("/user/:userId/profile", authorization,userController.getProfile)
router.put("/user/:userId/profile", authorization, userController.updateProfile)

// --- Product APIs --------------------------------------------------------------------------------------------------------------------------------------------
router.post("/products", productController.createProduct)
router.get("/products", productController.getProductByFilter)
router.get("/products/:productId", productController.getProductById)
router.put("/products/:productId", productController.updateProductById)
router.delete("/products/:productId", productController.deleteProductById)

// --- Cart APIs ------------------------------------------------------------------------------------------------------------------------------------------------
router.post("/users/:userId/cart",authorization,  cartController.addToCart)
router.put("/users/:userId/cart", authorization, cartController.removeFromCart)
router.get("/users/:userId/cart", authorization, cartController.getCartData)
router.delete("/users/:userId/cart",authorization, cartController.deleteAllDataFromCart)

// --- Order APIs -------------------------------------------------------------------------------------------------------------------------------------------------
router.post("/users/:userId/orders", authorization, orderController.createOrder)
router.put("/users/:userId/orders", authorization, orderController.updateOrder)

module.exports = router;