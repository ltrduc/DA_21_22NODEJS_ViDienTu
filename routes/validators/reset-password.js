const { check, validationResult } = require('express-validator');

module.exports = [
  check('email')
    .exists().withMessage('Chưa có địa chỉ Email, Email cần được gửi với key là email!')
    .notEmpty().withMessage('Vui lòng nhập địa chỉ Email!')
    .isEmail().withMessage('Địa chỉ Email không hợp lệ!'),
  check('phone')
    .exists().withMessage('Chưa có số điện thoại, Số điện thoại cần được gửi với key là phone!')
    .notEmpty().withMessage('Vui lòng nhập số điện thoại!'),
]
