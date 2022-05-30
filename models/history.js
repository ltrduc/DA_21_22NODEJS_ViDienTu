const mongoose = require('mongoose');

const history = new mongoose.Schema({
    transactionID: String, //ID LSGD
    username: String, //username người thực hiện giao dịch
    user_fullname: String,
    recipient_phone: String, //SĐT người nhận tiền (chức năng chuyển tiền)
    recipient_fullname: String,
    transaction_type: String, //tên loại giao dịch: nạp tiền, rút tiền, chuyển tiền, mua thẻ điện thoại
    amount: Number, //số tiền
    total: Number,
    operator: String, //nhà mạng viễn thông
    phonecard_amount: Number, //mệnh giá thẻ điện thoại
    phonecard_number: Number, // số lượng thẻ điên thoại
    phonecardNumber: Array, //mã thẻ điện thoại
    fee: Number, //phí thực hiện giao dịch
    message: String,
    status: String, // đang chờ, thành công hoặc thất bại 
    transaction_allowed: { type: Number, default: 1 }, //*
    made_at: { type: Date, default: Date.now },
}, { collection: 'history', versionKey: false });

const HistoryModel = mongoose.model('history', history);

module.exports = HistoryModel;

//*
// transaction_allowed:
// - 0: đang chờ admin duyệt
// - 1: giao dịch thành công hoặc admin đã duyệt và giao dịch được thông qua
