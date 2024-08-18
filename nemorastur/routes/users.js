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
                deleteUser(listElement, res, page);
            }
        }
    });

    /**
     * Funcion que borra un usuario
     */
    async function deleteUser(userId, res, page) {
        let userFound = await usersRepository.findUser({_id: new ObjectId(userId)}, {});

        usersRepository.deleteUser({_id: new ObjectId(userId)}, {}).then(async result => {
            await offersRepository.deleteOffer({employee: userFound.username}, {})
            res.redirect("/users/list?page=" + page);
            res.end();
        })

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
            vehicles: 0,
            machines: 0,
            rol: "STANDARD",
        };

        let errors = await validateUser(user, req.body.password, req.body.passwordConfirm);

        if (errors.length > 0) {
            let queryParams = errors.map(error => `message=${encodeURIComponent(error)}&messageType=alert-danger`).join('&');
            res.redirect(`/users/signup?${queryParams}&username=${encodeURIComponent(user.username)}&name=${encodeURIComponent(user.name)}&surname=${encodeURIComponent(user.surname)}`);
            return;
        }

        try {
            await usersRepository.insertUser(user);
            res.redirect("/users/login?message=Nuevo usuario registrado&messageType=alert-info");
        } catch (error) {
            res.redirect("/users/signup?message=Se ha producido un error al registrar usuario&messageType=alert-danger");
        }
    });


    async function validateUser(user, originalPassword, confirmPassword) {
        let errors = [];

        // Validaciones básicas de campos
        if (!user.username || user.username.trim() === "") {
            errors.push("El nombre de usuario es obligatorio");
        }
        if (!user.password || user.password.trim() === "") {
            errors.push("El password es obligatorio");
        }
        if (!user.name || user.name.trim() === "") {
            errors.push("El nombre es obligatorio");
        }
        if (!user.surname || user.surname.trim() === "") {
            errors.push("El apellido es obligatorio");
        }
        if (originalPassword !== confirmPassword) {
            errors.push("Las contraseñas no coinciden");
        }

        // Validaciones de la contraseña
        if (!isPasswordComplex(originalPassword)) {
            errors.push("La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula, un número y un carácter especial");
        }

        // Verificación de existencia del nombre de usuario
        let userFound = await usersRepository.findUser({username: user.username}, {});

        if (userFound) {
            errors.push("El nombre de usuario ya existe, por favor introduce uno nuevo");
        }

        return errors;
    }

    function isPasswordComplex(password) {
        const minLength = 8;
        const uppercase = /[A-Z]/;
        const lowercase = /[a-z]/;
        const number = /[0-9]/;
        const specialChar = /[!@#$%^&*(),.?":{}|<>]/;

        if (password.length < minLength) {
            return false;
        }
        if (!uppercase.test(password)) {
            return false;
        }
        if (!lowercase.test(password)) {
            return false;
        }
        if (!number.test(password)) {
            return false;
        }
        if (!specialChar.test(password)) {
            return false;
        }

        return true;
    }

    app.get('/users/logout', function (req, res) {
        req.session.user = null;
        res.redirect("/users/login?message=Usuario desconectado correctamente&messageType=alert-info");
    });
}