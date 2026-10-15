const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

function uploadImage(buffer, { gameId, assetType }) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `visual-novel/games/${gameId}/${assetType}`,
        resource_type: 'image',
        overwrite: false
      },
      (error, result) => error ? reject(error) : resolve(result)
    );
    stream.end(buffer);
  });
}

function deleteImage(publicId) {
  return cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
}

module.exports = { uploadImage, deleteImage };
