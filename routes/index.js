const express = require('express');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs');

const router = express.Router();

// Import Model
const UserModel = require('../models/user');
const HistoryModel = require('../models/history');
const PasswordModel = require('../models/password');
const PermissionModel = require('../models/permission');

// Import Middleware
const Auth = require('../middleware/auth');
const Permission = require('../middleware/permission');

// Import Validators
const RechargeValidator = require('./validators/recharge');
const WithdrawValidator = require('./validators/withdraw');
const ChangePasswordValidator = require('./validators/change-password-user');

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
| TRANG TỔNG QUAN
|------------------------------------------------------------------------------------------------------
*/

router.get('/', function (req, res, next) {
  try {
    res.render('user/index', {
      user: req.session.user,
      error: req.flash('error') || '',
    });
  } catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }
});

/*
|------------------------------------------------------------------------------------------------------
| THÔNG TIN TÀI KHOẢN
|------------------------------------------------------------------------------------------------------
*/

router.get('/profile', function (req, res, next) {
  try {
    res.render('user/profile', {
      user: req.session.user,
      error: req.flash('error') || '',
    });
  } catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }
});

/*
|------------------------------------------------------------------------------------------------------
| CHỨC NĂNG NẠP TIỀN VÀO TÀI KHOẢN
|------------------------------------------------------------------------------------------------------
*/

router.get('/recharge', Permission.AccountActivated, function (req, res) {
  try {
    res.render('user/recharge', {
      user: req.session.user,
      error: req.flash('error')
    });
  } catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }
})

router.post('/recharge', Permission.AccountActivated, RechargeValidator, async function (req, res) {
  try {
    var result = validationResult(req);
    var { cardNumber, expDate, cvv, amount } = req.body;
    cardNumber = Number.parseInt(cardNumber);
    amount = Number.parseInt(amount);

    var accpectedCard = [111111, 222222, 333333];

    if (result.errors.length !== 0) {
      result = result.mapped();
      for (fields in result) {
        req.flash('error', result[fields].msg);
        return res.redirect('/recharge');
      }
    }

    if (!accpectedCard.includes(cardNumber)) {
      req.flash('error', 'Thẻ này không được hỗ trợ.');
      return res.redirect('/recharge');
    }

    if (cardNumber == 333333) {
      if (expDate != "2022-12-12") {
        req.flash('error', 'Ngày hết hạn không chính xác.');
        return res.redirect('/recharge');
      }
      if (cvv != 577) {
        req.flash('error', 'Mã CVV không chính xác.');
        return res.redirect('/recharge');
      }
      req.flash('error', 'Thẻ hết tiền.');
      return res.redirect('/recharge');
    }

    if (cardNumber == 222222) {
      if (expDate != "2022-11-11") {
        req.flash('error', 'Ngày hết hạn không chính xác.');
        return res.redirect('/recharge');
      }
      if (cvv != 443) {
        req.flash('error', 'Mã CVV không chính xác.');
        return res.redirect('/recharge');
      }
      if (amount > 1000000) {
        req.flash('error', 'Bạn chỉ có thể nạp tối đa 1 triệu mỗi lần với thẻ này.');
        return res.redirect('/recharge');
      }

      var user = await UserModel.findById(req.session.user.id).exec();
      var balance = Number.parseInt(user.balance);

      UserModel.findByIdAndUpdate({ _id: user._id }, { balance: balance + amount, status: 1 }, (error, data) => {
        if (error) {
          req.flash('error', 'Lỗi trong quá trình xữ lý, vui lòng thử lại!')
          return res.redirect('/recharge');
        }
      })

      // Tạo lịch sử giao dịch tại đây
      while (true) {
        var transactionID = parseInt(Math.floor(Math.random() * (99999999999 - 10000000000)) + 10000000000);
        if (!await HistoryModel.findOne({ transactionID }).exec()) {
          var history = await HistoryModel.create({ transactionID: transactionID, username: user.username, user_fullname: user.fullname, transaction_type: "Nạp tiền", amount: amount, status: "Thành công" });
          req.flash('error', 'Nạp tiền thành công!');
          return res.redirect('/recharge');
        }
      }
    }

    if (cardNumber == 111111) {
      if (expDate != "2022-10-10") {
        req.flash('error', 'Ngày hết hạn không chính xác.');
        return res.redirect('/recharge');
      }
      if (cvv != 411) {
        req.flash('error', 'Mã CVV không chính xác.');
        return res.redirect('/recharge');
      }

      var user = await UserModel.findById(req.session.user.id).exec();
      var balance = Number.parseInt(user.balance);

      UserModel.findByIdAndUpdate({ _id: user._id }, { balance: balance + amount, status: 1 }, (error, data) => {
        if (error) {
          req.flash('error', 'Lỗi trong quá trình xữ lý, vui lòng thử lại!' + req.session.user)
          return res.redirect('/recharge');

        }
      })

      // Tạo lịch sử giao dịch tại đây
      while (true) {
        var transactionID = parseInt(Math.floor(Math.random() * (99999999999 - 10000000000)) + 10000000000);
        if (!await HistoryModel.findOne({ transactionID }).exec()) {
          var history = await HistoryModel.create({ transactionID: transactionID, username: user.username, user_fullname: user.fullname, transaction_type: "Nạp tiền", amount: amount, status: "Thành công" });
          req.flash('error', 'Nạp tiền thành công!');
          return res.redirect('/recharge');
        }
      }
    }
  }
  catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }

})

/*
|------------------------------------------------------------------------------------------------------
| CHỨC NĂNG RÚT TIỀN
|------------------------------------------------------------------------------------------------------
*/

router.get('/withdraw', Permission.AccountActivated, function (req, res) {
  try {
    res.render('user/withdraw', {
      user: req.session.user,
      error: req.flash('error')
    });
  } catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }
})

router.post('/withdraw', Permission.AccountActivated, WithdrawValidator, async function (req, res) {
  try {
    var result = validationResult(req);
    var { cardNumber, expDate, cvv, amount, desc } = req.body;
    cardNumber = Number.parseInt(cardNumber);
    amount = Number.parseInt(amount);
    if (!desc) { desc = "" }

    if (result.errors.length !== 0) {
      result = result.mapped();
      for (fields in result) {
        req.flash('error', result[fields].msg);
        return res.redirect('/withdraw');
      }
    }

    if (cardNumber != 111111) {
      req.flash('error', 'Thẻ này không hỗ trợ để rút tiền.');
      return res.redirect('/withdraw');
    }

    if (cardNumber == 111111) {
      if (cvv != 411) {
        req.flash('error', 'Mã CVV không chính xác.');
        return res.redirect('/withdraw');
      }
      if (expDate != "2022-10-10") {
        req.flash('error', 'Ngày hết hạn không chính xác.');
        return res.redirect('/withdraw');
      }
      // if("?"){
      //     //Rút 2 lần mỗi ngày
      // }
      if (!(amount % 50000 == 0)) {
        req.flash('error', 'Số tiền rút phải là bội số của 50,000 đồng.');
        return res.redirect('/withdraw');
      }

      var user = await UserModel.findById(req.session.user.id).exec();
      var balance = Number.parseInt(user.balance);

      if ((amount + amount * (5 / 100)) > balance) {
        req.flash('error', 'Số dư trong tài khoản không đủ để thực hiện giao dịch rút tiền.');
        return res.redirect('/withdraw');
      }
      if (amount > 5000000) {
        //Chờ duyệt
        var user = await UserModel.findById(req.session.user.id).exec();
        while (true) {
          var transactionID = parseInt(Math.floor(Math.random() * (99999999999 - 10000000000)) + 10000000000);
          if (!await HistoryModel.findOne({ transactionID }).exec()) {
            var history = await HistoryModel.create({ transactionID: transactionID, username: user.username, user_fullname: user.fullname, transaction_type: "Rút tiền", amount: amount, fee: amount * (5 / 100), message: desc, status: "Đang chờ" });
            req.flash('error', 'Số tiền bạn rút là trên 5 triệu đồng, vui lòng chờ ngân hàng thông qua.');
            return res.redirect('/withdraw');
          }
        }
      }

      UserModel.findByIdAndUpdate({ _id: user._id }, { balance: balance - amount - amount * (5 / 100), status: 1 }, (error, data) => {
        if (error) {
          req.flash('error', 'Lỗi trong quá trình xữ lý, vui lòng thử lại!' + req.session.user)
          return res.redirect('/withdraw');
        }
      })
      // Tạo lịch sử giao dịch tại đây
      while (true) {
        var transactionID = parseInt(Math.floor(Math.random() * (99999999999 - 10000000000)) + 10000000000);
        if (!await HistoryModel.findOne({ transactionID }).exec()) {
          var history = await HistoryModel.create({ transactionID: transactionID, username: user.username, user_fullname: user.fullname, transaction_type: "Rút tiền", amount: amount, fee: amount * (5 / 100), message: desc, status: "Thành công" });
          req.flash('error', 'Rút tiền thành công!');
          return res.redirect('/withdraw');
        }
      }
    }
  }
  catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }

})

/*
|------------------------------------------------------------------------------------------------------
| CHỨC NĂNG CHUYỂN TIỀN
|------------------------------------------------------------------------------------------------------
*/



/*
|------------------------------------------------------------------------------------------------------
| CHỨC NĂNG MUA THẺ ĐIỆN THOẠI
|------------------------------------------------------------------------------------------------------
*/

/*
|------------------------------------------------------------------------------------------------------
| BỔ SUNG CMND/CCCD
|------------------------------------------------------------------------------------------------------
*/

router.get('/additional-identity-card', async function (req, res) {
  try {
    res.render('user/additional-identity-card', {
      user: req.session.user,
      error: req.flash('error') || '',
      success: req.flash('success') || '',
    })
  } catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }
})

router.post('/additional-identity-card', upload.array('id_card', 3), async function (req, res) {
  try {
    var files = req.files;

    if (!files || files.length < 2) {
      for (let i = 0; i < files.length; i++) {
        fs.unlinkSync(files[i].path);
      }
      req.flash('error', 'Vui lòng cập nhật lại CMND/CCCD!');
      return res.redirect('/additional-identity-card');
    }

    var checkIdCard = await UserModel.findById(req.session.user.id).exec();
    if (checkIdCard.id_card.length == 2) {
      for (let i = 0; i < files.length; i++) {
        fs.unlinkSync(files[i].path);
      }
      req.flash('error', 'Bạn đã bổ sung thông tin, vui lòng chờ xác minh!');
      return res.redirect('/additional-identity-card');
    }

    var updateIdCard = await UserModel.findByIdAndUpdate(req.session.user.id, { id_card: [files[0].filename, files[1].filename,] }).exec();
    if (!updateIdCard) {
      for (let i = 0; i < files.length; i++) {
        fs.unlinkSync(files[i].path);
      }
      req.flash('error', 'Lỗi trong quá trình xữ lý, vui lòng thử lại!');
      return res.redirect('/additional-identity-card');
    }

    for (let i = 0; i < files.length; i++) {
      fs.renameSync(files[i].path, `public/uploads/${req.session.user.username}/${files[i].filename}`);
    }

    var user = await UserModel.findById(req.session.user.id).exec();
    if (user) {
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
    }

    req.flash('success', "Cập nhật mật khẩu thành công!");
    res.redirect('/');
  } catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }
})

/*
|------------------------------------------------------------------------------------------------------
| LỊCH SỬ GIAO DỊCH
|------------------------------------------------------------------------------------------------------
*/
router.get('/history', Permission.AccountActivated, async function (req, res) {
  try {
    var rechargeHistory = await HistoryModel.find({ userID: req.session.user.id, transaction_type: "Nạp tiền" }).sort({ made_at: -1 }).exec();
    var withdrawHistory = await HistoryModel.find({ userID: req.session.user.id, transaction_type: "Rút tiền" }).sort({ made_at: -1 }).exec();
    //Các loại giao dịch khác
    res.render('user/history', {
      user: req.session.user,
      recharge: rechargeHistory, withdraw: withdrawHistory
    });
  } catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }
})

/*
|------------------------------------------------------------------------------------------------------
| ĐỔI MẬT KHẨU
|------------------------------------------------------------------------------------------------------
*/
router.get('/change-password', function (req, res, next) {
  try {
    res.render('user/change-password', {
      user: req.session.user,
      error: req.flash('error') || '',
      success: req.flash('success') || '',
      oldPassword: req.flash('oldPassword') || '',
      newPassword: req.flash('newPassword') || '',
      confirmPassword: req.flash('confirmPassword') || '',
    });
  } catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }
});

router.post('/change-password', ChangePasswordValidator, async function (req, res, next) {
  try {
    var { oldPassword, newPassword, confirmPassword } = req.body;
    var result = validationResult(req);

    req.flash('oldPassword', oldPassword);
    req.flash('newPassword', newPassword);
    req.flash('confirmPassword', confirmPassword);

    if (result.errors.length !== 0) {
      result = result.mapped();
      for (fields in result) {
        req.flash('error', result[fields].msg);
        return res.redirect('/change-password');
      }
    }

    var user = await UserModel.findById(req.session.user.id).exec();
    if (!user) {
      req.flash('error', 'Lỗi trong quá trình xữ lý, vui lòng thử lại!');
      return res.redirect('/change-password');
    }

    var matched = bcrypt.compareSync(oldPassword, user.password)
    if (!matched) {
      req.flash('error', 'Mật khẩu cũ không đúng!');
      return res.redirect('/change-password');
    }

    if (newPassword !== confirmPassword) {
      req.flash('error', 'Mật khẩu xác nhận không trùng khớp!')
      return res.redirect('/change-password');
    }

    var hashed = bcrypt.hashSync(newPassword, 10);
    UserModel.findByIdAndUpdate(user.id, { password: hashed }, (error, data) => {
      if (error) {
        req.flash('error', 'Lỗi trong quá trình xữ lý, vui lòng thử lại!');
        return res.redirect('/change-password');
      }
    })

    req.flash('success', "Cập nhật mật khẩu thành công!");
    res.redirect('/change-password');
  } catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }
});

module.exports = router;
