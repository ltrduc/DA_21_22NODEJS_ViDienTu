const mongoose = require('mongoose');

const history = new mongoose.Schema({
    userID: String,
    user_fullname: String,
    recipientID: String,
    recipient_fullname: String,
    transaction_type: String,
    amount: Number,
    phonecardNumber: Number,
    fee: Number,
    message: String,
    status: String,
    made_at: { type: Date, default: Date.now },
}, { collection: 'history', versionKey: false });

const HistoryModel = mongoose.model('history', history);

module.exports = HistoryModel;

// status:
// - 0: đang chờ admin duyệt
// -1: admin đã duyệt và giao dịch được thông qua
