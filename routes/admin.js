const express = require('express');
const fs = require('fs');
const router = express.Router();

// Import Model
const UserModel = require('../models/user');
const PermissionModel = require('../models/permission');

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

module.exports = router;