//Change sandbox to production when go online
cartBtn.addEventListener("click", function () {
    TPDirect.setupSDK(12348, "app_pa1pQcKoY22IlnSXq5m5WP5jFKzoRG58VEXpT7wU62ud7mMbDOGzCYIlzzLF", "sandbox");
    TPDirect.card.setup({
        fields: {
            number: {
                element: ".form-control.card-number",
                placeholder: "**** **** **** ****"
            },
            expirationDate: {
                element: document.getElementById("tappay-expiration-date"),
                placeholder: "MM / YY"
            },
            ccv: {
                element: $(".form-control.cvc")[0],
                placeholder: "後三碼"
            }
        },
        styles: {
            "input": {
                "color": "gray"
            },
            "input.ccv": {
                // 'font-size': '16px'
            },
            ":focus": {
                "color": "black"
            },
            ".valid": {
                "color": "green"
            },
            ".invalid": {
                "color": "red"
            },
            "@media screen and (max-width: 400px)": {
                "input": {
                    "color": "orange"
                }
            }
        }
    });
    // listen for TapPay Field
    TPDirect.card.onUpdate(function (update) {
        /* Disable / enable submit button depend on update.canGetPrime  */
        /* ============================================================ */

        // update.canGetPrime === true
        //     --> you can call TPDirect.card.getPrime()
        // const submitButton = document.querySelector('button[type="submit"]')
        if (update.canGetPrime) {
            // submitButton.removeAttribute('disabled')
            $("button[type=\"submit\"]").removeAttr("disabled");
        } else {
            // submitButton.setAttribute('disabled', true)
            $("button[type=\"submit\"]").attr("disabled", true);
        }


        /* Change card type display when card type change */
        /* ============================================== */

        // cardTypes = ['visa', 'mastercard', ...]
        let newType = update.cardType === "unknown" ? "" : update.cardType;
        $("#cardtype").text(newType);



        /* Change form-group style when tappay field status change */
        /* ======================================================= */

        // number 欄位是錯誤的
        if (update.status.number === 2) {
            setNumberFormGroupToError(".card-number-group");
        } else if (update.status.number === 0) {
            setNumberFormGroupToSuccess(".card-number-group");
        } else {
            setNumberFormGroupToNormal(".card-number-group");
        }

        if (update.status.expiry === 2) {
            setNumberFormGroupToError(".expiration-date-group");
        } else if (update.status.expiry === 0) {
            setNumberFormGroupToSuccess(".expiration-date-group");
        } else {
            setNumberFormGroupToNormal(".expiration-date-group");
        }

        if (update.status.cvc === 2) {
            setNumberFormGroupToError(".cvc-group");
        } else if (update.status.cvc === 0) {
            setNumberFormGroupToSuccess(".cvc-group");
        } else {
            setNumberFormGroupToNormal(".cvc-group");
        }
    });

    $("form").on("submit", function (event) {
        event.preventDefault();
        
        // fix keyboard issue in iOS device
        forceBlurIos();
        
        const tappayStatus = TPDirect.card.getTappayFieldsStatus();

        // Check TPDirect.card.getTappayFieldsStatus().canGetPrime before TPDirect.card.getPrime
        if (tappayStatus.canGetPrime === false) {
            alert("can not get prime");
            return;
        }

        // Get prime
        TPDirect.card.getPrime(function (result) {
            if (result.status !== 0) {
                alert("get prime error " + result.msg);
                return;
            }
            //Send msg to backend
            const data = {
                prime: result.card.prime,
                order: {
                    shipping: "快遞",
                    payment: "信用卡",
                    subtotal: parseInt(selectE(".price").innerText.substring(4), 10),
                    freight: 60,
                    total: parseInt(selectE(".price").innerText.substring(4), 10)+60,
                    recipient: {
                        name: "sandi",
                        phone: "09123456789",
                        email: "abc@gmail.com",
                        address: "台北市信義區",
                        time: "anytime"
                    },
                    list: getList()
                }
            };
            return fetch("/api/1.0/order/checkout", {
                method: "POST",
                body:JSON.stringify(data),
                headers: {
                    "content-type": "application/json"
                }
            }).then(res => res.json())
                .then(res => {
                    if (res.error) {
                        alert (res.error);
                    } else {
                        let orderNum = res.data.number;
                        localStorage.setItem("orderNum", orderNum);
                        location.href = "/thankyou.html";
                    }
                });
        });
    });

    function setNumberFormGroupToError(selector) {
        $(selector).addClass("has-error");
        $(selector).removeClass("has-success");
    }

    function setNumberFormGroupToSuccess(selector) {
        $(selector).removeClass("has-error");
        $(selector).addClass("has-success");
    }

    function setNumberFormGroupToNormal(selector) {
        $(selector).removeClass("has-error");
        $(selector).removeClass("has-success");
    }
    
    function forceBlurIos() {
        if (!isIos()) {
            return;
        }
        let input = document.createElement("input");
        input.setAttribute("type", "text");
        // Insert to active element to ensure scroll lands somewhere relevant
        document.activeElement.prepend(input);
        input.focus();
        input.parentNode.removeChild(input);
    }
    
    function isIos() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }
});