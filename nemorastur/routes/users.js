const {ObjectId} = require("mongodb");
module.exports = function (app, usersRepository, logsRepository) {

    /**
     * Funcionalidad listado de usuarios con busqueda y paginacion
     */
    app.get("/users/list", function (req, res) {
        let filter = {rol: {$not: {$eq: "ADMIN"}}, email: {$not: {$eq: req.session.user}}};
        let options = {sort: {email: 1}};

        if (req.query.search != null && typeof (req.query.search) != "undefined" && req.query.search != "") {
            filter = {
                rol: {$not: {$eq: "ADMIN"}}, email: {$not: {$eq: req.session.user}},
                email: {$regex: ".*" + req.query.search + ".*"}
            };
        }

        //For pagination
        let page = parseInt(req.query.page); // Es String !!!
        if (typeof req.query.page === "undefined" || req.query.page === null || req.query.page === "0") { //
            page = 1;
        }

        usersRepository.getUsersPg(filter, options, page)
            .then(result => {
                let lastPage = result.total / 5;
                if (result.total % 5 > 0) { // Decimales
                    lastPage = lastPage + 1;
                }
                let pages = [];
                for (let i = page - 2; i <= page + 2; i++) {
                    if (i > 0 && i <= lastPage) {
                        pages.push(i);
                    }
                }
                usersRepository.findUser({email: req.session.user}, options).then(user => {
                    let response = {
                        users: result.users,
                        pages: pages,
                        currentPage: page,
                        session: req.session,
                        search: req.query.search,
                        money: user.money
                    }
                    res.render("users/list.twig", response);
                }).catch(error => {
                    res.send("Se ha producido un error al encontrar el usuario en sesión: " + error)
                });
            })
            .catch( () => {
                res.redirect("/" +
                    "?message=Ha ocurrido un error al listar los usuarios." +
                    "&messageType=alert-danger ");
            });
    });

    /**
     * Funcionalidad GET de login
     */
    app.get('/users/login', function (req, res) {
        res.render("login.twig");
    });

    /**
     * Listado de admin
     */
    app.get("/users/admin/list", function (req, res) {
        let filter = {};
        let options = {sort: {email: 1}};

        //For pagination
        let page = parseInt(req.query.page);
        if (typeof req.query.page === "undefined" || req.query.page === null || req.query.page === "0") {
            page = 1;
        }

        usersRepository.getUsersPg(filter, options, page)
            .then(result => {
                let lastPage = result.total / 5;
                if (result.total % 5 > 0) { // Decimales
                    lastPage = lastPage + 1;
                }
                let pages = [];
                for (let i = page - 2; i <= page + 2; i++) {
                    if (i > 0 && i <= lastPage) {
                        pages.push(i);
                    }
                }
                usersRepository.findUser({email: req.session.user}, options).then(user => {
                    let response = {
                        users: result.users,
                        pages: pages,
                        currentPage: page,
                        session: req.session,
                        search: req.query.search,
                        money: user.money
                    }
                    res.render("users/admin/list.twig", response);
                }).catch(error => {
                    res.send("Se ha producido un error al encontrar el usuario en sesión: " + error)
                });
            })
            .catch(() => {
                res.redirect("/" +
                    "?message=Ha ocurrido un error al listar los usuarios." +
                    "&messageType=alert-danger ");
            });
    });

    /**
     * Listado de logs
     */
    app.get("/users/admin/log", function (req, res) {
        let filter = {};
        let options = {sort: {date: -1}};

        logsRepository.getLogs(filter, options)
            .then(result => {
                usersRepository.findUser({email: req.session.user}, options).then(user => {
                    let response = {
                        logs: result.logs,
                        session: req.session,
                        search: req.query.search,
                        money: user.money,
                    }
                    res.render("users/admin/log.twig", response);
                });
            })
            .catch(() => {
                    res.redirect("/" +
                        "?message=Ha ocurrido un error al listar los logs." +
                        "&messageType=alert-danger ");
                }
            );
    });


    /**
     * Funcionalidad borrado de usuarios
     */
    app.get('/users/delete', function (req, res) {
        var list = [];
        if (req.query.deleteList != null && req.query.deleteList != undefined) {
            if (!Array.isArray(req.query.deleteList)) {
                list[0] = req.query.deleteList;
            } else {
                list = req.query.deleteList;
            }

            for (const listElement of list) {
                deleteUser(listElement, res);
            }
        }

        res.redirect("/users/admin/list");
    });

    /**
     * Funcionalidad borrado de todos los logs
     */
    app.get('/users/logAction', function (req, res) {
        let filter = {};
        let options = {};

        if (req.query.action === "deleteLogs") {
            logsRepository.deleteLogs(filter, options);
            res.redirect("/users/admin/log");
        } else {
            if(req.query.action !== "Todos"){
                filter = {type: req.query.action};
            }
            options = {sort: {date: -1}};

            //For pagination
            let page = parseInt(req.query.page); // Es String !!!
            if (typeof req.query.page === "undefined" || req.query.page === null || req.query.page === "0") { //
                page = 1;
            }

            logsRepository.getLogs(filter, options)
                .then(result => {

                    usersRepository.findUser({email: req.session.user}, options).then(user => {
                        let response = {
                            logs: result.logs,
                            session: req.session,
                            search: req.query.search,
                            money: user.money,
                        }
                        res.render("users/admin/log.twig", response);
                    });
                })
                .catch(() => {
                        res.redirect("/" +
                            "?message=Ha ocurrido un error al listar los logs." +
                            "&messageType=alert-danger ");
                    }
                );
        }
    });

    /**
     * Funcion que borra un usuario
     */
    function deleteUser(userId, res) {
        usersRepository.deleteUser({_id: new ObjectId(userId)}, {}).then(result => {
            if (result == null || result.deletedCount == 0) {
                res.write("No se ha podido eliminar el registro");
            } else {
                res.end();
            }
        }).catch( () => {
            res.redirect("/" +
                "?message=Ha ocurrido un error al eliminar usuarios." +
                "&messageType=alert-danger ")
        });
    }


    /**
     * POST de login
     */
    app.post('/users/login', function (req, res) {
        let securePassword = app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');
        let filter = {
            email: req.body.email,
            password: securePassword
        }
        console.log(req.body.email);
        let options = {}
        usersRepository.findUser(filter, options).then(user => {
            if (user == null) {
                let now = new Date();
                log = {
                    type: "LOGIN-ERR",
                    date: now.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                    description: req.body.email
                };
                logsRepository.insertLog(log);
                req.session.user = null;
                res.redirect("/users/login" +
                    "?message=Email o password incorrecto" +
                    "&messageType=alert-danger ");
            } else {
                req.session.user = user.email;
                let now = new Date();
                log = {
                    type: "LOGIN-EX",
                    date: now.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                    description: req.session.user
                };
                logsRepository.insertLog(log);
                res.redirect("/offers/myoffers");
            }
        }).catch(() => {
            let now = new Date();
            log = {
                type: "LOGIN-ERR",
                date: now.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                description: req.session.user
            };
            logsRepository.insertLog(log);
            req.session.user = null;
            res.redirect("/users/login" +
                "?message=Se ha producido un error al buscar el usuario" +
                "&messageType=alert-danger ");
        })
    });







    /**
     * Registro de usuarios GET
     */
    app.get('/users/signup', function (req, res) {
        res.render("signup.twig");
    })

    /**
     * Registro de usuarios POST
     */
    app.post('/users/signup', async function (req, res) {
        let birthdate = req.body.birthdate;

        let securePassword = app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');
        let user = {
            email: req.body.email,
            password: securePassword,
            name: req.body.email,
            surname: req.body.surname,
            birthdate: birthdate,
            rol: "STANDARD",
            money: 100
        }


        await validateUser(user, req.body.password, req.body.passwordConfirm).then(result => {
            if (result.length > 0) {
                let url = ""
                for (error in result) {
                    url += "&message=" + result[error] + "&messageType=alert-danger "
                }
                res.redirect("/users/signup?" + url);
                return
            }
            usersRepository.insertUser(user).then(() => {
                let now = new Date();
                log = {
                    type: "ALTA",
                    date: now.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                    description: user.email
                };
                logsRepository.insertLog(log);
                res.redirect("/users/login?message=Nuevo usuario registrado&messageType=alert-info");
            }).catch(() => {
                res.redirect("/users/signup?message=Se ha producido un error al registrar usuario&messageType=alert-danger");
            });
        });
    })

    async function validateUser(user, originalPassword, confirmPassword) {
        let errors = [];
        if (user.email == null || user.email == "") {
            errors.push("El email es obligatorio");
        }
        if (user.password == null || user.password == "") {
            errors.push("El password es obligatorio");
        }
        if (user.name == null || user.name == "") {
            errors.push("El nombre es obligatorio");
        }
        if (user.surname == null || user.surname == "") {
            errors.push("El apellido es obligatorio");
        }
        if (originalPassword != confirmPassword) {
            errors.push("Las contraseñas no coinciden");
        }
        //check that the email format is correct
        let emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!emailRegex.test(user.email)) {
            errors.push("El email no tiene un formato correcto");
        }
        let userFound = await usersRepository.findUser({email: user.email}, {});

        if (userFound != null) {
            errors.push("El email ya existe");
        }
        //check that the birthdate format is correct
        let birthdateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
        if (!birthdateRegex.test(user.birthdate)) {
            errors.push("La fecha de nacimiento no tiene un formato correcto. El formato debe ser DD-MM-YYYY");
        } else {
            //parse the birthdate string to a date object
            let birthdate = new Date(user.birthdate.split("-").reverse().join("-"));
            let today = new Date();
            //compare the birthdate to today
            if (birthdate > today) {
                errors.push("La fecha de nacimiento no puede ser posterior a hoy");
            }
        }

        return errors;
    }

    app.get('/users/logout', function (req, res) {
        let now = new Date();
        log = {
            type: "LOGOUT",
            date: now.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
            description: req.session.user
        };
        logsRepository.insertLog(log);
        req.session.user = null;
        res.redirect("/users/login?message=Usuario desconectado correctamente&messageType=alert-info");
    });
}