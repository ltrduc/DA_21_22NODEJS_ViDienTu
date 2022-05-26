const express = require('express');
const multer = require('multer');
const bcrypt = require('bcrypt');
const fs = require('fs');
const { check, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const { mailHost, mailUser, mailPass, mailPort } = process.env;

const router = express.Router();

// Import Model
const UserModel = require('../models/user');
const PasswordModel = require('../models/password');
const PermissionModel = require('../models/permission');

// Import Middleware
const Auth = require('../middleware/auth');

// Import Validators
const RegisterValidator = require('./validators/register');
const LoginValidator = require('./validators/login');
const ChangePasswordValidator = require('./validators/change-password');
const ResetPasswordValidator = require('./validators/reset-password');

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/uploads/images');
    },
    filename: function (req, file, cb) {
      const filename = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, filename + '-' + file.originalname);
    }
  })
});

/*
|------------------------------------------------------------------------------------------------------
| ĐĂNG NHẬP TÀI KHOẢN NGƯỜI DÙNG
|------------------------------------------------------------------------------------------------------
*/
router.get('/login', Auth.checkLogin, (req, res, next) => {
  var user = await UserModel.findOne({ username: 'admin' }).exec();
  if (!user) {
    var password = '123456';
    var hashed = bcrypt.hashSync(password, 10);
    var admin = await UserModel.create({ fullname: 'admin', email: null, birthday: null, phone: null, address: null, username: 'admin', password: hashed, id_card: [], role: 0 })
    if (admin) {
      var pass = await PasswordModel.create({ id_user: admin.id })
      if (pass) await PasswordModel.findOneAndUpdate({ id_user: admin.id }, { status: 1 }).exec();
      var permis = await PermissionModel.create({ id_user: admin.id })
      if (permis) await PermissionModel.findOneAndUpdate({ id_user: admin.id }, { account_activated: 1 }).exec();
    }
  }
  
  res.render('auth/login', {
    error: req.flash('error') || '',
    username: req.flash('username') || '',
  });
});

router.post('/login', LoginValidator, async (req, res, next) => {
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
      req.flash('error', 'Số tài khoản hoặc mật khẩu không tồn tại!');
      return res.redirect('/auth/login');
    }

    var matched = bcrypt.compareSync(password, user.password)
    if (!matched) {
      req.flash('error', 'Số tài khoản hoặc mật khẩu không tồn tại!');
      return res.redirect('/auth/login');
    }

    var pass = await PasswordModel.findOne({ id_user: user.id }).exec();
    var permission = await PermissionModel.findOne({ id_user: user.id }).exec();

    req.session.user = {
      id: user.id,
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      birthday: user.birthday,
      phone: user.phone,
      address: user.address,
      balance: user.balance,
      role: user.role,
      activate: {
        account_wait_activated: permission.account_wait_activated,
        account_activated: permission.account_activated,
        account_disabled: permission.account_disabled,
        account_blocked: permission.account_blocked
      },
      status: pass.status,
      id_card: user.id_card,
    };

    if (req.session.user.role == 0) {
      return res.redirect('/admin');
    }

    return res.redirect('/');
  } catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }
});

/*
|------------------------------------------------------------------------------------------------------
| ĐĂNG KÝ TÀI KHOẢN NGƯỜI DÙNG
|------------------------------------------------------------------------------------------------------
*/
router.get('/register', Auth.checkLogin, (req, res, next) => {
  res.render('auth/register', {
    error: req.flash('error') || '',
    fullname: req.flash('fullname') || '',
    email: req.flash('email') || '',
    birthday: req.flash('birthday') || '',
    phone: req.flash('phone') || '',
    address: req.flash('address') || '',
  });
});

router.post('/register', upload.array('id_card', 3), RegisterValidator, async (req, res, next) => {
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
      req.flash('error', 'Vui lòng cập nhật lại CMND/CCCD!');
      return res.redirect('/auth/register');
    }

    if (await UserModel.findOne({ email }).exec()) {
      for (let i = 0; i < files.length; i++) {
        fs.unlinkSync(files[i].path);
      }
      req.flash('error', 'Địa chỉ Email đã tồn tại!');
      return res.redirect('/auth/register');
    }

    if (await UserModel.findOne({ phone }).exec()) {
      for (let i = 0; i < files.length; i++) {
        fs.unlinkSync(files[i].path);
      }
      req.flash('error', 'Số điện thoại đã tồn tại!');
      return res.redirect('/auth/register');
    }

    while (true) {
      var username = parseInt(Math.floor(Math.random() * (9999999999 - 1000000000)) + 1000000000);
      var password = Math.random().toString(36).slice(-6);
      var hashed = bcrypt.hashSync(password, 10);
      var userDir = `public/uploads/${username}`;

      if (!await UserModel.findOne({ username }).exec()) {
        var create_user = await UserModel.create({ fullname, email, birthday, phone, address, username, password: hashed, id_card: [files[0].filename, files[1].filename,], });

        if (create_user) {
          var create_password = await PasswordModel.create({ id_user: create_user.id });
          var create_permission = await PermissionModel.create({ id_user: create_user.id });

          if (create_password && create_permission) {
            // var transporter = nodemailer.createTransport({
            //   host: `${mailHost}`,
            //   port: `${mailPort}`,
            //   secure: 465,
            //   auth: {
            //     user: `${mailUser}`,
            //     pass: `${mailPass}`,
            //   },
            //   tls: {
            //     rejectUnauthorized: false,
            //   }
            // });

            var transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: `${mailUser}`,
                pass: `${mailPass}#`,
              },
            });

            transporter.sendMail({
              from: `${mailUser}`,
              to: `${email}`,
              subject: '[TB] THÔNG TIN TÀI KHOẢN KHÁCH HÀNG - VÍ ĐIỆN TỬ OBANK',
              html: `<p>Cảm ơn bạn đã tin dùng ví điện tử của chúng tôi, vui lòng không chia sẻ thông tin này đến bất kỳ ai. 
              Đây là thông tin tài khoản của bạn:</p>
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
                req.flash('error', 'Không thể tạo tài khoản, vui lòng thử lại!');
                return res.redirect('/auth/register');
              }
              for (let i = 0; i < files.length; i++) {
                fs.renameSync(files[i].path, `public/uploads/${username}/${files[i].filename}`);
              }
            })
          }
        }
        req.flash('success', 1);
        return res.redirect('/auth/email');
      }
    }
  } catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }
});

router.get('/email', (req, res, next) => {
  var success = req.flash('success') || [];
  if (!success.length) {
    return res.redirect('auth/login');
  }
  res.render('auth/email');
});

/*
|------------------------------------------------------------------------------------------------------
| ĐỔI MẬT KHẨU LẦN ĐẦU ĐĂNG NHẬP
|------------------------------------------------------------------------------------------------------
*/
router.get('/change-password', Auth.checkSession, (req, res, next) => {
  res.render('auth/change_password', {
    error: req.flash('error') || '',
    newPassword: req.flash('newPassword') || '',
    confirmPassword: req.flash('confirmPassword') || '',
  });
});

router.post('/change-password', ChangePasswordValidator, async (req, res, next) => {
  try {
    var result = validationResult(req);
    var { newPassword, confirmPassword } = req.body;

    req.flash('newPassword', newPassword);
    req.flash('confirmPassword', confirmPassword);

    if (result.errors.length !== 0) {
      result = result.mapped();
      for (fields in result) {
        req.flash('error', result[fields].msg);
        return res.redirect('/auth/register');
      }
    }

    if (newPassword !== confirmPassword) {
      req.flash('error', 'Mật khẩu không trùng khớp!')
      return res.redirect('/auth/password/change');
    }

    var user = await UserModel.findById(req.session.user.id).exec();

    UserModel.findByIdAndUpdate({ _id: user._id }, { password: bcrypt.hashSync(confirmPassword, 10) }, (error, data) => {
      if (error) {
        req.flash('error', 'Lỗi trong quá trình xữ lý, vui lòng thử lại!')
        return res.redirect('/auth/password/change');
      }
    })

    PasswordModel.findOneAndUpdate({ id_user: user._id }, { status: 1 }, (error, data) => {
      if (error) {
        req.flash('error', 'Lỗi trong quá trình xữ lý, vui lòng thử lại!')
        return res.redirect('/auth/password/change');
      }
    })

    var permission = await PermissionModel.findOne({ id_user: user._id }).exec();
    var pass = await PasswordModel.findOne({ id_user: user._id }).exec();

    req.session.user = {
      id: user.id,
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      birthday: user.birthday,
      phone: user.phone,
      address: user.address,
      balance: user.balance,
      role: user.role,
      activate: {
        account_activated: permission.account_activated,
        account_disabled: permission.account_disabled,
        account_blocked: permission.account_blocked
      },
      status: pass.status,
      id_card: user.id_card,
    };

    if (req.session.user.role == 0) {
      return res.redirect('/admin');
    }

    res.redirect('/');
  } catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }
});

/*
|------------------------------------------------------------------------------------------------------
| Đặt lại mật khẩu
|------------------------------------------------------------------------------------------------------
*/
router.get('/reset-password', (req, res, next) => {
  res.render('auth/reset-password', {
    error: req.flash('error') || '',
    email: req.flash('email') || '',
  });
});

router.post('/reset-password', ResetPasswordValidator, async (req, res, next) => {
  try {
    var result = validationResult(req);
    var { email } = req.body;

    req.flash('email', email);

    if (result.errors.length !== 0) {
      result = result.mapped();
      for (fields in result) {
        req.flash('error', result[fields].msg);
        return res.redirect('/auth/reset-password');
      }
    }

    var user = await UserModel.findOne({ email }).exec();

    if (!user) {
      req.flash('error', 'Đỉa chỉ email không tồn tại!');
      return res.redirect('/auth/reset-password');
    }

    var password = Math.random().toString(36).slice(-6);
    var hashed = bcrypt.hashSync(password, 10);

    UserModel.findByIdAndUpdate(user.id, { password: hashed }, (error, data) => {
      if (error) {
        req.flash('error', 'Lỗi trong quá trình xữ lý, vui lòng thử lại!')
        return res.redirect('/auth/password/change');
      }
    })

    PasswordModel.findOneAndUpdate({ id_user: user.id }, { status: 0 }, (error, data) => {
      if (error) {
        req.flash('error', 'Lỗi trong quá trình xữ lý, vui lòng thử lại!')
        return res.redirect('/auth/password/change');
      }
    })

    // var transporter = nodemailer.createTransport({
    //   host: `${mailHost}`,
    //   port: `${mailPort}`,
    //   secure: 465,
    //   auth: {
    //     user: `${mailUser}`,
    //     pass: `${mailPass}`,
    //   },
    //   tls: {
    //     rejectUnauthorized: false,
    //   }
    // });

    var transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: `${mailUser}`,
        pass: `${mailPass}#`,
      },
    });

    transporter.sendMail({
      from: `${mailUser}`,
      to: `${email}`,
      subject: '[TB] THÔNG TIN TÀI KHOẢN KHÁCH HÀNG - VÍ ĐIỆN TỬ OBANK',
      html: `<p>Cảm ơn bạn đã tin dùng ví điện tử của chúng tôi, vui lòng không chia sẻ thông tin này đến bất kỳ ai. 
      Đây là thông tin tài khoản của bạn sau khi đặt lại mật khẩu:</p>
      <b>Tên khách hàng: </b>${user.fullname} <br> 
      <b>Số tài khoản: </b>${user.username} <br> 
      <b>Mật khẩu: </b>${password} 
      <p>Trân trọng ./.</p>`,
    });

    req.flash('success', 1);
    return res.redirect('/auth/email');
  } catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }
});

/*
|------------------------------------------------------------------------------------------------------
| ĐĂNG XUẤT TÀI KHOẢN NGƯỜI DÙNG
|------------------------------------------------------------------------------------------------------
*/
router.get('/logout', (req, res, next) => {
  req.session.destroy();
  res.redirect('/auth/login');
});

module.exports = router;