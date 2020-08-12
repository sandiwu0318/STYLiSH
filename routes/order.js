const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const axios = require("axios");
const { conQuery } = require("../utils/con");

router.post("/checkout", async (req, res) => {
    function getOrder(title) {
        return req.body.order[`${title}`];
    }
    function getRecipient(title) {
        return req.body.order.recipient[`${title}`];
    }
    function getList(i, title) {
        return req.body.order.list[i][`${title}`];
    }
    function getDetail() {
        let details = "";
        for (let i=0; i < (getOrder("list").length); i++) {
            details += `${getList(i, "name")}, `;
        }
        return details;
    }
    let hasher=crypto.createHash("md5");
    hasher.update(getRecipient("email")+req.body.prime);
    const hashMsg = hasher.digest("hex");
    for (let i=0; i < (getOrder("list").length); i++) {
        let data = {
            "prime": req.body.prime,
            "shipping": getOrder("shipping"),
            "payment": getOrder("payment"),
            "subtotal": getOrder("subtotal"),
            "freight": getOrder("freight"),
            "total": getOrder("total"),
            "name": getRecipient("name"),
            "phone": getRecipient("phone"),
            "email": getRecipient("email"),
            "address": getRecipient("address"),
            "time": getRecipient("time"),
            "product_id": getList(i, "id"),
            "product_name": getList(i, "name"),
            "product_price": getList(i, "price"),
            "product_colorName": getList(i, "color").name,
            "product_colorCode": getList(i, "color").code,
            "size": getList(i, "size"),
            "qty": getList(i, "qty"),
            "order_number": hashMsg,
            "status": "unpaid",
            "order_detail": JSON.stringify({id: getList(i, "id"), price: getList(i, "price"), color: {code: getList(i, "color").code, name: getList(i, "color").name}, size: getList(i, "size"), qty: getList(i, "qty")})
        };
        const insertOrder = "insert into orders set ?";
        const result = await conQuery(insertOrder, data);
        if (!result) {
            res.status(400);
            res.json({"error": "請確定所有欄位都填寫完畢"});
        }
    }
    const payment = {
        method: "post",
        url: "https://sandbox.tappaysdk.com/tpc/payment/pay-by-prime",
        headers: {
            "content-type": "application/json",
            "x-api-key": "partner_PHgswvYEk4QY6oy3n8X3CwiQCVQmv91ZcFoD5VrkGFXo8N7BFiLUxzeG"
        },
        data: {
            "prime": req.body.prime,
            "partner_key": "partner_PHgswvYEk4QY6oy3n8X3CwiQCVQmv91ZcFoD5VrkGFXo8N7BFiLUxzeG",
            "merchant_id": "AppWorksSchool_CTBC",
            "details": getDetail(),
            "amount": getOrder("total"),
            "order_number":hashMsg,
            "cardholder": {
                "phone_number":getRecipient("phone"),
                "name": getRecipient("name"),
                "email": getRecipient("email"),
                "zip_code": "",
                "address": "",
                "national_id": ""
            }
        }
    };
    axios(payment).then((result) => {
        if (result.data.status == "0") {
            const data = result.data;
            const record = {
                "rec_trade_id": data.rec_trade_id,
                "amount": data.amount,
                "last_four": data.card_info.last_four,
                "order_number": data.order_number
            };
            const updatePayment = async function() {
                const insertPayment = "insert into payment set ?";
                await conQuery(insertPayment, record);
                const updateOrder = "update orders set status = 'paid' where order_number = ?";
                await conQuery(updateOrder, record.order_number);
                const msg = {
                    "data":{
                        "number": record.order_number
                    }
                };
                return msg; 
            };
            updatePayment().then((msg) => {
                res.json(msg);
            });
        } else {
            res.json({"error": "付款失敗 請洽客服人員"});
        }
    });
});

router.get("/payments", async (req, res) => {
    let selectAll = "select user_id, sum(total) as total from orders group by user_id";
    const result = await conQuery(selectAll, 0);
    let data = [];

    let usersData = {};
    result.forEach( e => {
        let total = e["total"];
        let user_id = e["user_id"];
        let sum = usersData[user_id] || 0;
        usersData[user_id] = total + sum;
    });

    for (let [key, value] of Object.entries(usersData)) {
        let info = {
            user_id: key,
            total_payment: value
        };
        data.push(info);
    }

    let msg = {
        "data": data
    };
    res.json(msg);
});

router.get("/dashboardData", async (req, res) => {
    let rawData;
    try {
        rawData = await axios.get("http://arthurstylish.com:1234/api/1.0/order/data");
    } catch (err) {
        console.log(err);
    }
    let insertData = [];
    rawData.data.forEach( i => {
        let data =  [i.total, JSON.stringify(i.list)];
        insertData.push(data);
    });
    let insertDb = "insert into orders (total, order_detail) values ?";
    try {
        await conQuery(insertDb, [insertData]);
    } catch (err) {
        console.log(err);
    }
});



module.exports = router;