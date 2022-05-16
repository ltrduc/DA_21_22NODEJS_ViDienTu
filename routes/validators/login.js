const { check, validationResult } = require('express-validator');

module.exports = [
  check('username')
    .exists().withMessage('Chưa có số tài khoản, số tài khoản cần được gửi với key là username!')
    .notEmpty().withMessage('Vui lòng nhập số tài khoản!'),
  check('password')
    .exists().withMessage('Chưa có mật khẩu, mật khẩu cần được gửi với key là password!')
    .notEmpty().withMessage('Vui lòng nhập mật khẩu!')
    .isLength({ min: 6 }).withMessage('mật khẩu phải tối thiểu 6 chữ số!'),
]