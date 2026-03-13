const express = require('express');
const router = express.Router();
const multer = require('multer');
const Case = require('../models/Case');
const { protect, authorize } = require('../middleware/auth');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// POST - Submit new case
router.post('/', protect, upload.array('attachments', 3), async (req, res) => {
    try {
        const { title, description, category, department, location, severity, isAnonymous } = req.body;
        const attachments = req.files?.map(f => f.filename) || [];
        const newCase = await Case.create({
            title, description, category, department, location, severity,
            isAnonymous: isAnonymous === 'true',
            submittedBy: isAnonymous === 'true' ? null : req.user._id,
            attachments
        });
        res.status(201).json(newCase);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET - All cases (secretariat/admin)
router.get('/', protect, authorize('secretariat', 'admin'), async (req, res) => {
    try {
        const { status, category, department } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (category) filter.category = category;
        if (department) filter.department = department;
        const cases = await Case.find(filter)
            .populate('submittedBy', 'name email department')
            .populate('assignedTo', 'name email')
            .sort({ createdAt: -1 });
        res.json(cases);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET - Cases assigned to case manager
router.get('/my', protect, authorize('case_manager'), async (req, res) => {
    try {
        const cases = await Case.find({ assignedTo: req.user._id })
            .populate('submittedBy', 'name department')
            .sort({ createdAt: -1 });
        res.json(cases);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET - Track case by tracking ID
router.get('/track/:trackingId', protect, async (req, res) => {
    try {
        const c = await Case.findOne({ trackingId: req.params.trackingId })
            .populate('assignedTo', 'name');
        if (!c) return res.status(404).json({ message: 'Case not found' });
        res.json(c);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH - Assign case to case manager
router.patch('/:id/assign', protect, authorize('secretariat', 'admin'), async (req, res) => {
    try {
        const c = await Case.findByIdAndUpdate(
            req.params.id,
            { assignedTo: req.body.assignedTo, status: 'Assigned' },
            { new: true }
        ).populate('assignedTo', 'name email');
        res.json(c);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH - Update case status and notes
router.patch('/:id/update', protect, authorize('case_manager', 'secretariat', 'admin'), async (req, res) => {
    try {
        const { status, note } = req.body;
        const c = await Case.findById(req.params.id);
        if (note) c.notes.push({ text: note, addedBy: req.user._id });
        if (status) c.status = status;
        if (status === 'Resolved') c.resolvedAt = new Date();
        c.lastResponseAt = new Date();
        await c.save();
        res.json(c);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST - Run escalation check
router.post('/run-escalation', protect, authorize('admin'), async (req, res) => {
    try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const result = await Case.updateMany(
            {
                status: { $in: ['Assigned', 'In Progress'] },
                lastResponseAt: { $lt: sevenDaysAgo },
                isEscalated: false
            },
            { status: 'Escalated', isEscalated: true }
        );
        res.json({ escalated: result.modifiedCount });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// GET - Staff sees their own submissions
router.get('/my-submissions', protect, async (req, res) => {
    try {
        const cases = await Case.find({ submittedBy: req.user._id })
            .sort({ createdAt: -1 });
        res.json(cases);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
module.exports = router;