//CreateElement
function createE(name) {
    return document.createElement(name);
}
//SelectElement
function selectE(name) {
    return document.querySelector(name);
}
// Check the token
let token = localStorage.getItem("token");
if (token) {
    fetch("/api/1.0/user/profile", {
        method: "GET",
        headers: {
            "authorization": `${token}`
        }
    }).then(res => res.json())
        .then(res => {
            if (res.error) {
                document.getElementById("profile").innerHTML = 
                `<h1>請先登入或註冊</h1>
                <form name='form' id='login_form'>
                    <div class="form-input" id="login_name">
                        <label>姓名</label>
                        <input type='text' name='name' id='name'>
                    </div>
                    <div class="form-input" id="login_email">
                        <label>Email</label>
                        <input type='text' name='email' id='email'>
                    </div>
                    <div class="form-input" id="login_psd">
                        <label>密碼</label>
                        <input type='password' name='password' id='password'>
                    </div>
                    <button id="signinBtn" type="button" onclick="signIn()">登入</button>
                    <button id="signupBtn" type="button" onclick="signUp()">註冊</button>
                    <div id="msg">
                    <p id='signinMsg'></p>
                    <p id='signupMsg'></p>
                    </div>
                </form>`;
            } else {
                document.getElementById("profile").innerHTML = 
            `<h1>帳戶資料</h1>
                <form name='form' id='profile_form'></form>
                    <div class="form-input" id="profile_id">
                        <label>ID</label>
                        <span name='id' id='id'>${res.data.id}
                    </div>
                    <div class="form-input" id="profile_name">
                        <label>姓名</label>
                        <span name='name' id='name'>${res.data.name}
                    </div>
                    <div class="form-input" id="profile_email">
                        <label>Email</label>
                        <span name='email' id='email'>${res.data.email}
                    </div>
                </form>`;
            }
        });
} else {
    document.getElementById("profile").innerHTML = 
    `<h1>請先登入或註冊</h1>
    <form name='form' id='login_form'>
        <div class="form-input" id="login_name">
            <label>姓名</label>
            <input type='text' name='name' id='name'>
        </div>
        <div class="form-input" id="login_email">
            <label>Email</label>
            <input type='text' name='email' id='email'>
        </div>
        <div class="form-input" id="login_psd">
            <label>密碼</label>
            <input type='password' name='password' id='password'>
        </div>
        <button id="signinBtn" type="button" onclick="signIn()">登入</button>
        <button id="signupBtn" type="button" onclick="signUp()">註冊</button>
        <div id="msg">
        <p id='signinMsg'></p>
        <p id='signupMsg'></p>
        </div>
    </form>`;
}

function signIn() {
    let data = {
        provider: "native",
        email: selectE("#email").value,
        password: selectE("#password").value
    };
    return fetch("/api/1.0/user/signin", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "content-type": "application/json"
        },
    }).then(res => res.json())
        .then(res => {
            if (res.error !== undefined) {
                document.querySelector("#signupMsg").innerHTML = "";
                document.querySelector("#signinMsg").innerHTML = res.error;
            } else {
                let newToken = res.data.access_token;
                localStorage.setItem("token", newToken);
                document.getElementById("profile").innerHTML = 
            `<h1>帳戶資料</h1>
            <form name='form' id='profile_form'></form>
                <div class="form-input" id="profile_id">
                    <label>ID</label>
                    <span name='id' id='id'>${res.data.user.id}
                </div>
                <div class="form-input" id="profile_name">
                    <label>姓名</label>
                    <span name='name' id='name'>${res.data.user.name}
                </div>
                <div class="form-input" id="profile_email">
                    <label>Email</label>
                    <span name='email' id='email'>${res.data.user.email}
                </div>
            </form>`;
            }
        });
}

function signUp() {
    if (selectE("#email").value.search(/^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z]+$/) == -1) {
        document.querySelector("#signupMsg").innerHTML = "Email 格式錯誤";
    } else {
        let data = {
            provider: "native",
            name: selectE("#name").value,
            email: selectE("#email").value,
            password: selectE("#password").value
        };
        return fetch("/api/1.0/user/signup", {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "content-type": "application/json"
            }
        }).then(res => res.json())
            .then(res => {
                if (res.error !== undefined) {
                    document.querySelector("#signinMsg").innerHTML = "";
                    document.querySelector("#signupMsg").innerHTML = res.error;
                } else {
                    let newToken = res.data.access_token;
                    localStorage.setItem("token", newToken);
                    document.getElementById("profile").innerHTML = 
                    `<h1>帳戶資料</h1>
                    <form name='form' id='profile_form'></form>
                        <div class="form-input" id="profile_id">
                            <label>ID</label>
                            <span name='id' id='id'>${res.data.user.id}
                        </div>
                        <div class="form-input" id="profile_name">
                            <label>姓名</label>
                            <span name='name' id='name'>${res.data.user.name}
                        </div>
                        <div class="form-input" id="profile_email">
                            <label>Email</label>
                            <span name='email' id='email'>${res.data.user.email}
                        </div>
                    </form>`;          
                }
            });
    }
}