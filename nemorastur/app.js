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


/**
 * INDEX
 */
let indexRouter = require('./routes/index');
let userSessionRouter = require('./routes/userSessionRouter');
let userAdminRouter = require('./routes/userAdminRouter');

app.use("/users/list", userSessionRouter);
app.use("/users/current", userSessionRouter);

app.use("/offers/add",userSessionRouter);
app.use("/offers/list",userSessionRouter);
app.use("/offers/myoffers",userSessionRouter);
app.use("/offers/*", userSessionRouter);
app.use("/users/admin/list", userAdminRouter);
app.use("/users/admin/log", userAdminRouter);
app.use("/users/delete", userAdminRouter);
app.use("/users/logAction", userAdminRouter);


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
require("./routes/users.js")(app, usersRepository);

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