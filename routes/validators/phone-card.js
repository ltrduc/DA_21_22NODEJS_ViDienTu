const { check, validationResult } = require('express-validator');

module.exports = [
  check('number')
    .exists().withMessage('Chưa có số lượng thẻ, số lượng thẻ cần được gửi với key là number!')
    .notEmpty().withMessage('Vui lòng nhập số lượng thẻ muốn mua!')
]
