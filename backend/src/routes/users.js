'use strict';
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
router.use(protect);
router.get('/profile', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist', 'name images price slug');
    res.json({ success: true, data: { user } });
  } catch(err) { next(err); }
});
module.exports = router;
