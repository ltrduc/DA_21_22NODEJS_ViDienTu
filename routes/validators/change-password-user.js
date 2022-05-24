const { check, validationResult } = require('express-validator');

module.exports = [
  check('oldPassword')
    .exists().withMessage('Chưa có mật khẩu cũ, mật khẩu cũ cần được gửi với key là oldPassword!')
    .notEmpty().withMessage('Vui lòng nhập mật khẩu cũ!'),
  check('newPassword')
    .exists().withMessage('Chưa có mật khẩu mới, mật khẩu mới cần được gửi với key là newPassword!')
    .notEmpty().withMessage('Vui lòng nhập mật khẩu mới!')
    .isLength({ min: 6 }).withMessage('mật khẩu phải tối thiểu 6 chữ số!'),
  check('confirmPassword')
    .exists().withMessage('Chưa có xác nhận mật khẩu, xác nhận mật khẩu cần được gửi với key là confirmPassword!')
    .notEmpty().withMessage('Vui lòng nhập xác nhận mật khẩu!')
    .isLength({ min: 6 }).withMessage('mật khẩu phải tối thiểu 6 chữ số!'),
]