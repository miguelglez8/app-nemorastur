const express = require('express');
const usersRepository = require("../repositories/usersRepository");
const userAdminRouter = express.Router();

userAdminRouter.use(function (req, res, next) {
    if (req.session.user) {
        if (req.session.user) {
            usersRepository.findUser({email: req.session.user}, {}).then(result => {
                if (result.rol == "ADMIN") {
                    next();
                } else {
                    error = {
                        status: "401",
                        stack: "No tienes permiso para acceder a esta parte de la aplicación."
                    }
                    menssage = {
                        message: "Sin autorización",
                        error: error
                    }
                    res.render("error.twig", menssage);
                }
            }).catch(error => res.redirect("/users/login"));

        } else {
            res.redirect("/users/login");
        }

    } else {
        res.redirect("/users/login");
    }
});
module.exports = userAdminRouter;