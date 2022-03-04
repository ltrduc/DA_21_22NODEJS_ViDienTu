// require the library
const mongoose = require('mongoose');

// connect to the database
mongoose.connect('mongodb://localhost/obank');
// aquire the connection (to check if it is successful)
const db = mongoose.connection;
// error
db.on('error', console.error.bind(console, 'Lỗi kết nối đến cở sở dữ liệu!'));
// up and running then print the message
db.once('open', function () { console.log('Kết nối cơ sở dữ liệu thành công!'); });
// exporting the database
module.exports = db;