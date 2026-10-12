const multer = require('multer');

const allowedTypes = [
  'image/jpeg',
  'image/png',
  'image/webp'
];

const upload = multer({
  storage: multer.memoryStorage(),

  fileFilter: (req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error('Only JPG, PNG and WebP images are allowed')
      );
    }

    cb(null, true);
  },

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1
  }
});

module.exports = upload;