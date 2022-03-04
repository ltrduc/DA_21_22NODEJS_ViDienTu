const express = require('express');
const multer = require('multer');
const bcrypt = require('bcrypt');
const fs = require('fs');
const { check, validationResult } = require('express-validator')

const router = express.Router();
const UserModel = require('../models/user');

//cấu hình lưu trữ file khi upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/temps');
  },
  filename: function (req, file, cb) {
    const filename = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, filename + '-' + file.originalname);
  }
});
//Khởi tạo middleware với cấu hình trên, lưu trên local của server khi dùng multer
const upload = multer({ storage: storage })

const checkLogin = [
  check('username')
    .exists().withMessage('Chưa có số tài khoản, số tài khoản cần được gửi với key là username!')
    .notEmpty().withMessage('Vui lòng nhập số tài khoản!'),
  check('password')
    .exists().withMessage('Chưa có mật khẩu, mật khẩu cần được gửi với key là password!')
    .notEmpty().withMessage('Vui lòng nhập mật khẩu!')
    .isLength({ min: 6 }).withMessage('mật khẩu phải tối thiểu 6 chữ số!'),
];

const checkRegister = [
  check('fullname')
    .exists().withMessage('Chưa có tên người dùng, tên người dùng cần được gửi với key là fullname!')
    .notEmpty().withMessage('Vui lòng nhập tên người dùng!'),
  check('email')
    .exists().withMessage('Chưa có địa chỉ Email, Email cần được gửi với key là email!')
    .notEmpty().withMessage('Vui lòng nhập địa chỉ Email!')
    .isEmail().withMessage('Địa chỉ Email không hợp lệ!'),
  check('birthday')
    .exists().withMessage('Chưa có ngày sinh, ngày sinh cần được gửi với key là birthday!')
    .notEmpty().withMessage('Vui lòng nhập ngày sinh!'),
  check('phone')
    .exists().withMessage('Chưa có số điện thoại, số điện thoại cần được gửi với key là phone!')
    .notEmpty().withMessage('Vui lòng nhập số điện thoại!')
    .isLength({ min: 10 }).withMessage('Số điện thoại phải tối thiểu 10 chữ số!')
    .isLength({ max: 11 }).withMessage('Số điện thoại phải tối đa 11 chữ số!'),
  check('address')
    .exists().withMessage('Chưa có địa chỉ hiện tại, địa chỉ hiện tại cần được gửi với key là address!')
    .notEmpty().withMessage('Vui lòng nhập địa chỉ hiện tại!'),
];

/*
|--------------------------------------------------------------------------
| ĐĂNG NHẬP TÀI KHOẢN NGƯỜI DÙNG
|--------------------------------------------------------------------------
*/
router.get('/login', (req, res, next) => {
  const error = req.flash('error') || '';
  const username = req.flash('username') || '';
  res.render('auth/login', { username, error });
});

router.post('/login', checkLogin, async (req, res, next) => {
  try {
    var result = validationResult(req);
    var { username, password } = req.body;

    req.flash('username', username);

    if (result.errors.length === 0) {
      var user = await UserModel.findOne({ username }).exec();
      if (!user) {
        req.flash('error', "Tài khoản hoặc mật khẩu không đúng!");
        return res.redirect('login');
      }

      var hashed = bcrypt.compareSync(password, user.password);
      if (!hashed) {
        req.flash('error', "Tài khoản hoặc mật khẩu không đúng!");
        return res.redirect('login');
      }

      req.session.user = user;
      return res.redirect('/');
    }

    result = result.mapped();
    for (fields in result) {
      req.flash('error', result[fields].msg);
      break;
    }
    return res.redirect('login');
  } catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }
});

/*
|--------------------------------------------------------------------------
| ĐĂNG XUẤT TÀI KHOẢN NGƯỜI DÙNG
|--------------------------------------------------------------------------
*/
router.get('/logout', (req, res, next) => {
  req.session.destroy();
});

/*
|--------------------------------------------------------------------------
| ĐĂNG KÝ TÀI KHOẢN NGƯỜI DÙNG
|--------------------------------------------------------------------------
*/
router.get('/register', (req, res, next) => {
  const error = req.flash('error') || '';
  const fullname = req.flash('fullname') || '';
  const email = req.flash('email') || '';
  const birthday = req.flash('birthday') || '';
  const phone = req.flash('phone') || '';
  const address = req.flash('address') || '';

  res.render('auth/register', { error, fullname, email, birthday, phone, address, });
});

router.post('/register', upload.array('id_card', 3), checkRegister, async (req, res, next) => {
  try {
    var result = validationResult(req);
    var files = req.files;
    var { fullname, email, birthday, phone, address } = req.body;

    req.flash('fullname', fullname);
    req.flash('email', email);
    req.flash('birthday', birthday);
    req.flash('phone', phone);
    req.flash('address', address);

    if (result.errors.length === 0) {
      if (await UserModel.findOne({ email, phone }).exec()) {
        req.flash('error', "Địa chỉ Email hoặc Số điện thoại đã tồn tại!");
        return res.redirect('register');
      }
      if (!files || files.length === 0 || files.length < 2) {
        req.flash('error', "Vui lòng cập nhật CMND/CCCD đầy đủ!");
        return res.redirect('register');
      }

      while (true) {
        var username = parseInt(Math.floor(Math.random() * (9999999999 - 1000000000)) + 1000000000);
        var password = Math.random().toString(36).slice(-6);
        var hashed = bcrypt.hashSync(password, 10);

        if (!(await UserModel.findOne({ username, hashed }).exec())) {
          var userDir = `public/uploads/${username}`

          fs.mkdir(userDir, (error) => {
            if (error) {
              req.flash('error', "Không thể tạo tài khoản, vui lòng thử lại!");
              return res.redirect('register');
            }
            for (let i = 0; i < files.length; i++) {
              fs.renameSync(files[i].path, `public/uploads/${username}/${files[i].filename}`);
            }
          })
          await UserModel.create({ fullname, email, birthday, phone, address, username, password: hashed, id_card: [files[0].filename, files[1].filename,], role: 1, });
          return res.render('auth/account', { fullname, email, username, password });
        }
      }
    }

    result = result.mapped();
    for (fields in result) {
      req.flash('error', result[fields].msg);
      break;
    }
    return res.redirect('register');
  } catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }
});

module.exports = router;