const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: {
        type: String, 
        required: true, 
        unique: true,
        trim: true
    },
    description: {
        type: String, 
        required: true, 
        trim: true
    },
    price: {
        type: Number,
        required : true,
        trim : true
    },               // valid number/decimal
    currencyId: {
        type: String, 
        trim: true                          //INR
    },
    currencyFormat: {
        type: String,
        trim : true                              //  rs symbol
    },
    isFreeShipping: {
        type : Boolean, 
        default: false
    },
    productImage: {
        type : String, 
        required : true
    },  // s3 link
    style: {
        type : String,
        trim : true
    },
    availableSizes: {
        type : [ String ],
        required : true
    },
    installments: {
        type : Number,
        required: true
    },
    deletedAt: {
        type: Date,
        default : ""
    }, 
    isDeleted: {
        type : Boolean, 
        default: false}
}, { timestamps: true });

module.exports = mongoose.model('product', productSchema)