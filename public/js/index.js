//Render campaign
fetch("/api/1.0/marketing/campaigns", {
    method: "GET"
}).then(res => res.json())
    .then(res => {
        for (let i=0; i< res.data.length; i++) {
            let story = document.getElementsByClassName("story")[i];
            let visual = document.getElementsByClassName("visual")[i];
            visual.style.backgroundImage = `url(${res.data[i].url})`;
            story.innerHTML = res.data[i].story;
            visual.href = `/product.html?id=${res.data[i].product_id}`;
        }
        //Slide show
        let counter = 0;
        let visuals = document.getElementsByClassName("visual");
        let stories = document.getElementsByClassName("story");
        let circles = document.getElementsByClassName("circle");
        //Add class show to the element
        function addClass(i) {
            visuals[i].classList.add("show");
            stories[i].classList.add("show");
            circles[i].classList.add("show");
        }
        addClass(0);
        let itemsCount = res.data.length;
        let timer = 4000;
        let interval = window.setInterval(showNext, timer);
        let showCurrent = function() {
            let itemToShow = Math.abs(counter % itemsCount);
            for (let i of visuals) {
            
                i.classList.remove("show");
            }
            for (let j of stories) {
                j.classList.remove("show");
            }
            for (let k of circles) {
                k.classList.remove("show");
            }
            addClass(itemToShow);
        };
        function showNext() {
            counter ++;
            showCurrent();
        }
        let keyvisual = document.getElementById("keyvisual");
        keyvisual.addEventListener("mouseover", function () {
            interval = clearInterval(interval);
        });
        keyvisual.addEventListener("mouseout", function () {
            interval = window.setInterval(showNext, timer);
        });
        //Circle effect
        let current = document.getElementsByClassName("show");
        for (let i=0; i<circles.length; i++) {
            circles[i].addEventListener("click", function() {
                for (let j of current) {
                    j.classList.remove("show");
                }
                addClass(i);
            });
        }
    });

//Render product
fetch("/api/1.0/products/all", {
    method: "GET"
}).then(res => res.json())
    .then(res => {
        for (let j=0; j < res.data.length; j++) {
            let a = document.createElement("a");
            let img = document.createElement("img");
            let colors = document.createElement("div");
            let name = document.createElement("div");
            let price = document.createElement("div");
            let products = document.querySelector("#products");
            a.className = "product";
            a.href = `/product.html?id=${res.data[j].id}`;
            img.src = res.data[j].main_image[0];
            colors.className = "colors";
            for (let i=0; i<res.data[j].colors.length;i++) {
                let color = document.createElement("div");
                color.className = "color";
                color.style.backgroundColor = `#${res.data[j].colors[i].code}`;
                colors.appendChild(color);
            }
            name.className = "name";
            name.innerHTML = res.data[j].title;
            price.className = "price";
            price.innerHTML = `TWD.${res.data[j].price}`;
            a.appendChild(img);
            a.appendChild(colors);
            a.appendChild(name);
            a.appendChild(price);
            products.appendChild(a);
        }
    });