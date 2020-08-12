const express = require("express");
const router = express.Router();
const { con } = require("../utils/con");

router.get("/", (req, res) => {
    function getRandom(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
    const times = 1000;
    let querySet = [];
    let i=0;
    while (i<times) {
        let query = [getRandom(1, 6), getRandom(100, 1000)];
        querySet.push(query);
        i++;
    }
    con.query("insert into orders (user_id, total) values ?", [querySet], function (err) {
        if (err) {
            console.log(err);
        } else {
            res.send("success");
        }
    });
});

module.exports = router;