const express = require('express');
const fs = require('fs');
const router = express.Router();

// Import Model
const UserModel = require('../models/user');
const PermissionModel = require('../models/permission');
const PasswordModel = require('../models/password');
const HistoryModel = require('../models/history');

/*
|------------------------------------------------------------------------------------------------------
| TRANG TỔNG QUAN
|------------------------------------------------------------------------------------------------------
*/

router.get('/', async (req, res, next) => {
  try {
    var user = req.session.user;
    return res.render('admin/index', {
      code: 0, message: 'Ok', user, error: req.flash('error') || '',
      success: req.flash('success') || '',
    });
  } catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }
});

/*
|------------------------------------------------------------------------------------------------------
| TRANG TÀI KHOẢN CHỜ KÍCH HOẠT
|------------------------------------------------------------------------------------------------------
*/

router.get('/account-wait-activated', async (req, res, next) => {
  try {
    var user = req.session.user;
    var id_user = await PermissionModel.find({ account_activated: 0 }, { _id: 0, id_user: 1 }).exec();

    var result = [];

    for (var i = 0; i < id_user.length; i++) {
      var data = await UserModel.findOne({ _id: id_user[i].id_user, role: 1 }).exec();
      if (data) {
        result.push(data);
      }
    }

    return res.render('admin/account-wait-activated', {
      code: 0, message: 'Ok', user, result,
      error: req.flash('error') || '',
      success: req.flash('success') || '',
    });
  } catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }
});

router.post('/account-wait-activated', async (req, res, next) => {
  try {
    var { id, activate, disable } = req.body;

    if (activate < 2) {
      if (activate == 1) {
        PermissionModel.findOneAndUpdate({ id_user: id }, { account_activated: activate }, (error, data) => {
          if (error) {
            req.flash('error', 'Lỗi trong quá trình xữ lý, vui lòng thử lại!')
            return res.redirect('/admin/account-wait-activated');
          }
        })
      }
      if (activate == 0) {
        UserModel.findOneAndUpdate({ _id: id }, { id_card: [] }, (error, data) => {
          if (error) {
            req.flash('error', 'Lỗi trong quá trình xữ lý, vui lòng thử lại!')
            return res.redirect('/admin/account-wait-activated');
          }
          for (let i = 0; i < data.id_card.length; i++) {
            if (fs.existsSync(`public/uploads/${data.username}/${data.id_card[i]}`)) {
              fs.unlinkSync(`public/uploads/${data.username}/${data.id_card[i]}`);
            }
          }
        })
      }
    }

    if (typeof (disable) !== 'undefined') {
      PermissionModel.findOneAndUpdate({ id_user: id }, { account_disabled: disable }, (error, data) => {
        if (error) {
          req.flash('error', 'Lỗi trong quá trình xữ lý, vui lòng thử lại!')
          return res.redirect('/admin/account-wait-activated');
        }
      })
    }

    req.flash('success', 'Cập nhật trạng thái thành công!')
    return res.redirect('/admin/account-wait-activated');
  } catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }
});

/*
|------------------------------------------------------------------------------------------------------
| TRANG TÀI KHOẢN ĐÃ KÍCH HOẠT
|------------------------------------------------------------------------------------------------------
*/

router.get('/account-activated', async (req, res, next) => {
  try {
    var user = req.session.user;
    var id_user = await PermissionModel.find({ account_activated: 1 }, { _id: 0, id_user: 1 }).exec();

    var result = [];

    for (var i = 0; i < id_user.length; i++) {
      var data = await UserModel.findOne({ _id: id_user[i].id_user, role: 1 }).sort({ created_at: -1 }).exec();
      if (data) {
        result.push(data);
      }
    }

    return res.render('admin/account-activated', {
      code: 0, message: 'Ok', user, result,
      error: req.flash('error') || '',
      success: req.flash('success') || '',
    });
  } catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }
});

/*
|------------------------------------------------------------------------------------------------------
| TRANG TÀI KHOẢN BỊ VÔ HIỆU HÓA
|------------------------------------------------------------------------------------------------------
*/

router.get('/account-disable', async (req, res, next) => {
  try {
    var user = req.session.user;
    var id_user = await PermissionModel.find({ account_disabled: 1 }, { _id: 0, id_user: 1 }).exec();

    var result = [];

    for (var i = 0; i < id_user.length; i++) {
      var data = await UserModel.findOne({ _id: id_user[i].id_user, role: 1 }).sort({ created_at: -1 }).exec();
      if (data) {
        result.push(data);
      }
    }

    return res.render('admin/account-disable', {
      code: 0, message: 'Ok', user, result,
      error: req.flash('error') || '',
      success: req.flash('success') || '',
    });
  } catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }
});

router.post('/account-disable', async (req, res, next) => {
  try {
    var { id, disable } = req.body;

    if (typeof (disable) !== 'undefined') {
      PermissionModel.findOneAndUpdate({ id_user: id }, { account_disabled: disable }, (error, data) => {
        if (error) {
          req.flash('error', 'Lỗi trong quá trình xữ lý, vui lòng thử lại!')
          return res.redirect('/admin/account-disable');
        }
      })
    }

    req.flash('success', 'Cập nhật trạng thái thành công!')
    return res.redirect('/admin/account-disable');
  } catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }
});

/*
|------------------------------------------------------------------------------------------------------
| TRANG TÀI KHOẢN ĐÃ BỊ KHÓA
|------------------------------------------------------------------------------------------------------
*/

router.get('/account-blocked', async (req, res, next) => {
  try {
    var user = req.session.user;
    var id_user = await PermissionModel.find({ account_blocked: 1 }, { _id: 0, id_user: 1 }).exec();

    var result = [];

    for (var i = 0; i < id_user.length; i++) {
      var data = await UserModel.findOne({ _id: id_user[i].id_user, role: 1 }).sort({ created_at: -1 }).exec();
      if (data) {
        result.push(data);
      }
    }

    return res.render('admin/account-blocked', {
      code: 0, message: 'Ok', user, result,
      error: req.flash('error') || '',
      success: req.flash('success') || '',
    });
  } catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }
});

router.post('/account-blocked', async (req, res, next) => {
  try {
    var { id, block } = req.body;

    await PasswordModel.findOneAndUpdate({ id_user: id }, { error: 0 }).exec();
    await PermissionModel.findOneAndUpdate({ id_user: id }, { account_blocked: block }).exec();

    req.flash('success', 'Cập nhật trạng thái thành công!')
    return res.redirect('/admin/account-blocked');
  } catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }
});

/*
|------------------------------------------------------------------------------------------------------
| TRANG LỊCH SỬ GIAO DỊCH
|------------------------------------------------------------------------------------------------------
*/

// Lịch sử nạp tiền
router.get('/recharge-history', async function (req, res, next) {
  try {
    var rechargeHistory = await HistoryModel.find({ transaction_type: "Nạp tiền" }).sort({ made_at: -1 }).exec();
    res.render('admin/recharge-history', {
      user: req.session.user,
      error: req.flash('error') || '',
      success: req.flash('success') || '',
      recharge: rechargeHistory,
    });
  } catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }
})

// Lịch sử rút tiền
router.get('/withdraw-history', async function (req, res, next) {
  try {
    var withdrawHistory = await HistoryModel.find({ transaction_type: "Rút tiền" }).sort({ made_at: -1 }).exec();
    res.render('admin/withdraw-history', {
      user: req.session.user,
      error: req.flash('error') || '',
      success: req.flash('success') || '',
      withdraw: withdrawHistory,
    });
  } catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }
})

// Lịch sử mua thẻ điện thoại
router.get('/phone-card-history', async function (req, res, next) {
  try {
    var phonecardHistory = await HistoryModel.find({ transaction_type: "Mua thẻ điện thoại" }).sort({ made_at: -1 }).exec();
    res.render('admin/phone-card-history', {
      user: req.session.user,
      error: req.flash('error') || '',
      success: req.flash('success') || '',
      phonecard: phonecardHistory,
    });
  } catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }
})

/*
|------------------------------------------------------------------------------------------------------
| TRANG PHÊ DUYỆT LỊCH SỬ GIAO DỊCH
|------------------------------------------------------------------------------------------------------
*/

router.get('/transaction-approval', async function (req, res, next) {
  try {
    var result = await HistoryModel.find({ transaction_type: "Rút tiền", transaction_allowed: 0 }).sort({ made_at: -1 }).exec();

    res.render('admin/transaction-approval', {
      user: req.session.user,
      error: req.flash('error') || '',
      success: req.flash('success') || '',
      result,
    });
  } catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }
})

router.post('/transaction-approval', async (req, res, next) => {
  try {
    var { id, transaction } = req.body;

    var transactionHistory = await HistoryModel.findById(id).exec();
    var transactionUser = await UserModel.findOne({ username: transactionHistory.username }).exec();

    if (transaction == 0) {
      await HistoryModel.findByIdAndUpdate(id, { transaction_allowed: 1, status: 'Thất bại' }).exec();
      req.flash('success', 'Từ chối phê duyệt thành công!');
      return res.redirect('/admin/transaction-approval');
    }

    if (transactionHistory.amount + transactionHistory.fee > transactionUser.balance) {
      await HistoryModel.findByIdAndUpdate(id, { transaction_allowed: 1, status: 'Thất bại' }).exec();
      req.flash('error', 'Phê duyệt không thành công do số dư người dùng không đủ!');
      return res.redirect('/admin/transaction-approval');
    }

    var updateHistory = await HistoryModel.findByIdAndUpdate(id, { transaction_allowed: 1, status: 'Thành công' }).exec();
    if (!updateHistory) {
      req.flash('error', 'Lỗi trong quá trình phê duyệt!');
      return res.redirect('/admin/transaction-approval');
    }

    await UserModel.findByIdAndUpdate(transactionUser.id, { balance: transactionUser.balance - (transactionHistory.amount + transactionHistory.fee) }).exec();

    req.flash('success', 'Phê duyệt thành công!')
    return res.redirect('/admin/transaction-approval');
  } catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }
});

module.exports = router;