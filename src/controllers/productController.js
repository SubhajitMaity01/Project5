const productModel = require("../models/productModel")
const validator = require("../validators/validator")
const aws = require("../aws-link/aws")


//--- Create Product ----------------------------------------------------------------------------------------------------------------------------------------------------

const createProduct = async (req, res) => {
    try {
        const data = req.body
        const productImage = req.files
        const product = {}

        //  CHECK : if request body is empty
        if (!Object.keys(data).length > 0) return res.status(400).send({ status: false, error: "Please enter data" })

        const { title, description, currencyId, currencyFormat, isFreeShipping, style } = data

        //  CHECK : if any data field is empty
        if (!validator.isValid(title)) return res.status(400).send({ status: false, message: 'please provide title' })
        product['title'] = title

        if (!validator.isValid(description)) return res.status(400).send({ status: false, message: 'please provide description' })
        product['description'] = description

        if (!validator.isValid(data.price)) return res.status(400).send({ status: false, message: 'please provide price' })
        //CHECK : price is number or not
        if (!validator.isNumber(data.price)) return res.status(400).send({ status: false, message: 'please provide price in digits' })
        product['price'] = data.price


        if (isFreeShipping != null) {
            if (!(isFreeShipping == "true" || isFreeShipping == "false")) return res.status(400).send({ status: false, message: 'please provide valid isFreeShipping(true / false)' })
            if (isFreeShipping == "true") product['isFreeShipping'] = true
            else product['isFreeShipping'] = false
        }
        if (style != null) {
            if (!validator.isValid(style)) return res.status(400).send({ status: false, message: 'please provide style' })
            product['style'] = style
        }
        if (!validator.isValid(data.installments)) return res.status(400).send({ status: false, message: 'please provide installments' })
        if (!validator.isNumber(data.installments)) return res.status(400).send({ status: false, message: 'please provide installments in digits' })
        product['installments'] = data.installments

        if (currencyId != null) {
            if (!validator.isValid(currencyId)) return res.status(400).send({ status: false, message: 'please provide currencyId' })
            if (currencyId != "INR") return res.status(400).send({ status: false, message: 'please provide valid currencyId' })
            product['currencyId'] = currencyId
        }
        else product['currencyId'] = "INR"
        if (currencyFormat != null) {
            if (!validator.isValid(currencyFormat)) return res.status(400).send({ status: false, message: 'please provide currencyFormat' })
            if (currencyFormat != "₹") return res.status(400).send({ status: false, message: 'please provide valid currencyFormat' })
            product['currencyFormat'] = currencyFormat
        }
        else product['currencyFormat'] = "₹"

        if (!data.availableSizes) return res.status(400).send({ status: false, message: 'please provide Sizes' })
        availableSizes = JSON.parse(data.availableSizes)
        if (!validator.isArray(availableSizes)) return res.status(400).send({ status: false, message: 'please provide Sizes in Array ' })
        if (!validator.isValidSize(availableSizes)) return res.status(400).send({ status: false, message: 'please provide valid Sizes' })
        product['availableSizes'] = availableSizes

        const isTitleAlreadyUsed = await productModel.findOne({ title })
        if (isTitleAlreadyUsed) return res.status(400).send({ status: false, message: "This  is title already in use,please provide another title" })

        //  Create : aws link for profile image
        if (productImage && productImage.length > 0) var uploadedFileURL = await aws.uploadFile(productImage[0])
        else return res.status(400).send({ status: false, message: 'please provide product image' })
        product['productImage'] = uploadedFileURL

        //  SETTING : defaults
        product['isDeleted'] = false
        product['deletedAt'] = ""

        const createdUser = await productModel.create(product)
        return res.status(201).send({ status: true, message: "User created successfully", data: createdUser })
    }
    catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: err.message })
    }
}


//=== Get Product's Details by Filters ----------------------------------------------------------------------------------------------------------------------------------

const getProductByFilter = async (req, res) => {
    try {
        const filters = req.query
        const finalFilters = { isDeleted: false }

        const { name, size, priceGreaterThan, priceLessThan, priceSort } = filters

        if (name != null) {
            if (!validator.isValid(name)) return res.status(400).send({ status: false, message: "Please enter Product name" })
            finalFilters['title'] = { $regex: `.*${name.trim()}.*` }
        }
        if (size != null) {
            if (!validator.isValid(size)) return res.status(400).send({ status: false, message: "Please enter size" })
            if (!validator.isValidSize(size)) return res.status(400).send({ status: false, message: "Please enter valid size" })
            finalFilters['availableSizes'] = { $in: [size.toLowerCase(), size.toUpperCase()] }
        }

        if (priceLessThan != null && priceGreaterThan != null) {
            if (!validator.isValid(priceLessThan)) return res.status(400).send({ status: false, message: "Please enter priceLessThan" })
            if (!validator.isNumber(priceLessThan)) return res.status(400).send({ status: false, message: "Please enter priceLessThan in digits" })
            if (!validator.isValid(priceGreaterThan)) return res.status(400).send({ status: false, message: "Please enter priceGreaterThan" })
            if (!validator.isNumber(priceGreaterThan)) return res.status(400).send({ status: false, message: "Please enter priceGreaterThan in digits" })
            if (priceGreaterThan > priceLessThan) return res.status(400).send({ status: false, message: "priceGreaterThan cannot be greater than priceLessThan" })
            finalFilters['price'] = { $lte: priceLessThan, $gte: priceGreaterThan }
        }
        else if (priceGreaterThan != null) {
            if (!validator.isValid(priceGreaterThan)) return res.status(400).send({ status: false, message: "Please enter priceGreaterThan" })
            if (!validator.isNumber(priceGreaterThan)) return res.status(400).send({ status: false, message: "Please enter priceGreaterThan in digits" })
            let x = parseInt(priceGreaterThan)
            finalFilters['price'] = { $gte: x }
        }
        else if (priceLessThan != null) {
            if (!validator.isValid(priceLessThan)) return res.status(400).send({ status: false, message: "Please enter priceLessThan" })
            if (!validator.isNumber(priceLessThan)) return res.status(400).send({ status: false, message: "Please enter priceLessThan in digits" })
            finalFilters['price'] = { $lte: priceLessThan }
        }

        if (priceSort != null) {
            if (!(priceSort == "1" || priceSort == "-1")) return res.status(400).send({
                status: false,
                message: "Please enter valid input for sorting in price ....... 1 : for ascending order or -1 : for descending order "
            })

            if (priceSort == "1") {
                const allProducts = await productModel.find(finalFilters).select({
                    title: 1, description: 1, price: 1, currencyFormat: 1, currencyId: 1, isFreeShipping: 1, productImage: 1, style: 1, availableSizes: 1, installments: 1, _id: 0
                }).sort({ price: 1 })
                if (allProducts.length == 0) return res.status(404).send({ status: false, message: "No Product Found" })
                return res.status(200).send({ status: true, message: "Product List", data: allProducts })
            }
            else if (priceSort == "-1") {
                const allProducts = await productModel.find(finalFilters).select({
                    title: 1, description: 1, price: 1, currencyFormat: 1, currencyId: 1, isFreeShipping: 1, productImage: 1, style: 1, availableSizes: 1, installments: 1, _id: 0
                }).sort({ price: -1 })
                if (allProducts.length == 0) return res.status(404).send({ status: false, message: "Product not Found" })
                return res.status(200).send({ status: true, message: "Product List", data: allProducts })
            }
        }

        const allProducts = await productModel.find(finalFilters).select({
            title: 1, description: 1, price: 1, currencyFormat: 1, currencyId: 1, isFreeShipping: 1, productImage: 1, style: 1, availableSizes: 1, installments: 1, _id: 0
        }).sort({ price: 1 })

        if (allProducts.length == 0) return res.status(404).send({ status: false, message: "Product not Found" })

        return res.status(200).send({ status: true, message: "Product List", data: allProducts })

    }
    catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: err.message })
    }
}


//--- Get Product Details BY ID--------------------------------------------------------------------------------------------------------------------------------------

const getProductById = async (req, res) => {
    try {
        const productId = req.params.productId

        if (Object.keys(productId) == 0) return res.status(400).send({ status: false, message: "Please enter productId in path param....." })
        if (!validator.isValidID(productId)) return res.status(400).send({ status: false, message: "Please enter valid productId" })

        // Searching : user details 
        const productDetails = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!productDetails) return res.status(404).send({ status: false, message: "No Product Found" })

        return res.status(200).send({ status: false, message: "Product details", data: productDetails })
    }
    catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }
}


//--- Update Product Details by ID -------------------------------------------------------------------------------------------------------------------------------

const updateProductById = async (req, res) => {
    try {
        const productId = req.params.productId
        const dataForUpdates = req.body
        const productImage = req.files
        const newData = {}

        if (Object.keys(productId) == 0) return res.status(400).send({ status: false, message: "Please enter productId in path param....." })
        if (!validator.isValidID(productId)) return res.status(400).send({ status: false, message: "Please enter valid productId" })

        //  CHECK : if there is no data for updatation
        if (!(dataForUpdates && productImage)) return res.status(400).send({ status: false, message: 'please provide some data for upadte profile' })

        // Searching : user details 
        const productDetails = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!productDetails) return res.status(404).send({ status: false, message: "Product not Found" })

        const { title, description, currencyId, currencyFormat, isFreeShipping, style } = dataForUpdates

        if (title != null) {
            if (!validator.isValid(title)) return res.status(400).send({ status: false, message: 'please provide title' })
            const isTitleAlreadyUsed = await productModel.findOne({ title })
            if (isTitleAlreadyUsed) return res.status(400).send({ status: false, message: "This  is title already in use,please provide another title" })
            newData['title'] = title
        }
        if (description != null) {
            if (!validator.isValid(description)) return res.status(400).send({ status: false, message: 'please provide description' })
            newData['description'] = description
        }
        if (currencyId != null) {
            if (!validator.isValid(currencyId)) return res.status(400).send({ status: false, message: 'please provide currencyId' })
            if (currencyId != "INR") return res.status(400).send({ status: false, message: 'please provide valid currencyId' })
            newData['currencyId'] = currencyId
        }
        if (currencyFormat != null) {
            if (!validator.isValid(currencyFormat)) return res.status(400).send({ status: false, message: 'please provide currencyFormat' })
            if (currencyFormat != "₹") return res.status(400).send({ status: false, message: 'please provide valid currencyFormat' })
            newData['currencyFormat'] = currencyFormat
        }
        if (isFreeShipping != null) {
            if (!(isFreeShipping == "true" || isFreeShipping == "false")) return res.status(400).send({ status: false, message: 'please provide valid isFreeShipping(true / false)' })
            if (isFreeShipping == "true") newData['isFreeShipping'] = true
            else newData['isFreeShipping'] = false
        }
        if (style != null) {
            if (!validator.isValid(style)) return res.status(400).send({ status: false, message: 'please provide style' })
            newData['style'] = style
        }
        if (dataForUpdates.installments != null) {
            if (!validator.isValid(dataForUpdates.installments)) return res.status(400).send({ status: false, message: 'please provide installments' })
            if (!validator.isNumber(dataForUpdates.installments)) return res.status(400).send({ status: false, message: 'please provide installments in digits' })
            newData['installments'] = dataForUpdates.installments
        }
        if (dataForUpdates.availableSizes != null) {
            if (!validator.isValid(dataForUpdates.availableSizes)) return res.status(400).send({ status: false, message: 'please provide Sizes' })
            const availableSizes = JSON.parse(dataForUpdates.availableSizes)
            if (!validator.isArray(availableSizes)) return res.status(400).send({ status: false, message: 'please provide Sizes in array' })
            if (!validator.isValidSize(availableSizes)) return res.status(400).send({ status: false, message: 'please provide valid Sizes' })
            newData['availableSizes'] = availableSizes
        }
        if (dataForUpdates.price != null) {
            if (!validator.isValid(dataForUpdates.price)) return res.status(400).send({ status: false, message: 'please provide price' })
            if (!validator.isNumber(dataForUpdates.price)) return res.status(400).send({ status: false, message: 'please provide price in digits' })
            newData['price'] = dataForUpdates.price
        }

        
        if (productImage.length > 0 ) {
            var updateFileURL = await aws.uploadFile(productImage[0])
            newData['productImage'] = updateFileURL
        }

        const updatedProduct = await productModel.findByIdAndUpdate({ _id: productId }, { ...newData }, { new: true })
        return res.status(200).send({ status: false, message: "Product updated successfully", data: updatedProduct })
    }
    catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: err.message })
    }
}


//--- Delete Product -------------------------------------------------------------------------------------------------------------------------------------

const deleteProductById = async (req, res) => {
    try {
        const productId = req.params.productId

        if (Object.keys(productId) == 0) return res.status(400).send({ status: false, message: "Please enter productId in path param....." })
        if (!validator.isValidID(productId)) return res.status(400).send({ status: false, message: "Please enter valid productId" })

        // Searching : user details 
        const productDetails = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!productDetails) return res.status(404).send({ status: false, message: "Product not Found" })

        const updatedProduct = await productModel.findByIdAndUpdate({ _id: productId }, { isDeleted: true, deletedAt: new Date() })
        return res.status(200).send({ status: true, message: "Product deleted successfully" })
    }
    catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: err.message })
    }
}

module.exports.createProduct = createProduct
module.exports.getProductByFilter = getProductByFilter
module.exports.getProductById = getProductById
module.exports.updateProductById = updateProductById
module.exports.deleteProductById = deleteProductById