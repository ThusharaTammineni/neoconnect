const express = require('express');
const router = express.Router();
const HubPost = require('../models/HubPost');
const multer = require('multer');
const { protect, authorize } = require('../middleware/auth');

const upload = multer({ dest: 'uploads/' });

// GET - All hub posts (all logged in staff)
router.get('/', protect, async (req, res) => {
    try {
        const { type, search } = req.query;
        const filter = {};
        if (type) filter.type = type;
        if (search) filter.title = { $regex: search, $options: 'i' };
        const posts = await HubPost.find(filter).sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST - Create hub post (secretariat only)
router.post('/', protect, authorize('secretariat', 'admin'), upload.single('file'), async (req, res) => {
    try {
        const data = { ...req.body, createdBy: req.user._id };
        if (req.file) data.fileUrl = req.file.filename;
        const post = await HubPost.create(data);
        res.status(201).json(post);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE - Remove hub post
router.delete('/:id', protect, authorize('secretariat', 'admin'), async (req, res) => {
    try {
        await HubPost.findByIdAndDelete(req.params.id);
        res.json({ message: 'Post deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
