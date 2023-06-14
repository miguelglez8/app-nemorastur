const {ObjectId} = require("mongodb");
const {response} = require("express");
module.exports = function (app, usersRepository, offersRepository) {

    /**
     * Método que devuelve la lista de ofertas del usuario que está logeado
     */
    app.get('/offers/myoffers', function (req, res) {
        let filter = {owner: req.session.user}
        let options = {};
        let page = parseInt(req.query.page);
        if (typeof req.query.page === "undefined" || req.query.page === null || req.query.page === "0") {
            page = 1;
        }
        // buscamos las ofertas por paginación
        offersRepository.getOffersPg(filter, options, page).then(offers => {
            let lastPage = offers.total / 5;
            if (offers.total % 5 > 0) {
                lastPage = lastPage + 1;
            }
            let pages = [];
            for (let i = page - 2; i <= page + 2; i++) {
                if (i > 0 && i <= lastPage) {
                    pages.push(i);
                }
            }
            // sacamos las ids de las ofertas
            let result = [];
            for (let i = 0; i < offers.offers.length; i++) {
                result.push(offers.offers[i].offerId)
            }
            offersRepository.getOffersPg({}, options, {}).then(offers2 => {
                let lastPage = offers2.total / 5;
                if (offers2.total % 5 > 0) {
                    lastPage = lastPage + 1;
                }
                // sacamos las ids de las ofertas
                let result = [];
                for (let i = 0; i < offers2.offers.length; i++) {
                    result.push(offers2.offers[i].offerId)
                }
                usersRepository.findUser({email: req.session.user}, options).then(user => {
                    let response = {
                        offers: offers.offers,
                        pages: pages,
                        currentPage: page,
                        session: req.session,
                    }
                    res.render("offers/myoffers.twig", response);
                })
            })

        }).catch(error => {
            res.send("Se ha producido un error al listar las ofertas del usuario:" + error)
        });
    })

    /**
     * Método get para la vista del formulario de añadir oferta
     */
    app.get('/offers/add', function (req, res) {
        usersRepository.findUser({email: req.session.user}, {}).then(user => {
            let response = {
                session: req.session,
            }
            res.render("offers/add.twig", response);
        })
    });

    /**
     * Añade oferta nueva
     */
    app.post('/offers/add', function (req, res) {
        let highlight = false;
        usersRepository.findUser({username: req.session.user}).then(result => {
                    let offer = {
                        title: req.body.title,
                        date: new Date().toDateString(),
                        client: req.body.client,
                        place: req.body.place,
                        dateS: req.body.dateS,
                        dateF: req.body.dateF,
                        duration: 12,
                        employees: req.body.employees,
                        tasks: req.body.tasks,
                        material: req.body.material,
                        euros: req.body.euros,
                        observations: req.body.observations,
                    }
                    offersRepository.insertOffer(offer).then((offerId) => {
                        if (offerId == null) {
                            res.send("Error al insertar el parte");
                        } else {
                            checkFields(offer, function (checkFields) {
                                if (checkFields) {
                                    res.redirect("/offers/myoffers");
                                } else {
                                    res.send("Error al añadir el parte: Datos introducidos no válidos");
                                }
                            })
                        }
                    });
        });
    });

    /**
     * Elimina una oferta al pasarle un id
     * Debe comprobar que la oferta es del usuario que la quiere borrar y no ha sido comprada
     */
    app.get('/offers/delete/:id', function (req, res) {
        let filter = {_id: new ObjectId(req.params.id)};
        let user = req.session.user;
        canDelete(user, filter, function (canDelete) {
            if (canDelete) {
                offersRepository.deleteOffer(filter, {}).then(result => {
                    if (result === null || result.deletedCount === 0) {
                        res.send("No se ha podido eliminar el parte");
                    } else {
                        res.redirect("/offers/myoffers");
                    }
                }).catch(error => {
                    res.send("Se ha producido un error al intentar eliminar el parte: " + error)
                });
            } else {
                res.send("No se ha podido eliminar el parte")
            }
        })

    })

    /**
     * Busca las ofertas por título
     */
    app.get('/offers/searchOffers', function (req, res) {
        let filter = {};
        // establecemos el filtro
        if (req.query.search != null && typeof (req.query.search) != "undefined" && req.query.search != "") {
            filter = {"title": {$regex: new RegExp(".*" + req.query.search + ".*", "i")}}
        }
        // establecemos la página
        let page = parseInt(req.query.page); // Es String !!!
        if (typeof req.query.page === "undefined" || req.query.page === null || req.query.page === "0") { // Puede no venir el param
            page = 1;
        }
        // buscamos las oferta con paginación
        let pageSize = req.query.pageSize ? req.query.pageSize : 5;
        let max = parseInt(pageSize)
        offersRepository.getOffersPg(filter, {}, page, max).then(result => {
            // buscamos el usuario
            usersRepository.findUser({email: req.session.user}, {}).then(user => {
                let lastPage = result.total / max;
                if (result.total % max > 0) { // Sobran decimales
                    lastPage = lastPage + 1;
                }
                let pages = []; // paginas mostrar
                for (let i = page - 2; i <= page + 2; i++) {
                    if (i > 0 && i <= lastPage) {
                        pages.push(i);
                    }
                }

                let response = {
                    offers: result.offers,
                    pages: pages,
                    currentPage: page,
                    session: req.session,
                    money: user.money,
                    search: req.query.search,
                    pageSize: max
                }
                // volvemos a la vista de listar las ofertas
                res.render("offers/myoffers.twig", response);
            }).catch(error => {
                res.send("Se ha producido un error al encontrar el usuario en sesión: " + error)
            });
        }).catch(error => {
            res.send("Se ha producido un error al buscar las ofertas " + error)
        });
    });

    /**
     * Función que valida los campos título, detalle y precio
     */
    function checkFields(offer, functionCallback) {
        if (offer.title === 'undefined' || offer.title == null || offer.title.trim().length === 0) {
            functionCallback(false);
            return;
        }
        if (offer.detail === 'undefined' || offer.detail == null || offer.detail.trim().length === 0) {
            functionCallback(false);
            return;
        }

        if (offer.price === 'undefined' || offer.price == null || offer.price.trim().length === 0 || offer.price < 0) {
            functionCallback(false);
            return;
        }
        functionCallback(true);
    }

}