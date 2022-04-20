const userModel = require("../models/userModel")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const validator = require("../validators/validator")
const aws = require("../aws-link/aws")


//--------- create user --------------------------------------------------------------------------------------------------

const registerUser = async (req, res) => {
    try {
        const data = req.body
        const profileImage = req.files

        //  CHECK : if request body is empty
        if (!Object.keys(data).length > 0) return res.status(400).send({ status: false, error: "Please enter data" })

        let { phone, email, password } = data

        //  CHECK : if any data field is empty
        if (!validator.isValid(data.fname)) return res.status(400).send({ status: false, message: 'please provide first name' })
        if (!validator.isValid(data.lname)) return res.status(400).send({ status: false, message: 'please provide last name' })
        if (!validator.isValid(data.phone)) return res.status(400).send({ status: false, message: 'please provide phone' })
        if (!validator.isValid(data.email)) return res.status(400).send({ status: false, message: 'please provide email' })
        if (!validator.isValid(data.password)) return res.status(400).send({ status: false, message: 'please provide password' })

        if (!validator.isValid(data.address)) return res.status(400).send({ status: false, message: 'please provide Address' })
        let address = JSON.parse(data.address)
        if (!validator.isValid(address.shipping.street)) return res.status(400).send({ status: false, message: 'please provide shipping street' })
        if (!validator.isValid(address.shipping.city)) return res.status(400).send({ status: false, message: 'please provide shipping city' })
        if (!validator.isValid(address.shipping.pincode)) return res.status(400).send({ status: false, message: 'please provide shipping pincode' })
        if (!validator.isNumber(address.shipping.pincode)) return res.status(400).send({ status: false, message: 'please provide shipping pincode in digits' })

        if (!validator.isValid(address.billing.street)) return res.status(400).send({ status: false, message: 'please provide billing street' })
        if (!validator.isValid(address.billing.city)) return res.status(400).send({ status: false, message: 'please provide billing city' })
        if (!validator.isValid(address.billing.pincode)) return res.status(400).send({ status: false, message: 'please provide billing pincode' })
        if (!validator.isNumber(address.billing.pincode)) return res.status(400).send({ status: false, message: 'please provide billing pincode in digits' })

        //  CHECK : if any data field has invalid value or not in proper format
        if (!(validator.isValidPhone(phone) || validator.isValidPhone91(phone))) return res.status(400).send({ status: false, message: 'please provide valid mob no' })
        if (validator.isValidPhone(phone))  phone = "+91" + phone
        else if ( phone.startsWith("+"))    phone = phone
        else    phone = "+" + phone

        if (!validator.isValidEmail(data.email)) return res.status(400).send({ status: false, message: 'please provide valid email' })
        if (!validator.isValidPassword(data.password)) return res.status(400).send({ status: false, message: 'please provide valid password(minLength=8 , maxLength=16)' })
        if (!validator.isValidPincode(address.billing.pincode)) return res.status(400).send({ status: false, message: 'please provide valid billing pinCode' })
        if (!validator.isNumber(address.billing.pincode)) return res.status(400).send({ status: false, message: 'please provide billing pinCode (in number)' })
        if (!validator.isValidPincode(address.shipping.pincode)) return res.status(400).send({ status: false, message: 'please provide valid shipping pinCode' })
        if (!validator.isNumber(address.shipping.pincode)) return res.status(400).send({ status: false, message: 'please provide shipping pinCode (in number)' })
        
        //  CHECK : if any data field fails unique validation
        const isPhoneAlreadyUsed = await userModel.findOne({ phone })
        if (isPhoneAlreadyUsed) return res.status(400).send({ status: false, message: "This mobile is number already in use,please provide another mobile number" })

        const isEmailAlreadyUsed = await userModel.findOne({ email })
        if (isEmailAlreadyUsed) return res.status(400).send({ status: false, message: "This  is email already in use,please provide another email" })

        // ENCRYPTING PASSWORD
        let saltRounds = 10;
        let salt = await bcrypt.genSalt(saltRounds);
        let hash = await bcrypt.hash(password, salt);

        password = hash

        //  Create : aws link for profile image
        if (profileImage && profileImage.length > 0) var uploadedFileURL = await aws.uploadFile(profileImage[0])
        else return res.status(400).send({ status: false, message: 'please provide profile image' })

        //  CREATE :  user
        const user = {
            fname: data.fname,
            lname: data.lname,
            email: email,
            profileImage: uploadedFileURL,
            phone: phone,
            password: password,
            address: {
                shipping: {
                    street: address.shipping.street,
                    city: address.shipping.city,
                    pincode: address.shipping.pincode
                },
                billing: {
                    street: address.billing.street,
                    city: address.billing.city,
                    pincode: address.billing.pincode
                }
            }
        }
        const createdUser = await userModel.create(user)
        return res.status(201).send({ status: true, message: "User created successfully", data: createdUser })
    }
    catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: err.message })
    }
}



//------- log-in user -----------------------------------------------------------------------------------------------------------------------

const loginUser = async (req, res) => {
    try {
        let email = req.body.email;
        let password = req.body.password;

        // CHECK :  if email and password is not present or empty
        if (!validator.isValid(email)) return res.status(400).send({ status: false, message: " Please , enter email Id" })
        if (!validator.isValid(password)) return res.status(400).send({ status: false, message: " Please , enter password " })

        //  CHECK : if email is not in proper format
        if (!validator.isValidEmail(email)) return res.status(400).send({ status: false, message: 'please provide valid email' })

        //  CHECK : user with entered password and email is exist or not
        let user = await userModel.findOne({ email: email });
        if (!user) return res.status(404).send({ status: false, message: "No user found...." });

        // DECRYPTING PASSWORD
        let validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).send({ status: false, message: "Wrong password ,please enter correct password..." });

        //  GENERATE : token  
        const token = jwt.sign({
            userId: user._id.toString(),
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 30 * 60
        }, "Project-5/shopping-cart");

        return res.status(200).send({ status: true, message: "User login successfull", data: { usreId: user._id, token: token } });
    }
    catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: err.message })
    }
}

//------ get Profile Details -----------------------------------------------------------------------------------------------------------------

const getProfile = async (req, res) => {
    try {
        const userId = req.params.userId

        // Searching : user details 
        const userDetails = await userModel.findOne({ _id: userId })
        if (!userDetails) return res.status(404).send({ status: false, message: "No user Found" })

        return res.status(200).send({ status: false, message: "User profile details", data: userDetails })
    }
    catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: err.message })
    }
}


//------ update Profile Details -----------------------------------------------------------------------------------------------------------------

const updateProfile = async (req, res) => {
    try {
        const userId = req.params.userId
        const dataForUpdates = req.body
        const profileImage = req.files
        const newData = {}

        //  CHECK : if there is no data for updatation
        if (!(dataForUpdates && profileImage)) return res.status(400).send({ status: false, message: 'please provide some data for upadte profile' })

        // Searching : user details 
        const userDetails = await userModel.findOne({ _id: userId })
        if (!userDetails) return res.status(404).send({ status: false, message: "No user Found" })

        let { phone, email, password, fname, lname } = dataForUpdates

        //  CHECK : first name is EMPTY
        if (fname != null) {
            if (!validator.isValid(fname)) return res.status(400).send({ status: false, message: 'please provide first Name' })
            newData['fname'] = fname
        }
        //  CHECK : last name is EMPTY
        if (lname != null) {
            if (!validator.isValid(lname)) return res.status(400).send({ status: false, message: 'please provide last Name' })
            newData['lname'] = lname
        }
        //  CHECK : email
        if (email != null) {
            if (!validator.isValid(email)) return res.status(400).send({ status: false, message: 'please provide email' })
            //  CHECK : email is not valid email
            if (!validator.isValidEmail(email)) return res.status(400).send({ status: false, message: 'please provide valid email' })
            //  CHECK : email field fails unique validation
            const isEmailAlreadyUsed = await userModel.findOne({ email })
            if (isEmailAlreadyUsed) return res.status(400).send({ status: false, message: "This  is email already in use,please provide another email" })
            newData['email'] = dataForUpdates.email
        }
        //  CHECK : phone
        if (phone != null) {
            if (!validator.isValid(phone)) return res.status(400).send({ status: false, message: 'please provide phone number' })

            //  CHECK : phone is not valid phone number
            if (!(validator.isValidPhone(phone) || validator.isValidPhone91(phone))) return res.status(400).send({ status: false, message: 'please provide valid mob no' })
            if (validator.isValidPhone(phone))  phone = "+91" + phone
            else if ( phone.startsWith("+"))    phone = phone
            else    phone = "+" + phone

            //  CHECK : phone field fails unique validation
            const isPhoneAlreadyUsed = await userModel.findOne({ phone })
            if (isPhoneAlreadyUsed) return res.status(400).send({ status: false, message: "This mobile is number already in use,please provide another mobile number" })
            newData['phone'] = phone
        }
        //  CHECK : password
        if (password != null) {
            if (!validator.isValid(password)) return res.status(400).send({ status: false, message: 'please provide passwoed' })
            if (!validator.isValidPassword(password)) return res.status(400).send({ status: false, message: 'please provide valid password(minLength=8 , maxLength=16)' })
            let saltRounds = 10;
            let salt = await bcrypt.genSalt(saltRounds);
            let hash = await bcrypt.hash(dataForUpdates.password, salt);
            newData['password'] = hash
        }

        //  CHECK : address
        if (dataForUpdates.address != null) {
            const address = JSON.parse(dataForUpdates.address)
            if (address.shipping != null) {
                if (address.shipping.street != null) {
                    if (!validator.isValid(address.shipping.street)) {
                        return res.status(400).send({ status: false, message: ' Please provide street' })
                    }
                    newData['address.shipping.street'] = address.shipping.street
                }
                if (address.shipping.city != null) {
                    if (!validator.isValid(address.shipping.city)) {
                        return res.status(400).send({ status: false, message: ' Please provide city' })
                    }
                    newData['address.shipping.city'] = address.shipping.city
                }
                if (address.shipping.pincode != null) {
                    if (!validator.isValid(address.shipping.pincode)) {
                        return res.status(400).send({ status: false, message: ' Please provide shipping pincode' })
                    }
                    if (!validator.isValidPincode(address.shipping.pincode)) {
                        return res.status(400).send({ status: false, message: 'please provide valid shipping pinCode(in digits)' })
                    }
                    if (!validator.isNumber(address.shipping.pincode)) {
                        return res.status(400).send({ status: false, message: 'please provide shipping pinCode (in digits)' })
                    }
                    newData['address.shipping.pincode'] = address.shipping.pincode
                }
            }

            if (address.billing != null) {
                if (address.billing.street != null) {
                    if (!validator.isValid(address.billing.street)) {
                        return res.status(400).send({ status: false, message: ' Please provide street' })
                    }
                    newData['address.billing.street'] = address.billing.street
                }
                if (address.billing.city != null) {
                    if (!validator.isValid(address.billing.city)) {
                        return res.status(400).send({ status: false, message: ' Please provide city' })
                    }
                    newData['address.billing.city'] = address.billing.city
                }
                if (address.billing.pincode != null) {
                    if (!validator.isValid(address.billing.pincode)) {
                        return res.status(400).send({ status: false, message: ' Please provide billing pincode' })
                    }
                    //validate pincode is six digit or not
                    if (!validator.isValidPincode(address.billing.pincode)) {
                        return res.status(400).send({ status: false, message: 'please provide valid billing pinCode (in digits)' })
                    }
                    //validate pincode is number or not
                    if (!validator.isNumber(address.billing.pincode)) {
                        return res.status(400).send({ status: false, message: 'please provide billing pinCode (in digits)' })
                    }
                    newData['address.billing.pincode'] = address.billing.pincode
                }
            }
        }

        //  CHECK : profile image
        if (profileImage.length > 0) {
            var updateFileURL = await aws.uploadFile(profileImage[0])
            newData['profileImage'] = updateFileURL
        }

        const updatedUser = await userModel.findByIdAndUpdate({ _id: userId }, { ...newData }, { new: true })
        return res.status(200).send({ status: true, message: "User profile updated", data: updatedUser })

    }
    catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, message: err.message })
    }
}



module.exports.registerUser = registerUser
module.exports.loginUser = loginUser
module.exports.getProfile = getProfile
module.exports.updateProfile = updateProfile