const isValid = function (value) {
    if (typeof (value) === 'undefined' || typeof (value) === 'null') return false
    else if (typeof (value) === 'string' && value.trim().length > 0) return true
    else if (typeof (value) === 'number') return true
    else if (typeof (value) === 'object' && value.length > 0) return true
}

const isValidPhone = function (phone) {
    if (/^\+?([6-9]{1})\)?[-. ]?([0-9]{4})[-. ]?([0-9]{5})$/.test(phone)) return true
}
const isValidPhone91 = function (phone) {
    if (/^\+?([9]{1})\)?([1]{1})\)?([6-9]{1})\)?[-. ]?([0-9]{9})$/.test(phone)) return true
}

const isValidEmail = function (email) {
    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) return true
}

const isValidPassword = function (password) {
    if (/^[a-zA-Z0-9!@#$%^&*]{8,15}$/.test(password)) return true
}

const isValidID = function(id) {
    if (/^[0-9a-fA-F]{24}$/.test(id)) return true
}

const isValidSize = function (value) {
    let enumValue = ["S", "XS", "M", "X", "L", "XXL", "XL","s", "xs", "m", "x", "l", "xxl", "xl"]
    for (let x of value) {
        if (enumValue.includes(x) == false)  return false
    }
    return true;
}
const isValidStatus = function (value) {
    let enumValue = ["pending", "completed", "cancelled", "Pending", "Completed", "Cancelled"]
    for (let i=0 ; i<enumValue.length ; i++) {
        if (value == enumValue[i])  return true
    }
    return false;
}

const isValidPincode = function (pincode) {
    if ( /^\+?([1-9]{1})\)?([0-9]{5})$/.test(pincode)) return true
}

const isNumber = function (number) {
    return /^[+-]?([0-9]+\.?[0-9]*|\.[0-9]+)$/.test(number);
}

const isArray = function(arr){
    if (typeof (arr) === "object") {
        arr = arr.filter(x => x.trim())
        if (arr.length == 0)  return false
      }
      return true
}

module.exports.isValid = isValid
module.exports.isValidEmail = isValidEmail
module.exports.isValidPassword = isValidPassword
module.exports.isValidPhone = isValidPhone
module.exports.isValidPhone91 = isValidPhone91
module.exports.isValidID = isValidID
module.exports.isValidSize = isValidSize
module.exports.isValidPincode = isValidPincode
module.exports.isNumber = isNumber
module.exports.isArray = isArray
module.exports.isValidStatus = isValidStatus





//  /^\+?([9]{1})\)?([1]{1})\)?([6-9]{1})\)?[-. ]?([0-9]{9})$/
//  /^\+?([6-9]{1})\)?[-. ]?([0-9]{4})[-. ]?([0-9]{5})$/