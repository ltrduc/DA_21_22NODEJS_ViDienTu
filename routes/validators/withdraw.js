const { check, validationResult } = require('express-validator');

module.exports = [
  check('cardNumber')
    .exists().withMessage('Chưa có số thẻ, số thẻ cần được gửi với key là cardNumber!')
    .notEmpty().withMessage('Vui lòng nhập số thẻ!')
    .isLength({ min: 6, max: 6 }).withMessage('Số thẻ phải có đúng 6 chữ số!'),
  check('expDate')
    .exists().withMessage('Chưa có ngày hết hạn của thẻ, ngày hết hạn cần được gửi với key là expDate!')
    .notEmpty().withMessage('Vui lòng nhập ngày hết hạn của thẻ!'),
  check('cvv')
    .exists().withMessage('Chưa có mã CVV, mã CVV cần được gửi với key là cvv!')
    .notEmpty().withMessage('Vui lòng nhập mã CVV!')
    .isLength({ min: 3, max: 3 }).withMessage('Mã CVV phải có đúng 3 chữ số!'),
  check('amount')
    .exists().withMessage('Chưa có số tiền cần nạp, số tiền cần được gửi với key là amount!')
    .notEmpty().withMessage('Vui lòng nhập số tiền cần nạp!')
]