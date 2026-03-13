const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// GET - All users (admin only)
router.get('/', protect, authorize('admin'), async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET - Case managers only (for assignment dropdown)
router.get('/case-managers', protect, authorize('secretariat', 'admin'), async (req, res) => {
    try {
        const managers = await User.find({ role: 'case_manager' })
            .select('name email department');
        res.json(managers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH - Update user role/status (admin only)
router.patch('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        ).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE - Deactivate user (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ message: 'User deactivated' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;