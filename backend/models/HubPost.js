const mongoose = require('mongoose');

const hubPostSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['digest', 'impact', 'minutes'],
        required: true
    },
    title: { type: String, required: true },
    content: { type: String },
    quarter: { type: String },
    whatWasRaised: { type: String },
    actionTaken: { type: String },
    whatChanged: { type: String },
    fileUrl: { type: String },
    tags: [String],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('HubPost', hubPostSchema);