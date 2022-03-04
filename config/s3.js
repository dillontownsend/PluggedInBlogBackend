const S3 = require('aws-sdk/clients/s3')
const fs = require('fs')

const bucketName = process.env.BUCKET_NAME
const region = process.env.REGION
const accessKeyId = process.env.ACCESS_KEY_ID
const secretAccessKey = process.env.SECRET_ACCESS_KEY


const s3 = new S3({
    region,
    accessKeyId,
    secretAccessKey
})


// upload a file to the bucket
function uploadFile(file) {
    const fileStream = fs.createReadStream(file.path)

    const uploadParams = {
        Bucket: bucketName,
        Body: fileStream,
        Key: file.filename
    }

    return s3.upload(uploadParams).promise()
}
exports.uploadFile = uploadFile


// download a file from the bucket
function downloadFile(fileKey) {
    const downloadParams = {
        Key: fileKey,
        Bucket: bucketName,
    }

    return s3.getObject(downloadParams).createReadStream()
}
exports.downloadFile = downloadFile


// delete a file from the bucket
function deleteFile(fileKey) {
    const deleteParams = {
        Bucket: bucketName,
        Key: fileKey
    }

    return s3.deleteObject(deleteParams, (err, data) => {
        if (err) console.log(err)
    })
}
exports.deleteFile = deleteFile
