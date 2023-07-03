const {ObjectId} = require("mongodb");
module.exports = function (app, usersRepository, offersRepository) {

    /**
     * Funcionalidad GET de login
     */
    app.get('/users/login', function (req, res) {
        res.render("login.twig");
    });

    /**
     * Listado de admin
     */
    app.get("/users/list", function (req, res) {
        let filter = {};
        let options = {sort: {username: 1}};

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
                usersRepository.findUser({username: req.session.user}, options).then(user => {
                    let response = {
                        users: result.users,
                        pages: pages,
                        currentPage: page,
                        session: req.session,
                        search: req.query.search,
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
     * Funcionalidad borrado de usuarios
     */
    app.get('/users/deletee/:page', function (req, res) {
        var list = [];
        let page = parseInt(req.params.page);
        if (typeof req.params.page === "undefined" || req.params.page === null || req.params.page === "0") {
            page = 1;
        }
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

        res.redirect("/users/list?page="+page);
    });

    /**
     * Funcion que borra un usuario
     */
    function deleteUser(userId, res) {
        usersRepository.findUser({_id: new ObjectId(userId)}, {}).then(a => {
            offersRepository.deleteOffer({employee: a.username}, {}).then(r => {
                usersRepository.deleteUser({_id: new ObjectId(userId)}, {}).then(result => {
                    if (result == null || result.deletedCount == 0) {
                        res.write("No se ha podido eliminar el registro");
                    } else {
                        res.end();
                    }
                })
            })
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
            username: req.body.username,
            password: securePassword
        }
        let options = {}
        usersRepository.findUser(filter, options).then(user => {
            if (user == null) {
                req.session.user = null;
                res.redirect("/users/login" +
                    "?message=nombre de usuario o contraseña incorrecto" +
                    "&messageType=alert-danger ");
            } else {
                req.session.user = user.username;
                if (user.username=="admin")
                    res.redirect("/users/list")
                else
                    res.redirect("/users/myoffers")
            }
        }).catch(() => {
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
        let securePassword = app.get("crypto").createHmac('sha256', app.get('clave'))
            .update(req.body.password).digest('hex');
        let user = {
            username: req.body.username,
            password: securePassword,
            name: req.body.name,
            surname: req.body.surname,
            partes: 0,
            rol: "STANDARD",
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
                res.redirect("/users/login?message=Nuevo usuario registrado&messageType=alert-info");
            }).catch(() => {
                res.redirect("/users/signup?message=Se ha producido un error al registrar usuario&messageType=alert-danger");
            });
        });
    })

    async function validateUser(user, originalPassword, confirmPassword) {
        let errors = [];
        if (user.username == null || user.username == "") {
            errors.push("El nombre de usuario es obligatorio");
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

        let userFound = await usersRepository.findUser({username: user.username}, {});

        if (userFound != null) {
            errors.push("El nombre de usuario ya existe, por favor introduce uno nuevo");
        }

        return errors;
    }

    app.get('/users/logout', function (req, res) {
        req.session.user = null;
        res.redirect("/users/login?message=Usuario desconectado correctamente&messageType=alert-info");
    });
}