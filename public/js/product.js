// Add className current
function addCurrent(category, name) {
    let set = document.getElementsByClassName(category);
    for (let i=0; i < set.length; i++) {
        set[i].addEventListener("click", function() {
            let current = document.getElementsByClassName(name);
            if (current.length > 0) {
                current[0].className = category;
            }
            set[i].className += ` ${name}`;
        });
    }
}

//Add className inactive
function addInactive(name) {
    let element = document.querySelector(name);
    element.className = `${name} inactive`;
}
//Convert rgb to hex
const rgbToHex = function (rgb) { 
    let hex = Number(rgb).toString(16);
    if (hex.length < 2) {
        hex = "0" + hex;
    }
    return hex;
};
const fullColorHex = function(r, g, b) {   
    let red = rgbToHex(r);
    let green = rgbToHex(g);
    let blue = rgbToHex(b);
    return red+green+blue;
};

//Calculate the stock

let max;
function calAdd() {
    let value = document.getElementById("stock-value").innerText;
    let parseValue = parseInt(value, 10);
    if (parseValue < max)
        parseValue += 1;
    document.getElementById("stock-value").innerText = parseValue;
}
function calReduce() {
    let value = document.getElementById("stock-value").innerText;
    let parseValue = parseInt(value, 10);
    if (parseValue == 1) {
        document.getElementById("stock-value").innerText = 1;
    } else {
        parseValue -= 1;
        document.getElementById("stock-value").innerText = parseValue;
    }
}
//Get query string
const params = new URLSearchParams(window.location.search);
let id = params.get("id");

//CreateElement
function createE(name) {
    return document.createElement(name);
}
//SelectElement
function selectE(name) {
    return document.querySelector(name);
}
// Render product
fetch(`/api/1.0/products/details?id=${id}`, {
    method: "GET"
}).then(res => res.json())
    .then(res => {
        if (res.error) {
            selectE(".product_view").innerHTML = `<h1>${res.error}</h1>`;
        }
        let img = createE("img");
        let name = createE("div");
        let id = createE("div");
        let price = createE("div");
        let oimg1 = createE("img");
        let oimg2 = createE("img");
        let mainImage = selectE("#product-main-image");
        let details = selectE(".details");
        let colors = selectE(".colors");
        let sizes = selectE(".sizes");
        let qty = selectE(".qty");
        let addCart = selectE(".add-cart");
        let summary = selectE(".summary");
        let description = selectE(".description");
        let story = selectE("#product-story");
        let images = selectE(".images");
        //Create color options
        for (let i=0; i<res.data.colors.length;i++) {
            let color = createE("div");
            color.className = "color";
            color.style.backgroundColor = `#${res.data.colors[i].code}`;
            colors.appendChild(color);
        }

        //Create size options
        for (let i=0; i<res.data.sizes.length;i++) {
            let size = document.createElement("div");
            size.className = "size";
            size.innerText = `${res.data.sizes[i]}`;
            sizes.appendChild(size);
        }
    
        //Set className
        name.className = "name";
        name.id = "product-name";
        id.className = "id";
        id.id = "product-id";
        price.className = "price";
        price.id = "product-price";
        colors.className = "colors";
        colors.id = "product-colors";
        sizes.className = "sizes";
        sizes.id = "product-sizes";
        //Insert value
        img.src = `${res.data.main_image[0]}`;
        img.id = "mainImg";
        name.innerHTML = res.data.title;
        id.innerHTML = res.data.id;
        price.innerHTML = `TWD.${res.data.price}`;
        summary.innerHTML = `${res.data.note}<br><br>材質：${res.data.texture}<br>清洗：${res.data.wash}<br>產地：${res.data.place}`;
        story.innerText = res.data.story;
        oimg1.src = `${res.data.images[0]}`;
        oimg2.src = `${res.data.images[1]}`;
        //Insert into details
        mainImage.appendChild(img);
        details.insertBefore(name, qty);
        details.insertBefore(id, qty);
        details.insertBefore(price, qty);
        details.insertBefore(colors, qty);
        details.insertBefore(sizes, qty);
        images.appendChild(oimg1);
        images.appendChild(oimg2);
        //Add current effect
        addCurrent("color", "currentColor");
        addCurrent("size", "currentSize");
        //Create inactive effect
        let active = {};
        let sizeArr;
        for (let j of res.data.colors) {
            sizeArr = [];
            for (let i of res.data.variants) {
                if (i.color_code == j.code) {
                    sizeArr.push(i.size);
                }
            }
            active[j.code] = sizeArr;
        }
        let colorSet = document.getElementsByClassName("color");
        //Click the color and add the inactive effect
        for (let i of colorSet) {
            i.addEventListener("click", function () {
                let sizeSet = document.getElementsByClassName("size");
                let r = i.style.backgroundColor.substring(4, 7);
                let g = i.style.backgroundColor.substring(9, 12);
                let b = i.style.backgroundColor.substring(14, 17);
                let hex = fullColorHex(r, g, b).toUpperCase();
                let activeSize = active[hex];
                let activeArr = [];
                for (let i=0; i< sizeSet.length; i++) {
                    if (activeSize.includes(sizeSet[i].innerText)) {
                        sizeSet[i].className = "size";
                        activeArr.push(i);
                    } else {
                        sizeSet[i].className = "size inactive";
                    }
                }
                document.getElementsByClassName("size")[activeArr[0]].className = "size currentSize";
                //Run first time when click the color
                for (let j of sizeSet) {
                    for (let k of res.data.variants) {
                        if (hex == k.color_code && j.innerText == k.size) {
                            document.getElementById("stock-value").innerText = 1;
                            max = k.stock;
                        }
                    }
                }
                //Get the max stock for each color+size
                for (let j of sizeSet) {
                    j.addEventListener("click", function () {
                        for (let k of res.data.variants) {
                            if (hex == k.color_code && j.innerText == k.size) {
                                document.getElementById("stock-value").innerText = 1;
                                max = k.stock;
                            }
                        }
                    });
                }
            });
        }
    
    });
let cartBtn = selectE("#product-add-cart-btn");
cartBtn.addEventListener("click", function () {
    if (selectE(".currentColor") && selectE(".currentSize")) {
        selectE(".summary").innerHTML = 
        `<form id="checkout-form">
        <div class="form-group card-number-group">
            <label for="card-number" class="control-label"><span id="cardtype"></span>卡號</label>
            <div class="form-control card-number"></div>
        </div>
        <div class="form-group expiration-date-group">
            <label for="expiration-date" class="control-label">卡片到期日</label>
            <div class="form-control expiration-date" id="tappay-expiration-date"></div>
        </div>
        <div class="form-group cvc-group">
            <label for="cvc" class="control-label">卡片後三碼</label>
            <div class="form-control cvc"></div>
        </div>

        <button type="submit" class="btn btn-default">Pay</button>
        </form>`;
    } else {
        alert("請先選擇顏色和尺寸");
    }
});
// //Get class
function getClass(className) {
    return document.getElementsByClassName(`${className}`);
}

function getList () {
    let list = [];
    let product = {
        id: selectE("#product-id").innerText,
        name: selectE("#product-name").innerText,
        price: selectE("#product-price").innerText.substring(4),
        color: {
            name: "白色",
            code: selectE(".currentColor").style.backgroundColor
        },
        size: selectE(".currentSize").innerText,
        qty: selectE("#stock-value").innerText,
    };
    list.push(product);
    return list;
}