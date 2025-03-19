let createError = require('http-errors');
let express = require('express');
const serverless = require('serverless-http')
let path = require('path');
const fs = require('fs');
const requestIp = require('request-ip');
const multer = require('multer');
const moment = require('moment');
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

let app = express();


app.use(requestIp.mw());


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
const { MongoClient } = require("mongodb");
const url = 'mongodb://admin:adminpassword@localhost:27017/?authSource=admin'
app.set('connectionStrings', url);

let expressSession = require('express-session');
app.use(expressSession({
    secret: 'abcdefg',
    resave: true,
    saveUninitialized: true
}));

const serviceAccount = require('./service.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'nemorastur.appspot.com'
});

const bucket = admin.storage().bucket();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

async function uploadToFirebase(fileBuffer, filename, clientName, offerId) {
    try {
        const folderPath = `nemorastur/${clientName}/${offerId}/`;
        const file = bucket.file(`${folderPath}${filename}`);

        await file.save(fileBuffer, {
            metadata: { contentType: 'image/*' },
            public: true,
        });

        return `https://storage.googleapis.com/${bucket.name}/${file.name}`;
    } catch (error) {
        console.error("Error al subir el archivo a Firebase Storage:", error);
        throw error;
    }
}

module.exports = {
    upload,
    uploadToFirebase
};

/**
 * Los repositorios del sistema
 */
let usersRepository = require("./repositories/usersRepository.js");
usersRepository.init(app, MongoClient);
let offersRepository = require("./repositories/offersRepository.js");
offersRepository.init(app, MongoClient);


/**
 * INDEX
 */
let indexRouter = require('./routes/index');
let userSessionRouter = require('./routes/userSessionRouter');
let userAdminRouter = require('./routes/userAdminRouter');

app.use("/offers/add",userSessionRouter);
app.use("/offers/list",userSessionRouter);
app.use("/offers/myoffers",userSessionRouter);
app.use("/offers/editoffer",userSessionRouter);
app.use("/offers/*", userSessionRouter);
app.use("/users/admin/list", userAdminRouter);
app.use("/users/delete", userAdminRouter);

const userTokenRouter = require('./routes/userTokenRouter');
const {getConnection} = require("./repositories/db");

/**
 * Motor de vistas twig
 */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');


app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
require("./routes/users.js")(app, usersRepository, offersRepository);

require("./routes/offers.js")(app, usersRepository, offersRepository);

app.use('/', indexRouter);

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
