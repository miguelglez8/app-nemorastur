let createError = require('http-errors');
let express = require('express');
let path = require('path');
const fs = require('fs');

let app = express();




/**
 * Control de acceso mas permisivo
 */
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "POST, GET, DELETE, UPDATE, PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, token")
    next();
});


/**
 * Generacion de tokens
 */
let jwt = require('jsonwebtoken');
app.set('jwt', jwt);

/**
 * Para leer las peticiones POST
 */
let bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


/**
 * Encriptacion del sistema
 */
let crypto = require('crypto');
app.set('clave','abcdefg');
app.set('crypto', crypto);

/**
 * Cliente de MONGODB
 */
console.log(process.env)
const { MongoClient } = require("mongodb");
const url = 'mongodb+srv://admin:sdi@eii-sdi-cluster.uzjjiv6.mongodb.net/?retryWrites=true&w=majority'
app.set('connectionStrings', url);

let expressSession = require('express-session');
app.use(expressSession({
    secret: 'abcdefg',
    resave: true,
    saveUninitialized: true
}));

/**
 * Los repositorios del sistema
 */
let usersRepository = require("./repositories/usersRepository.js");
usersRepository.init(app, MongoClient);
let offersRepository = require("./repositories/offersRepository.js");
offersRepository.init(app, MongoClient);
let messagesRepository = require("./repositories/messagesRepository.js");
messagesRepository.init(app, MongoClient);
let logRepository = require("./repositories/logRepository");
logRepository.init(app, MongoClient);

/**
 * INDEX
 */
let indexRouter = require('./routes/index');
let userSessionRouter = require('./routes/userSessionRouter');
let userAdminRouter = require('./routes/userAdminRouter');
let logRouter = require("./routes/logRouter");

app.use("/users/list", userSessionRouter, logRouter);
app.use("/users/current", userSessionRouter, logRouter);

app.use("/offers/add",userSessionRouter);
app.use("/offers/list",userSessionRouter);
app.use("/offers/buy",userSessionRouter);
app.use("/offers/myoffers",userSessionRouter);
app.use("/offers/*", userSessionRouter, logRouter);
app.use("/users/admin/list", userAdminRouter, logRouter);
app.use("/users/admin/log", userAdminRouter, logRouter);
app.use("/users/delete", userAdminRouter, logRouter);
app.use("/users/logAction", userAdminRouter, logRouter);


const userTokenRouter = require('./routes/userTokenRouter');
const {getConnection} = require("./repositories/db");

/**
 * Generacion de usuarios del 1 al 16 y ofertas de la 1 a la 150
 * @type {*[]}
 */
let users = [];
let offers = [];
let title = "Oferta";
let detail = "Detalle";

for(let i = 1; i <= 16; i++){
    let name = "user" + i.toString().padStart(2, '0');
    users.push({
        email: name + "@email.com",
        rol: "STANDARD",
        name: name,
        surname: name,
        money: 100,
        password: app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(name).digest('hex')
    });

}

users.push({
    email: "admin" + "@email.com",
    rol: "ADMIN",
    name: "admin",
    surname: "admin",
    money: 100,
    password: app.get("crypto").createHmac('sha256', app.get('clave'))
        .update("admin").digest('hex')
});

fs.writeFileSync('../data/users.json', JSON.stringify(users));
console.log('JSON users generado correctamente');

for(let i=1; i<161; i++) {
    if(i < 11)
        name = "user01"
    else if (i < 21)
        name = "user02"
    else if (i < 31)
        name = "user03"
    else if (i < 41)
        name = "user04"
    else if (i < 51)
        name = "user05"
    else if (i < 61)
        name = "user06"
    else if (i < 71)
        name = "user07"
    else if (i < 81)
        name = "user08"
    else if (i < 91)
        name = "user09"
    else if (i < 101)
        name = "user10"
    else if (i < 111)
        name = "user11"
    else if (i < 121)
        name = "user12"
    else if (i < 131)
        name = "user13"
    else if (i < 141)
        name = "user14"
    else if (i < 151)
        name = "user15"
    else if (i < 161)
        name = "user16"

    offers.push({
        title: title + i,
        detail: detail + i,
        date: new Date().toDateString(),
        price: i,
        seller: name + "@email.com",
        isBuy: false
    });
}

fs.writeFileSync('../data/offers.json', JSON.stringify(offers));
console.log('JSON offers generado correctamente');

async function loadUsersData() {
    try {
        const client = await MongoClient.connect(url);
        const db = client.db("entrega2");
        const usersCollection = db.collection("users");

        const rawData = fs.readFileSync("../data/users.json");
        const users = JSON.parse(rawData);

        await usersCollection.deleteMany({});
        await usersCollection.insertMany(users);

        console.log(`Loaded ${users.length} users`);
    } catch (err) {
        console.error(`Failed to load users data: ${err}`);
    }
}

async function loadOffersData() {
    try {
        const client = await MongoClient.connect(url);
        const db = client.db("entrega2");
        const offersCollection = db.collection("offers");

        const rawData = fs.readFileSync("../data/offers.json");
        const offers = JSON.parse(rawData);

        await offersCollection.deleteMany();
        await offersCollection.insertMany(offers);

        console.log(`Loaded ${offers.length} offers`);
    } catch (err) {
        console.error(`Failed to load offers data: ${err}`);
    }
}

async function loadBuyData() {
    try {
        const client = await MongoClient.connect(url);
        const db = client.db("entrega2");

        const collections = await db.listCollections().toArray();
        const buysExists = collections.some((collection) => collection.name === "buys");

        if (buysExists) {
            const buysCollection = db.collection("buys");
            await buysCollection.drop();
            console.log("Deleted 'buys' collection");
        }

    } catch (err) {
        console.error(`Failed to delete buys: ${err}`);
    }
}

async function loadConversationData() {
    try {
        const client = await MongoClient.connect(url);
        const db = client.db("entrega2");

        const collections = await db.listCollections().toArray();
        const conversationsExists = collections.some((collection) => collection.name === "conversations");

        if (conversationsExists) {
            const conversationCollection = db.collection("conversations");
            await conversationCollection.drop();
            console.log("Deleted 'conversations' collection");
        }

        const messagesExists = collections.some((collection) => collection.name === "messages");

        if (messagesExists) {
            const messagesCollection = db.collection("messages");
            await messagesCollection.drop();
            console.log("Deleted 'messages' collection");
        }


    } catch (err) {
        console.error(`Failed to delete conversations or messages: ${err}`);
    }
}

async function loadLogsData() {
    try {
        const client = await MongoClient.connect(url);
        const db = client.db("entrega2");

        const collections = await db.listCollections().toArray();
        const logs = collections.some((collection) => collection.name === "logs");

        if (logs) {
            const logsCollection = db.collection("logs");
            await logsCollection.drop();
            console.log("Deleted 'logs' collection");
        }

    } catch (err) {
        console.error(`Failed to delete logs: ${err}`);
    }
}

/**
 * Motor de vistas twig
 */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');


app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
require("./routes/users.js")(app, usersRepository, logRepository);

require("./routes/offers.js")(app, usersRepository, offersRepository, messagesRepository);

app.use('/', indexRouter);

/**
 * Carga de usuarios y ofertas
 */
loadUsersData(); // users
loadOffersData(); // offers
loadBuyData(); // buyOffers
loadConversationData(); // conversations & messages
loadLogsData(); // logs

/**
 * Manejar errores 404
 */
app.use(function(req, res, next) {
    next(createError(404));
});

/**
 * Manejar errores
 */
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
