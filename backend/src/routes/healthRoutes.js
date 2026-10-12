const express = require('express');

const router = express.Router();

const {
  checkDatabase
} = require('../controllers/healthController');

router.get('/db', checkDatabase);

module.exports = router;