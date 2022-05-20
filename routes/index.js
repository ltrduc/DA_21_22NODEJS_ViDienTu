const express = require('express');
const { check, validationResult } = require('express-validator');

const router = express.Router();

// Import Model
const UserModel = require('../models/user');
const HistoryModel = require('../models/history');

// Import Middleware
const Auth = require('../middleware/auth');

// Import Validators
const RechargeValidator = require('./validators/recharge');
const WithdrawValidator = require('./validators/withdraw');

router.get('/', function (req, res, next) {
    res.json({ user: req.session.user });
});

/*
|------------------------------------------------------------------------------------------------------
| CHỨC NĂNG NẠP TIỀN VÀO TÀI KHOẢN
|------------------------------------------------------------------------------------------------------
*/

router.get('/recharge', function(req, res){
    res.render('user/recharge', {error: req.flash('error')});
})

router.post('/recharge', RechargeValidator, async function(req, res){
    try{
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

        if (!accpectedCard.includes(cardNumber)){
            req.flash('error', 'Thẻ này không được hỗ trợ.');
            return res.redirect('/recharge');
        }

        if (cardNumber == 333333){
            if(expDate != "2022-12-12"){
                req.flash('error', 'Ngày hết hạn không chính xác.');
                return res.redirect('/recharge');
            }
            if(cvv != 577){
                req.flash('error', 'Mã CVV không chính xác.');
                return res.redirect('/recharge');
            }
            req.flash('error', 'Thẻ hết tiền.');
            return res.redirect('/recharge');
        }

        if (cardNumber == 222222){
            if(expDate != "2022-11-11"){
                req.flash('error', 'Ngày hết hạn không chính xác.');
                return res.redirect('/recharge');
            }
            if(cvv != 443){
                req.flash('error', 'Mã CVV không chính xác.');
                return res.redirect('/recharge');
            }
            if(amount>1000000){
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
                req.session.user.balance = Number.parseInt(req.session.user.balance) + amount;
                req.session.save();
            })

            // Tạo lịch sử giao dịch tại đây
            var history = await HistoryModel.create({ userID: user._id, user_fullname: user.fullname, transaction_type: "Nạp tiền", amount: amount, status: "Thành công"});

            
            req.flash('error', 'Nạp tiền thành công!');
            return res.redirect('/recharge');
        }

        if (cardNumber == 111111){
            if(expDate != "2022-10-10"){
                req.flash('error', 'Ngày hết hạn không chính xác.');
                return res.redirect('/recharge');
            }
            if(cvv != 411){
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
            var history = await HistoryModel.create({ userID: user._id, user_fullname: user.fullname, transaction_type: "Nạp tiền", amount: amount, status: "Thành công"});

            req.flash('error', 'Nạp tiền thành công!');
            return res.redirect('/recharge');
        }
    }
    catch(error) {
        return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
    }

})

/*
|------------------------------------------------------------------------------------------------------
| CHỨC NĂNG RÚT TIỀN
|------------------------------------------------------------------------------------------------------
*/

router.get('/withdraw', function(req, res){
    res.render('user/withdraw', {error: req.flash('error')});
})

router.post('/withdraw', WithdrawValidator, async function(req, res){
    try{
        var result = validationResult(req);
        var { cardNumber, expDate, cvv, amount, desc } = req.body;
        cardNumber = Number.parseInt(cardNumber);
        amount = Number.parseInt(amount);
        if (!desc){ desc = "" }

        if (result.errors.length !== 0) {
            result = result.mapped();
            for (fields in result) {
              req.flash('error', result[fields].msg);
              return res.redirect('/withdraw');
            }
        }

        if (cardNumber != 111111){
            req.flash('error', 'Thẻ này không hỗ trợ để rút tiền.');
            return res.redirect('/withdraw');
        }

        if (cardNumber == 111111){
            if(cvv != 411){
                req.flash('error', 'Mã CVV không chính xác.');
                return res.redirect('/withdraw');
            }
            if(expDate != "2022-10-10"){
                req.flash('error', 'Ngày hết hạn không chính xác.');
                return res.redirect('/withdraw');
            }
            // if("?"){
            //     //Rút 2 lần mỗi ngày
            // }
            if( !(amount%50000 == 0) ){
                req.flash('error', 'Số tiền rút phải là bội số của 50,000 đồng.');
                return res.redirect('/withdraw');
            }

            var user = await UserModel.findById(req.session.user.id).exec();
            var balance = Number.parseInt(user.balance);

            if( (amount + amount*(5/100)) > balance){         
                req.flash('error', 'Số dư trong tài khoản không đủ để thực hiện giao dịch rút tiền.');
                return res.redirect('/withdraw');
            }
            if(amount > 5000000){
                //Chờ duyệt
                var user = await UserModel.findById(req.session.user.id).exec();
                var history = await HistoryModel.create({ userID: user._id, user_fullname: user.fullname, transaction_type: "Rút tiền", amount: amount, fee: amount*(5/100), message: desc, status: "Đang chờ"});

                req.flash('error', 'Số tiền bạn rút là trên 5 triệu đồng, vui lòng chờ ngân hàng thông qua.');
                return res.redirect('/withdraw');
            }

            UserModel.findByIdAndUpdate({ _id: user._id }, { balance: balance - amount - amount*(5/100), status: 1 }, (error, data) => {
                if (error) {
                    req.flash('error', 'Lỗi trong quá trình xữ lý, vui lòng thử lại!' + req.session.user)
                    return res.redirect('/withdraw');
                }
            })
            // Tạo lịch sử giao dịch tại đây
            var history = await HistoryModel.create({ userID: user._id, user_fullname: user.fullname, transaction_type: "Rút tiền", amount: amount, fee: amount*(5/100), message: desc, status: "Thành công"});

            req.flash('error', 'Rút tiền thành công!');
            return res.redirect('/withdraw');
        }
    }
    catch(error) {
        return res.status(500).render('error', { error: { status: 500, stack: 'Unable to connect to the system, please try again!' }, message: 'Connection errors' });
    }

})

router.get('/history', async function(req, res){
    var rechargeHistory = await HistoryModel.find({userID: req.session.user.id, transaction_type: "Nạp tiền"}).sort({ made_at: -1 }).exec();
    var withdrawHistory = await HistoryModel.find({userID: req.session.user.id, transaction_type: "Rút tiền"}).sort({ made_at: -1 }).exec();
    //Các loại giao dịch khác
    res.render('user/history', {recharge: rechargeHistory, withdraw: withdrawHistory});
})

module.exports = router;
