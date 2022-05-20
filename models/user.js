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
    balance: { type: Number, default: 0 },
    role: { type: Number, default: 1 },
    created_at: { type: Date, default: Date },
}, { collection: 'user', versionKey: false });

const UserModel = mongoose.model('user', user);

module.exports = UserModel;