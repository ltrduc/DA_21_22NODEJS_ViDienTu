const mongoose = require('mongoose');

const password = new mongoose.Schema({
    id_user: mongoose.Schema.ObjectId,
    status: { type: Number, default: 0 },
}, { collection: 'password', versionKey: false });

const PasswordModel = mongoose.model('password', password);

module.exports = PasswordModel;