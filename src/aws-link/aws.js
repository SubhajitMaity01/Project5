const aws = require("aws-sdk")

aws.config.update(
    {
        accessKeyId: "AKIAY3L35MCRVFM24Q7U",
        secretAccessKey: "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",
        region: "ap-south-1"
    }
)
let uploadFile = async (file) => {
    try {
        return new Promise(function (resolve, reject) {
            let s3 = new aws.S3({ apiVersion: "2006-03-01" })
            var uploadParams = {
                ACL: "public-read",
                Bucket: "classroom-training-bucket",
                Key: "subhajit/" + file.originalname,
                Body: file.buffer
            }
            s3.upload(uploadParams, function (err, data) {
                if (err) {
                    console.log("can't upload file")
                    return reject({ "error": err })
                }
                console.log(" file uploaded succesfully ")
                return resolve(data.Location)
            })
        })
    }
    catch (error) {
        console.log(error)
        res.status(500).send({ status: false, message: error.message })
    }
}


module.exports.uploadFile = uploadFile