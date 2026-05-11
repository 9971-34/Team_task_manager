const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateUser, deleteUser, getUserStats } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');

router.use(protect);

router.get('/stats/overview', isAdmin, getUserStats);
router.get('/', getAllUsers);
router.get('/:id', isAdmin, getUserById);
router.put('/:id', isAdmin, updateUser);
router.delete('/:id', isAdmin, deleteUser);

module.exports = router;