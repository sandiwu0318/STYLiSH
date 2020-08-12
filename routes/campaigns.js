const express = require("express");
const router = express.Router();
const { conQuery } = require("../utils/con");
const memcached = require("memcached");
const cache = new memcached("localhost:11211");

//Get the data from campaign
router.get("/", async (req, res) => {
    let msg = {};
    try {
        cache.get("campaign", function(err, data) {
            if (err) {
                throw err;
            } else if (data !== undefined ){
                msg.data = JSON.parse(data);
                return msg;
            }
        });
    } catch (err) {
        console.log(err);
    }
    const selectCampaign = "select product_id,url,story from campaign";
    const result = await conQuery(selectCampaign, 0);
    msg.data = result;
    try {
        cache.set("campaign", JSON.stringify(msg), 0, function (err) {
            if (err) {
                throw err;
            }
        });
    } catch (err) {
        console.log(err);
    }
    res.json(msg);   
});

module.exports = router;
