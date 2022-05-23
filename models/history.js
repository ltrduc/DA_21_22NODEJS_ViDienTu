const mongoose = require('mongoose');

const history = new mongoose.Schema({
    transactionID: String,
    username: String,
    user_fullname: String,
    recipient_username: String,
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
// - Đăng chờ: đang chờ admin duyệt
// - Thành công: giao dịch thành công hoặc admin đã duyệt và giao dịch được thông qua
