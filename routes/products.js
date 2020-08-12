const express = require("express");
const router = express.Router();
const { conQuery } = require("../utils/con");
const memcached = require("memcached");
const cache = new memcached("localhost:11211");

router.get("/:category", async (req, res) => {
    const category = req.params.category;
    const categories = ["all", "women", "men", "accessories"];
    //If no paging, default 0
    const paging = parseInt(req.query.paging) || 0;
    const id = req.query.id;
    const keyword = req.query.keyword;
    let selectProduct;
    let productValue;
    let countAll;
    let coutAllValue;
    //All
    if (category === "all") {
        selectProduct = "select * from product limit 6 offset ?";
        productValue = paging*6;
        countAll = "select count(id) as count from product";
        coutAllValue = "";
        //Women, Men, Accessories
    } else if (categories.includes(category)){
        selectProduct = "select * from product where category = ? limit 6 offset ?";
        productValue = [category, paging*6];
        countAll = "select count(id) as count from product where category = ?";
        coutAllValue = category;
        //Search
    } else if (category === "search") {
        selectProduct = "select * from product where title like ? limit 6 offset ?";
        productValue = [`%${keyword}%`, paging*6];
        countAll = "select count(id) as count from product where title like ?";
        coutAllValue = `%${keyword}%`;
        //Details
    } else if (category === "details"){
        selectProduct = "select * from product where id = ?";
        productValue = id;
        countAll = "select count(id) as count from product where id = ?";
        coutAllValue = id;
        //Cache mechanism for product details
        let msg = {};
        try {
            cache.get("details", function(err, data) {
                if (err) {
                    throw err;
                } else if (data !== undefined && JSON.parse(data)[id] !== undefined) {
                    msg.data = JSON.parse(data)[id];
                    return msg;
                }
            });
        } catch (err) {
            console.log(err);
        }
    }
    const productSet = await conQuery(selectProduct, productValue);
    const idSet = productSet.map(p => p.id);
    const selectColor = "select distinct color_code as code, color_name as name, product_id from variant where product_id in (?)";
    const selectSize = "select distinct size, product_id from variant where product_id in (?)";
    const selectVariant = "select color_code, size, stock,product_id from variant where product_id in (?)";
    const selectMainImage = "select url,product_id from main_image where product_id in (?)";
    const selectOtherImage = "select url,product_id from other_image where product_id in (?)";
    const colorSet = await conQuery(selectColor, [idSet]);
    const sizeSet = await conQuery(selectSize, [idSet]);
    const variantSet = await conQuery(selectVariant, [idSet]);
    const mainImageSet = await conQuery(selectMainImage, [idSet]);
    const otherImageSet = await conQuery(selectOtherImage, [idSet]);
    const pagingCount = await conQuery(countAll, coutAllValue);
    //Append data to each product
    function appendJson(product, category, categorySet) {
        let set = categorySet.filter(c => c.product_id === product.id);
        set.forEach(c => delete c.product_id);
        product[`${category}`] = set;
    }
    function appendArray(product, category, categorySet, title) {
        let set = categorySet.filter(c => c.product_id === product.id);
        set.forEach(c => delete c.product_id);
        let newSet = set.map(c => c[title]);
        product[`${category}`] = newSet;
    }
    let msg = {};
    for (let p of productSet) {
        delete p.category;
        appendJson(p, "colors", colorSet);
        appendArray(p, "sizes", sizeSet, "size");
        appendJson(p, "variants", variantSet);
        appendArray(p, "main_image", mainImageSet, "url");
        appendArray(p, "images", otherImageSet, "url");
        let nextPaging = `${Math.floor((pagingCount[0].count-1)/6)-paging}`;
        if (pagingCount[0].count > 1) {
            msg.data = productSet;
        } else {
            msg.data = productSet[0];
        }
        if (nextPaging > 0) {
            msg.next_paging = nextPaging;
        }
    }

    if (Object.keys(msg).length !== 0) {
        res.json(msg);
    } else {
        res.json({"error":"找不到此商品"});
    }
});

module.exports = router;