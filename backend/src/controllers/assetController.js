const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const Asset = require('../models/assetModel');

const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

const allowedTypes = [
  'background',
  'character',
  'cover',
  'thumbnail'
];

const imageTypes = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

function detectImageType(buffer) {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) return 'image/jpeg';

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
    )
  ) return 'image/png';

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) return 'image/webp';

  return null;
}

function getSafeFilePath(filePath) {
  const filename = path.basename(filePath);

  if (
    !/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(filename) ||
    filePath !== `/uploads/${filename}`
  ) {
    return null;
  }

  return path.join(UPLOAD_DIR, filename);
}

async function uploadAsset(req, res) {
  let savedFile = null;

  try {
    const gameId = Number(req.params.gameId);
    const userId = req.user.userId;

    if (!Number.isSafeInteger(gameId) || gameId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid game ID'
      });
    }

    const game = await Asset.getGameByOwner(gameId, userId);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    const { asset_name, asset_type } = req.body;

    if (
      !req.file ||
      !asset_name?.trim() ||
      !allowedTypes.includes(asset_type)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Valid image, asset_name and asset_type are required'
      });
    }

    if (asset_name.trim().length > 255) {
      return res.status(400).json({
        success: false,
        message: 'Asset name is too long'
      });
    }

    const mimeType = detectImageType(req.file.buffer);

    if (!mimeType || mimeType !== req.file.mimetype) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image file'
      });
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const filename = `${crypto.randomUUID()}.${imageTypes[mimeType]}`;
    savedFile = path.join(UPLOAD_DIR, filename);

    await fs.writeFile(savedFile, req.file.buffer, { flag: 'wx' });

    const filePath = `/uploads/${filename}`;

    const assetId = await Asset.createAsset({
      gameId,
      userId,
      name: asset_name.trim(),
      type: asset_type,
      filePath,
      mimeType,
      fileSize: req.file.size
    });

    return res.status(201).json({
      success: true,
      message: 'Asset uploaded successfully',
      asset: {
        asset_id: assetId,
        game_id: gameId,
        asset_name: asset_name.trim(),
        asset_type,
        file_path: filePath,
        mime_type: mimeType,
        file_size: req.file.size
      }
    });
  } catch (error) {
    if (savedFile) {
      await fs.unlink(savedFile).catch(() => {});
    }

    console.error('Upload asset error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to upload asset'
    });
  }
}

async function listAssets(req, res) {
  try {
    const gameId = Number(req.params.gameId);
    const userId = req.user.userId;

    if (!Number.isSafeInteger(gameId) || gameId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid game ID'
      });
    }

    const game = await Asset.getGameByOwner(gameId, userId);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    const assets = await Asset.getAssetsByGame(gameId);

    return res.json({
      success: true,
      assets
    });
  } catch (error) {
    console.error('List assets error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to load assets'
    });
  }
}

async function removeAsset(req, res) {
  try {
    const gameId = Number(req.params.gameId);
    const assetId = Number(req.params.assetId);
    const userId = req.user.userId;

    if (
      !Number.isSafeInteger(gameId) || gameId <= 0 ||
      !Number.isSafeInteger(assetId) || assetId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID'
      });
    }

    const game = await Asset.getGameByOwner(gameId, userId);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    const asset = await Asset.getAssetById(assetId, gameId);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    try {
      const deleted = await Asset.deleteAsset(assetId, gameId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Asset not found'
        });
      }
    } catch (error) {
      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({
          success: false,
          message: 'Asset is currently used by a character expression'
        });
      }

      throw error;
    }

    // เก็บไฟล์ไว้ก่อนเพื่อหลีกเลี่ยงการทำให้ Graph
    // หรือ Game Cover ที่อ้างอิง URL เดิมแสดงภาพไม่ได้
    return res.json({
      success: true,
      message: 'Asset record deleted successfully'
    });
  } catch (error) {
    console.error('Delete asset error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to delete asset'
    });
  }
}

module.exports = {
  uploadAsset,
  listAssets,
  removeAsset
};