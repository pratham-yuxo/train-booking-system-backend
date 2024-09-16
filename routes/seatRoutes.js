const express = require('express');
const { getSeats, bookSeats } = require('../controllers/seatController');

const router = express.Router();

router.get('/seats', getSeats);
router.post('/book', bookSeats);

module.exports = router;
