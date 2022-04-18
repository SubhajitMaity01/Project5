const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId

const cartSchema = new mongoose.Schema({
    userId: {
        type: ObjectId, 
        ref: "user", 
        required: 'userId is required', 
        unique: true
    },
    items: [{
            _id: 0 ,
            productId: {
                type: ObjectId,
                required: 'productId is required',
                refs: "product"
            },
            quantity: {
                type: Number,
                required: "Enter quantity required",
                min: 1
            }
        }] ,
    totalPrice: {
        type: Number, 
        required: true,
    },
    totalItems: {
        type: Number, 
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('cart', cartSchema)
