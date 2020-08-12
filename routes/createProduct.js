require("dotenv").config();
const express = require("express");
const multer = require("multer");
const multerS3 = require("multer-s3");
const AWS = require("aws-sdk");
const router = express.Router();
const path = require("path");
const { conQuery } = require("../utils/con");

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

router.post("/addNewProduct", async (req, res) => {
    const data = {
        "category": req.body.category,
        "title": req.body.title,
        "description": req.body.description,
        "price": parseInt(req.body.price, 10),
        "texture": req.body.texture,
        "wash": req.body.wash,
        "place": req.body.place,
        "note": req.body.note,
        "story": req.body.story
    };
    const insertIntoProduct = "insert into product set ?";
    let result = await conQuery(insertIntoProduct, data);
    if (result.length === 0) {
        res.json({"error": "請確認完全填寫或是 Title 重複"});
    } else {
        res.json({"success": "Success"});
    }
});

router.post("/addNewStock", async (req, res) => {
    const title = req.body.title;
    const findProductId = "select id from product where title =?";
    let result = await conQuery(findProductId, title);
    if (result.length === 0) {
        res.json({"error": "Please create the product first"});
    } else {
        const data = {
            "title": req.body.title,
            "color_code": req.body.color_code,
            "color_name": req.body.color_name,
            "size": req.body.size,
            "stock": parseInt(req.body.stock, 10),
            "product_id": result[0].id
        };
        const insertIntoProduct = "insert into variant set ?";
        let insertResult = await conQuery(insertIntoProduct, data);
        if (insertResult.length === 0) {
            res.json({"error": "Stock already existed"});
        } else {
            res.json({"success": "Success"});
        }
    }
});

router.post("/addMainImage", uploadS3.single("main_image"), async (req, res) => {
    console.log(req.file);
    if(!req.file) {
        res.json({"error":"No file received!"});
    } else {
        const title = req.body.title;
        const findProductId = "select id from product where title =?";
        let result = await conQuery(findProductId, title);
        if (result.length === 0) {
            res.json({"error": "Please create the product first"});
        } else {
            const data = {
                "image_name": req.file.key,
                "url": req.file.location,
                "type": req.file.mimetype,
                "size": req.file.size,
                "product_id": result[0].id
            };
            const insertIntoMainImage = "insert into main_image set ?";
            let insertResult = await conQuery(insertIntoMainImage, data);
            if (insertResult.length === 0) {
                res.json({"error": "Please create the product first"});
            } else {
                res.json({"success": "Success"});
            }
        }
    }
});

router.post("/addOtherImages", uploadS3.array("other_images", 3), async (req, res) => {
    if(!req.files) {
        res.json({"error":"No file received!"});
    } else {
        const title = req.body.title;
        const findProductId = "select id from product where title =?";
        let result = await conQuery(findProductId, title);
        if (result.length === 0) {
            res.json({"error": "Please create the product first"});
        } else {
            for (let i=0;i<req.files.length;i++){
                const data = {
                    "image_name": req.files[i].key,
                    "url": req.files[i].location,
                    "type": req.files[i].mimetype,
                    "size": req.files[i].size,
                    "product_id": result[0].id
                };
                const insertIntoOtherImage = "insert into other_image set ?";
                let insertResult = await conQuery(insertIntoOtherImage, data);
                if (insertResult.length === 0) {
                    res.json({"error": "Please create the product first"});
                }
            }
            res.json({"success": "Success"});
        }
    }
});

module.exports = router;