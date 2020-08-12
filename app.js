require("dotenv").config();
const {PORT, API_VERSION} = process.env;
const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const socketio = require("socket.io");
const http = require("http");
const server = http.createServer(app);
const io = socketio(server);
const getData = require("./routes/dashboard");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static("public"));
app.use(express.static("bower_components"));

app.set("view engine", "html");


const createProductRoutes = require("./routes/createProduct");
const createCampaignRoutes = require("./routes/createCampaign");
const productRoutes = require("./routes/products");
const campaignRoutes = require("./routes/campaigns");
const userRoutes = require("./routes/user");
const orderRoutes = require("./routes/order");
const dashboardRoutes = require("./routes/dashboard");
const testRoutes = require("./routes/test");


app.use("/createProduct", createProductRoutes);
app.use("/createCampaign", createCampaignRoutes);
app.use(`/api/${API_VERSION}/products`, productRoutes);
app.use(`/api/${API_VERSION}/marketing/campaigns`, campaignRoutes);
app.use(`/api/${API_VERSION}/user`, userRoutes);
app.use(`/api/${API_VERSION}/order`, orderRoutes);
app.use(`/api/${API_VERSION}/dashboard`, dashboardRoutes);
app.use("/test", testRoutes);

// io.on("connection", async socket => {
//     let data = await getData();
//     socket.emit("broadcast", data);
// });

server.listen(PORT, () => {
    console.log (`Listening on port ${PORT}`);
});