const express = require('express');
const router = express.Router();

const UserModel = require('../models/user');

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
    var result = await UserModel.find({ activate: 0, role: 1 }).exec();

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
    var { id, activated } = req.body;

    console.log(id, activated);
    UserModel.findByIdAndUpdate(id, { activate: activated }, (error, data) => {
      if (error) {
        req.flash('error', 'Lỗi trong quá trình xữ lý, vui lòng thử lại!')
        return res.redirect('/admin/account-wait-activated');
      }
    })

    req.flash('success', 'Cập nhật trạng thái thành công!')
    return res.redirect('/admin/account-wait-activated');
  } catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }
});

router.get('/account-activated', async (req, res, next) => {
  try {
    var user = req.session.user;
    var result = await UserModel.find({ activate: 1, role: 1 }).sort({ created_at: -1 }).exec();

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
    var result = await UserModel.find({ activate: 2, role: 1 }).sort({ created_at: -1 }).exec();

    return res.render('admin/account-disable', {
      code: 0, message: 'Ok', user, result,
      error: req.flash('error') || '',
      success: req.flash('success') || '',
    });
  } catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }
});

router.get('/account-blocked', async (req, res, next) => {
  try {
    var user = req.session.user;
    var result = await UserModel.find({ activate: 3, role: 1 }).sort({ created_at: -1 }).exec();

    return res.render('admin/account-blocked', {
      code: 0, message: 'Ok', user, result,
      error: req.flash('error') || '',
      success: req.flash('success') || '',
    });
  } catch (error) {
    return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
  }
});

// router.get('/account/:id', async (req, res, next) => {
//   try {
//     var user = req.session.user;
//     var result = await UserModel.findById(req.params.id).exec();

//     return res.json({ code: 0, message: 'Ok', user, result });
//   } catch (error) {
//     return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
//   }
// });

module.exports = router;