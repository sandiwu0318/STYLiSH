require("dotenv").config();
const express = require("express");
const multer = require("multer");
const multerS3 = require("multer-s3");
const AWS = require("aws-sdk");
const router = express.Router();
const path = require("path");
const { conQuery } = require("../utils/con");
const memcached = require("memcached");
const cache = new memcached("localhost:11211");

//Set S3 storage engine
const s3 = new AWS.S3({
    accessKeyId: process.env.ACCESSKEYID,
    secretAccessKey: process.env.SECRETACCESSKEY
});

// Init Upload
const uploadS3 = multer({
    storage: multerS3({
        s3: s3,
        acl: "public-read",
        bucket: process.env.BUCKET,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: (req, file, cb) => {
            cb(null, {fieldname: file.fieldname});
        },
        key: (req, file, cb) => {
            cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
        }
    }),
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
});

//Only accept images
function checkFileType(file, cb) {
    const fileTypes = /(jpg|jpeg|png|gif)/;
    const extname = fileTypes.test(path.extname(file.originalname).toLocaleLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb("Error: Images only!");
    }
}

router.get("/getProductId", async (req, res) => {
    const getProduct = "select id from product";
    let result = await conQuery(getProduct, 0);
    if (result.length === 0) {
        res.json({"error": "Can\"t find the id from database"});
    }
    res.json(result);
});
//
router.post("/addNewCampaign", uploadS3.single("campaign"), async (req, res) => {
    console.log(req.file);
    console.log(req.body);
    if(!req.file) {
        res.json({"error":"No file received!"});
    } else {
        console.log("here");
        const data = {
            "product_id": req.body.product_id,
            "picture":req.file.key,
            "url": `uploads/campaigns/${req.file.key}`,
            "story": req.body.story
        };
        const insertIntoCampaign = "insert into campaign set ?";
        let result = await conQuery(insertIntoCampaign, data);
        if(result.length === 0) {
            res.json({"error":"Server error"});
        }
        const selectCampaign = "select product_id,picture,story from campaign";
        let selectResult = await conQuery(selectCampaign, 0);
        let msg = {};
        msg.data = selectResult;
        try {
            cache.replace("campaign", JSON.stringify(msg), 0, function (err) {
                if (err) {
                    throw err;
                }
            });
        } catch (err) {
            console.log(err);
        }
        res.json({"success": "Success"});
    }
});

module.exports = router;