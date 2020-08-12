let orderNum = localStorage.getItem("orderNum");
window.addEventListener("load", function (){
    document.getElementById("thankyou").innerHTML = 
    `<h1>謝謝你的訂購，我們會盡快將商品送出！</h1>
    <p>訂單編號為<span> ${orderNum}</span></p>
    <p>請記下訂單號碼以方便日後查詢</p>`;
});
