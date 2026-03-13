const mongoose = require('mongoose');

const generateTrackingId = async () => {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Case').countDocuments({
        createdAt: { $gte: new Date(`${year}-01-01`) }
    });
    return `NEO-${year}-${String(count + 1).padStart(3, '0')}`;
};

const caseSchema = new mongoose.Schema({
    trackingId: { type: String, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
        type: String,
        enum: ['Safety', 'Policy', 'Facilities', 'HR', 'Other'],
        required: true
    },
    department: { type: String, required: true },
    location: { type: String },
    severity: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    status: {
        type: String,
        enum: ['New', 'Assigned', 'In Progress', 'Pending', 'Resolved', 'Escalated'],
        default: 'New'
    },
    isAnonymous: { type: Boolean, default: false },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    attachments: [{ type: String }],
    notes: [{
        text: { type: String },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now }
    }],
    lastResponseAt: { type: Date },
    isEscalated: { type: Boolean, default: false },
    resolvedAt: { type: Date }
}, { timestamps: true });

caseSchema.pre('save', async function () {
    if (!this.trackingId) {
        this.trackingId = await generateTrackingId();
    }
});

module.exports = mongoose.model('Case', caseSchema);