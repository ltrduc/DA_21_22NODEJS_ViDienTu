const mongoose = require('mongoose');

const password = new mongoose.Schema({
    id_user: mongoose.Schema.ObjectId,
    status: { type: Number, default: 0 },
    error: { type: Number, default: 0 },
    time_be_unblocked: Date,
}, { collection: 'password', versionKey: false });

const PasswordModel = mongoose.model('password', password);

module.exports = PasswordModel;