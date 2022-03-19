const mongoose = require('mongoose');

const user = new mongoose.Schema({
    fullname: String,
    email: String,
    birthday: Date,
    phone: String,
    address: String,
    username: String,
    password: String,
    id_card: Array,
    role: Number,
    activate: { type: Number, default: 0 },
    status: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
}, { collection: 'user', versionKey: false });

const UserModel = mongoose.model('user', user);

module.exports = UserModel;