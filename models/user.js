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
    role: { type: Number, default: 1 },
    activate: { type: Number, default: 0 },
    status: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
}, { collection: 'user', versionKey: false });

const UserModel = mongoose.model('user', user);

module.exports = UserModel;

// status:
// - 0: chưa đổi mật khẩu lần đầu
// -1: đã đổi mật khẩu lần đầu

// activate:
// - 0: chưa kích hoạt (yêu cầu bổ sung)
// - 1: đã kích hoạt (xác nhận)
// - 2: vô hiệu hóa (hủy)
// - 3: khóa vô thời hạn