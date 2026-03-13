const express = require('express');
const router = express.Router();
const Poll = require('../models/Poll');
const { protect, authorize } = require('../middleware/auth');

// POST - Create poll (secretariat only)
router.post('/', protect, authorize('secretariat', 'admin'), async (req, res) => {
    try {
        const { question, options, expiresAt } = req.body;
        const poll = await Poll.create({
            question,
            options: options.map(text => ({ text, votes: [] })),
            createdBy: req.user._id,
            expiresAt
        });
        res.status(201).json(poll);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET - All active polls
router.get('/', protect, async (req, res) => {
    try {
        const polls = await Poll.find({ isActive: true })
            .populate('createdBy', 'name');
        res.json(polls);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST - Vote on a poll
router.post('/:id/vote', protect, async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.id);
        if (!poll) return res.status(404).json({ message: 'Poll not found' });

        const alreadyVoted = poll.options.some(opt =>
            opt.votes.some(v => v.toString() === req.user._id.toString())
        );
        if (alreadyVoted) return res.status(400).json({ message: 'Already voted' });

        const option = poll.options.id(req.body.optionId);
        if (!option) return res.status(404).json({ message: 'Option not found' });

        option.votes.push(req.user._id);
        await poll.save();
        res.json(poll);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE - Close a poll
router.delete('/:id', protect, authorize('secretariat', 'admin'), async (req, res) => {
    try {
        await Poll.findByIdAndUpdate(req.params.id, { isActive: false });
        res.json({ message: 'Poll closed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;