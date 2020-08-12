const express = require("express");
const router = express.Router();
const _ = require("lodash");
const { conQuery } = require("../utils/con");

router.get("/", async (req, res) => {
    const getData = async function () {
        let selectAll = "select total, order_detail from orders";
        const results = await conQuery(selectAll, 0);
        const details = results.map(order => JSON.parse(order.order_detail));

        //Total revenue
        let sum = _.sumBy(results, result => result.total);

        //Color pie
        const colorData = details.flatMap(detail => {
            return detail.map(p => ({
                color: p.color,
                qty: p.qty
            }));
        });
        const dataGroupByColor = _.groupBy(colorData, p => p.color.code);
        
        const productsDivideByColor = Object.keys(dataGroupByColor).map(color => {
            const d = dataGroupByColor[color];
            return {
                colorName: d[0].color.name,
                colorCode: d[0].color.code,
                count: _.sumBy(d, p => p.qty),
            };
        });

        //Price chart
        const productsInPriceRange = details.flatMap(detail => {
            return detail.flatMap(product => Array(product.qty).fill(product.price));
        });

        //Size Bar
        const sizeData = details.flatMap(detail => {
            return detail.map(p => ({
                id: p.id,
                size: p.size,
                qty: p.qty
            }));
        });
        const dataGroupById = _.groupBy(sizeData, p => p.id);
        const top5ProductIds = Object.keys(dataGroupById).map(key => {
            const d = dataGroupById[key];
            return {
                id: d[0].id,
                count: _.sumBy(d, p => p.qty),
            };
        })
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
            .map(p => p.id);
        
        const dataGroupByIdAndSize = _.groupBy(sizeData.filter(p => top5ProductIds.includes(p.id)), p => p.id + "|" + p.size);
        const allSizes = _.uniq(sizeData.map(p => p.size)).sort();
        const top5ProductsDividedBySize = allSizes.map(size => (
            {
                ids: top5ProductIds,
                count: top5ProductIds.map(id => _.sumBy(dataGroupByIdAndSize[id + "|" + size], p => p.qty)),
                size
            }
        ));
        
        let msg = {
            "data": {
                sum: sum,
                color: productsDivideByColor,
                price: productsInPriceRange,
                size: top5ProductsDividedBySize
            }
        };
        return msg;
    };
    module.exports = { getData };
    const msg = await getData();
    res.json(msg);
});

module.exports = router;