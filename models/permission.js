const mongoose = require('mongoose');

const permission = new mongoose.Schema({
    id_user: mongoose.Schema.ObjectId,
    account_activated: { type: Number, default: 0 },
    account_disabled: { type: Number, default: 0 },
    account_blocked: { type: Number, default: 0 },
}, { collection: 'permission', versionKey: false });

const PermissionModel = mongoose.model('permission', permission);

module.exports = PermissionModel;