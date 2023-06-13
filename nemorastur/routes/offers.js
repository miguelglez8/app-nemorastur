const {ObjectId} = require("mongodb");
const {response} = require("express");
module.exports = function (app, usersRepository, offersRepository, messagesRepository) {

    /**
     * Método que devuelve la lista de ofertas del usuario que está logeado
     */
    app.get('/offers/myoffers', function (req, res) {
        let filter = {seller: req.session.user}
        let options = {};
        let page = parseInt(req.query.page);
        let highPage = parseInt(req.query.highPage);
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
            offersRepository.getOffersPg({isHighlight: true}, options, highPage).then(offers2 => {
                let lastPage = offers2.total / 5;
                if (offers2.total % 5 > 0) {
                    lastPage = lastPage + 1;
                }
                let highPages = [];
                for (let i = page - 2; i <= page + 2; i++) {
                    if (i > 0 && i <= lastPage) {
                        highPages.push(i);
                    }
                }
                // sacamos las ids de las ofertas
                let result = [];
                for (let i = 0; i < offers2.offers.length; i++) {
                    result.push(offers2.offers[i].offerId)
                }
                usersRepository.findUser({email: req.session.user}, options).then(user => {
                    let response = {
                        offers: offers.offers,
                        highOffers: offers2.offers,
                        pages: pages,
                        highPages: highPages,
                        currentPage: page,
                        currentHighPage: highPage,
                        session: req.session,
                        money: user.money
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
                money: user.money
            }
            res.render("offers/add.twig", response);
        })
    });

    /**
     * Añade oferta nueva
     */
    app.post('/offers/add', function (req, res) {
        let highlight = false;
        usersRepository.findUser({email: req.session.user}).then(result => {
            let finalMoney = result.money;
            if (req.body.highlight === "on" && result.money > 20) {
                finalMoney = finalMoney - 20;
                highlight = true;
            }
            usersRepository.updateUser({email: req.session.user}, {$set: {money: finalMoney}})
                .then(result => {
                    let offer = {
                        title: req.body.title,
                        detail: req.body.detail,
                        date: new Date().toDateString(),
                        price: req.body.price,
                        seller: req.session.user,
                        isHighlight: highlight,
                        isBuy: false
                    }
                    offersRepository.insertOffer(offer).then((offerId) => {
                        if (offerId == null) {
                            res.send("Error al insertar la oferta");
                        } else {
                            checkFields(offer, function (checkFields) {
                                if (checkFields) {
                                    res.redirect("/offers/myoffers");
                                } else {
                                    res.send("Error al añadir la oferta: Datos introducidos no válidos");
                                }
                            })
                        }
                    });
                })
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
                        res.send("No se ha podido eliminar la oferta");
                    } else {
                        // eliminamos todas las conversaciones y mensajes asociados a la oferta
                        messagesRepository.deleteConversations({offer: req.params.id}, {}).then(result => {
                            if (result === null) {
                                res.send("No se ha podido eliminar la conversacion");
                            } else {
                                res.redirect("/offers/myoffers");
                            }
                        }).catch(error => {
                            res.send("Se ha producido un error al intentar borrar las coversaciones: " + error)
                        });
                    }
                }).catch(error => {
                    res.send("Se ha producido un error al intentar eliminar la oferta: " + error)
                });
            } else {
                res.send("No se ha podido eliminar la oferta")
            }
        })

    })

    /**
     * Función para destacar una oferta desde la vista de ofertas propias
     */
    app.get('/offers/highlight/:id/:page/:highPage?', function (req, res) {
        let filter = {_id: new ObjectId(req.params.id)};
        let user = req.session.user;
        let page = parseInt(req.params.page)
        let highPage = parseInt(req.params.highPage)
        canHighlight(user, filter, function (canHighlight, message) {
            if (canHighlight) {
                usersRepository.findUser({email: req.session.user}).then(result => {
                    let finalMoney = result.money - 20;
                    usersRepository.updateUser({email: req.session.user}, {$set: {money: finalMoney}})
                        .then(result => {
                            offersRepository.updateOffer(filter, {$set: {isHighlight: true}})
                                .then(offer => {
                                    res.redirect("/offers/myoffers?&page=" + page);
                                })
                        })
                })
            } else {
                let errors = {
                    errors: message
                }
                res.redirect("/offers/myoffers?errors=" + errors.errors + "&page=" + page + "&highPage=" + highPage);
            }
        })
    })

    /**
     * Obtiene las ofertas que han sido compradas
     */
    app.get('/offers/buy', function (req, res) {
        let filter = {user: req.session.user};
        let options = {};
        // establecemos la página
        let page = parseInt(req.query.page); // Es String !!!
        if (typeof req.query.page === "undefined" || req.query.page === null || req.query.page === "0") { // Puede no venir el param
            page = 1;
        }
        // buscamos las ofertas por paginación
        offersRepository.getBuysPg(filter, options, page).then(buys => {
            let lastPage = buys.total / 5;
            if (buys.total % 5 > 0) { // Sobran decimales
                lastPage = lastPage + 1;
            }
            let pages = []; // paginas mostrar
            for (let i = page - 2; i <= page + 2; i++) {
                if (i > 0 && i <= lastPage) {
                    pages.push(i);
                }
            }
            // sacamos las ids de las ofertas
            let offers = [];
            for (let i = 0; i < buys.buys.length; i++) {
                offers.push(buys.buys[i].offerId)
            }
            let filter = {"_id": {$in: offers}};
            // obtenemos las ofertas
            offersRepository.getOffers(filter, {}).then(offers => {
                // buscamos el usuario en sesión
                usersRepository.findUser({email: req.session.user}, options).then(user => {
                    let response = {
                        offers: offers,
                        pages: pages,
                        currentPage: page,
                        session: req.session,
                        money: user.money
                    }
                    // volvemos a la vista de ofertas compradas
                    res.render("offers/buy.twig", response);
                }).catch(error => {
                    res.send("Se ha producido un error al encontrar el usuario en sesión: " + error)
                });
            }).catch(error => {
                res.send("Se ha producido un error al listar las ofertas del usuario: " + error)
            });
        }).catch(error => {
            res.send("Se ha producido un error al listar las compras del usuario:" + error)
        });
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
                res.render("offers/list.twig", response);
            }).catch(error => {
                res.send("Se ha producido un error al encontrar el usuario en sesión: " + error)
            });
        }).catch(error => {
            res.send("Se ha producido un error al buscar las ofertas " + error)
        });
    });

    /**
     * Compra la oferta a través de la id
     */
    app.get('/offers/buy/:id/:page/:search?', async function (req, res) {
        let id = new ObjectId(req.params.id);
        let user = req.session.user;
        let sesion = req.session
        let filter = {_id: id};
        let page = parseInt(req.params.page)
        let shop = {
            user: req.session.user,
            offerId: id
        }
        // si no hay búsqueda, se compra directamente
        let search = req.params.search ? req.params.search : "";
        let options = {};
        // filtramos oferta por título
        offersRepository.getOffers(filter, options).then(async offer => {
            if (offer == null) {
                res.send("No hay ninguna oferta");
            } else {
                // comprueba si podemos comprar la oferta
                let canBuyResult = await compruebaBuy(offer, user);
                if (canBuyResult.errors.length != 0) {
                    res.redirect("/offers/searchOffers?errors=" + canBuyResult.errors + "&page=" + page)
                } else {
                    offersRepository.buyOffer(shop).then(offerId => {
                        const rest = canBuyResult.price;
                        // actualizamos la oferta (el campo isBuy a true)
                        offersRepository.updateOffer({_id: new ObjectId(req.params.id)}, {$set: {isBuy: true}}).then(offer => {
                            if (offer == null) {
                                res.send("Error al actualizar la oferta");
                            } else {
                                // actualizamos el saldo del usuario
                                usersRepository.updateUser({email: req.session.user}, {$set: {money: rest}}).then(user => {
                                    if (user == null) {
                                        res.send("Error al actualizar el usuario");
                                    } else {
                                        // volvemos a la vista de listar todas las ofertas
                                        res.redirect("/offers/searchOffers?money=" + canBuyResult.price + "&page=" + page + "&search=" + search)
                                    }
                                }).catch(error => {
                                    res.send("Se ha producido un error al actualizar el usuario en sesión: " + error)
                                });
                            }
                        }).catch(error => {
                            res.send("Se ha producido un error al actualizar la oferta: " + error)
                        });
                    }).catch(error => {
                        res.send("Se ha producido un error al comprar: " + error)
                    });
                }
            }
        }).catch(err => {
            res.send("Error al obtener la lista de ofertas " + err)
        });
    });

    /**
     * Devuelve los errores al validar la compra (si los hay) y el saldo restante del usuario
     */
    async function compruebaBuy(offer, user) {
        let errors = new Array();
        let oferta = offer[0];
        if (user == oferta.seller)
            // error: no puedes comprar tu oferta
            errors.push("[Titulo=" + oferta.title + "]" + " ERROR: la oferta ha sido creada por el usuario")
        let filter = {
            email: user
        }
        let userResponse = await usersRepository.findUser(filter, {})
        if (userResponse == null) {
            return {errors: ["Ha ocurrido un error al obtener el usuario"]}
        }
        if (userResponse.money < oferta.price)
            // error: no tienes suficiente dinero
            errors.push("[Titulo=" + oferta.title + "]" + " ERROR: no tienes suficiente saldo para comprar la oferta")
        let offersResponse = await offersRepository.getBuys({$and: [{user: user}, {offerId: oferta._id}]}, {});
        if (offersResponse == null) {
            return {errors: ["Ha ocurrido un error al obtener las ofertas"]}
        }
        // error: la oferta ya está comprada
        if (offersResponse.length > 0) errors.push("[Titulo=" + oferta.title + "]" + " ERROR: la oferta ya ha sido comprada por un usuario")
        let price = userResponse.money - oferta.price;
        // devolvemos los errores que haya y el precio que le queda al usuario
        return {errors, price}
    }

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

    /**
     * Comprueba si se cumplen las condiciones para poder borrar una oferta
     */
    function canDelete(user, offer, functionCallback){
        offersRepository.findOffer(offer,{}).then( offer2 => {
            if(offer2 && (offer2.seller !== user || offer2.isBuy)){
                functionCallback(false);
            } else {
                functionCallback(true);
            }
        })
    }

    function canHighlight(user, offer, functionCallback) {
        usersRepository.findUser({email: user}, {}).then(user2 => {
            if (user2.money >= 20) {
                offersRepository.findOffer(offer, {}).then(offer2 => {
                    if (user == offer2.seller) {
                        if (offer2.isHighlight == false || offer2.isHighlight == undefined) {
                            functionCallback(true, "");
                        } else {
                            functionCallback(false, "La oferta ya está destacada");
                        }
                    } else {
                        functionCallback(false, "No eres el propietario de esta oferta");
                    }
                })
            } else {
                functionCallback(false, "No tienes suficiente dinero para destacar una oferta");
            }
        })
    }
}