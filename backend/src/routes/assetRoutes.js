const express = require('express');

const router = express.Router();

const upload = require('../middleware/uploadMiddleware');

const {
  uploadAsset,
  listAssets,
  removeAsset
} = require('../controllers/assetController');

// ปรับชื่อ Import ให้ตรงกับ middleware JWT ของ Phase 3
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get(
  '/games/:gameId/assets',
  listAssets
);

router.post(
  '/games/:gameId/assets',
  (req, res, next) => {
    upload.single('image')(req, res, (error) => {
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      next();
    });
  },
  uploadAsset
);

router.delete(
  '/games/:gameId/assets/:assetId',
  removeAsset
);

module.exports = router;