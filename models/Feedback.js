const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  type: { type: String, enum: ['Suggestion', 'Bug', 'Compliment', 'Other', 'suggestion', 'bug', 'compliment', 'other'], default: 'Suggestion' },
  message: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5 },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
