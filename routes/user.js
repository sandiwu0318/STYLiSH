const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const CryptoJS = require("crypto-js");
const axios = require("axios");
const { conQuery } = require("../utils/con");

//Sign up
router.post("/signup", async (req, res) => {
    const pass = CryptoJS.AES.encrypt(req.body.password, req.body.email).toString();
    let data = {
        "provider":"native",
        "name": req.body.name,
        "email":req.body.email,
        "password": pass,
        "access_expired":10000,
        "lastLogin": Date.now().toString()
    };
        //Prevent same email
    const checkEmail = "select count(*) as count from user where email = ?";
    const checkEmailResult = await conQuery(checkEmail, req.body.email);
    let msg = {};
    if (checkEmailResult[0].count > 0) {
        msg = {"error": "你已經註冊過了哦"};
    } else {
        //Create access_token
        data.access_token = createToken(data);
        //Insert into table user
        const insertUser = "insert into user set ?";
        await conQuery(insertUser, data);
        const selectUser = "select * from user where email = ?";
        const selectUserResult = await conQuery(selectUser, req.body.email);
        msg = msgJSON(selectUserResult);
    }
    if (msg.error) {
        res.status(403).json(msg);
    } else {
        res.json(msg);
    }
});

//Sign in
router.post("/signin", async (req, res) => {
    if (req.body.provider == "native") {
        const data = {
            "provider":req.body.provider,
            "email":req.body.email,
            "lastLogin": Date.now().toString()
        };
        //Check email exist
        const checkUser = "select count(*) as count, password, provider from user where email = ?";
        const checkUserResult = await conQuery(checkUser, req.body.email);
        let msg = {};
        if (checkUserResult[0].count == 0) {
            msg = {"error": "你還沒註冊唷"};
        } else {
            if (checkUserResult[0].provider === "native"){
                if (CryptoJS.AES.decrypt(checkUserResult[0].password, req.body.email).toString(CryptoJS.enc.Utf8) !== req.body.password) {   
                    msg = {"error": "密碼錯了唷"};
                } else {
                    const token = createToken(data);
                    //Update access_token
                    const updateToken = "update user set access_token = ? where email = ?";
                    await conQuery(updateToken, [token, req.body.email]);
                    const selectUser = "select * from user where email = ?";
                    const selectUserResult = await conQuery(selectUser, req.body.email);
                    msg = msgJSON(selectUserResult);
                }
            } else {
                msg = {"error": "請用 Facebook 登入"};
            }
        }
        if (msg.error) {
            res.status(400).json(msg);
        } else {
            res.json(msg);
        }  
    } else {
        //FB login
        let fb_token = req.body.access_token;
        axios.all([fb1(fb_token), fb2(fb_token)])
            .then(axios.spread(async (response1, response2) => {
                let data = {
                    "provider":req.body.provider,
                    "name":response1.data.name,
                    "email":response1.data.email,
                    "picture": response2.data.data.url,
                    "access_expired":10000,
                    "lastLogin": Date.now().toString()
                };
                data.access_token = createToken(data);
                const checkUser = "select count(*) as count,password from user where email = ?";
                const checkUserResult = await conQuery(checkUser, data.email);
                if (checkUserResult[0].count == 0) {
                    const insertUser = "insert into user set ?";
                    await conQuery(insertUser, data);
                        
                } else {
                    //Update access_token
                    const newToken = createToken(data);
                    const updateToken = "update user set access_token = ? where email = ?";
                    await conQuery(updateToken, [newToken, data.email]);
                }
                const selectUser = "select * from user where email = ?";
                const selectUserResult = await conQuery(selectUser, data.email);
                let msg = {};
                msg = msgJSON(selectUserResult);
                res.json(msg);
            })).catch(function(err) {
                console.log(err);
            });
    }
});
//Get FB name and email
function fb1(token) {
    return axios.get(`https://graph.facebook.com/me?fields=name,email&access_token=${token}`);
}
//Get picture
function fb2(token) {
    return axios.get(`https://graph.facebook.com/me/picture?redirect=0&access_token=${token}`);
}

//Create new access_token everytime
function createToken(data) {
    let hasher=crypto.createHash("md5");
    hasher.update(data.email+Date.now().toString());
    const hashMsg = hasher.digest("hex");
    return hashMsg;
}

//return msg in API doc format
function msgJSON(result) {
    let msg = {};
    let data = {};
    let user = result[0];
    const access_token = result[0].access_token;
    const access_expired = result[0].access_expired;
    delete user.access_token;
    delete user.access_expired;
    delete user.password;
    delete user.lastLogin;
    data.access_token = access_token;
    data.access_expired = access_expired;
    data.user = user;
    msg.data = data;
    return msg;
}

//Get profile
router.get("/profile", async (req, res) => {
    const token_client = req.headers.authorization;
    const token_db = "select id, name, email from user where access_token = ?";
    const result = await conQuery(token_db, token_client);
    if (result.length === 0) {
        res.status(400);
        res.json({"error": "Token 錯誤"});
    } else {
        let msg = {};
        msg.data = result[0];
        res.json(msg);
    }
});


module.exports = router;