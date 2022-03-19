const express = require('express');
const multer = require('multer');
const bcrypt = require('bcrypt');
const fs = require('fs');
const { check, validationResult } = require('express-validator')
const nodemailer = require("nodemailer");
const { mailUser, mailPass } = process.env;

const router = express.Router();
const UserModel = require('../models/user');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/images');
  },
  filename: function (req, file, cb) {
    const filename = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, filename + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

const checkInputLogin = [
  check('username')
    .exists().withMessage('Chưa có số tài khoản, số tài khoản cần được gửi với key là username!')
    .notEmpty().withMessage('Vui lòng nhập số tài khoản!'),
  check('password')
    .exists().withMessage('Chưa có mật khẩu, mật khẩu cần được gửi với key là password!')
    .notEmpty().withMessage('Vui lòng nhập mật khẩu!')
    .isLength({ min: 6 }).withMessage('mật khẩu phải tối thiểu 6 chữ số!'),
];

const checkInputRegister = [
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
  res.render('auth/login', {
    error: req.flash('error') || '',
    username: req.flash('username') || '',
  });
});

router.post('/login', checkInputLogin, async (req, res, next) => {
  try {
    var result = validationResult(req);
    var { username, password } = req.body;

    req.flash('username', username);

    if (result.errors.length !== 0) {
      result = result.mapped();
      for (fields in result) {
        req.flash('error', result[fields].msg);
        return res.redirect('/auth/login');
      }
    }

    var user = await UserModel.findOne({ username }).exec();
    if (!user) {
      req.flash('error', "Số tài khoản hoặc mật khẩu không tồn tại!");
      return res.redirect('/auth/login');
    }

    var matched = bcrypt.compareSync(password, user.password)
    if (!matched) {
      req.flash('error', "Số tài khoản hoặc mật khẩu không tồn tại!");
      return res.redirect('/auth/login');
    }

    req.session.user = user;
    res.redirect('/');
  } catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }
});

/*
|--------------------------------------------------------------------------
| ĐĂNG KÝ TÀI KHOẢN NGƯỜI DÙNG
|--------------------------------------------------------------------------
*/
router.get('/register', (req, res, next) => {
  res.render('auth/register', {
    error: req.flash('error') || '',
    fullname: req.flash('fullname') || '',
    email: req.flash('email') || '',
    birthday: req.flash('birthday') || '',
    phone: req.flash('phone') || '',
    address: req.flash('address') || '',
  });
});

router.post('/register', upload.array('id_card', 3), checkInputRegister, async (req, res, next) => {
  try {
    var result = validationResult(req);
    var files = req.files;
    var { fullname, email, birthday, phone, address } = req.body;

    req.flash('fullname', fullname);
    req.flash('email', email);
    req.flash('birthday', birthday);
    req.flash('phone', phone);
    req.flash('address', address);

    if (result.errors.length !== 0) {
      result = result.mapped();
      for (let i = 0; i < files.length; i++) {
        fs.unlinkSync(files[i].path);
      }
      for (fields in result) {
        req.flash('error', result[fields].msg);
        return res.redirect('/auth/register');
      }
    }

    if (!files || files.length !== 2) {
      for (let i = 0; i < files.length; i++) {
        fs.unlinkSync(files[i].path);
      }
      req.flash('error', "Vui lòng cập nhật lại CMND/CCCD!");
      return res.redirect('/auth/register');
    }

    if (await UserModel.findOne({ email, phone }).exec()) {
      for (let i = 0; i < files.length; i++) {
        fs.unlinkSync(files[i].path);
      }
      req.flash('error', "Địa chỉ Email hoặc số điện thoại đã tồn tại!");
      return res.redirect('/auth/register');
    }

    while (true) {
      var username = parseInt(Math.floor(Math.random() * (9999999999 - 1000000000)) + 1000000000);
      var password = Math.random().toString(36).slice(-6);
      var hashed = bcrypt.hashSync(password, 10);
      var userDir = `public/uploads/${username}`;

      if (!await UserModel.findOne({ username }).exec()) {
        var user = await UserModel.create({ fullname, email, birthday, phone, address, username, password: hashed, id_card: [files[0].filename, files[1].filename,], role: 1, });
        if (user) {
          var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: `${mailUser}`,
              pass: `${mailPass}#`,
            }
          });

          transporter.sendMail({
            from: `${mailUser}`,
            to: `${email}`,
            subject: '[TB] THÔNG TIN TÀI KHOẢN KHÁCH HÀNG - NGÂN HÀNG OBANK',
            html: `<p>Cảm ơn bạn đã tin dùng ngân hàng của chúng tôi, đây là thông tin tài khoản của bạn:</p>
            <b>Tên khách hàng: </b>${fullname} <br> 
            <b>Số tài khoản: </b>${username} <br> 
            <b>Mật khẩu: </b>${password} 
            <p>Trân trọng ./.</p>`,
          });

          fs.mkdir(userDir, (error) => {
            if (error) {
              for (let i = 0; i < files.length; i++) {
                fs.unlinkSync(files[i].path);
              }
              req.flash('error', "Không thể tạo tài khoản, vui lòng thử lại!");
              return res.redirect('/auth/register');
            }
            for (let i = 0; i < files.length; i++) {
              fs.renameSync(files[i].path, `public/uploads/${username}/${files[i].filename}`);
            }
          })
          return res.redirect('/auth/email');
        }
      }
    }
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
  res.redirect("/auth/login");
});

router.get('/email', (req, res, next) => {
  res.render("auth/email");
});

module.exports = router;