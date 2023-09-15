const {ObjectId} = require("mongodb");
const {response} = require("express");
const moment = require("moment");
const geoip = require("geoip-lite");
const axios = require('axios');

module.exports = function (app, usersRepository, offersRepository) {

    /**
     * Método que devuelve la lista de ofertas del usuario que está logeado
     */
    app.get('/users/myoffers', function (req, res) {
        let filter;
        if (req.session.user=="admin") {
            if (typeof req.query.user === "undefined" && req.query.user === null) {
                filter = {employee: ""}
            } else {
                filter = {employee: req.query.user}
            }
        } else {
            filter = {employee: req.session.user}
        }

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
            let response = {
                offers: offers.offers,
                pages: pages,
                currentPage: page,
                session: req.session,
            }
            res.render("offers/myoffers.twig", response);
        }).catch(error => {
            res.send("Se ha producido un error al listar los partes del usuario:" + error)
        });
    });

    /**
     * Método que devuelve la lista de maquinaria del usuario que está logeado
     */
    app.get('/users/mymachines', function (req, res) {
        let filter;
        if (req.session.user=="admin") {
            filter = {}
        } else {
            filter = {trabajador: req.session.user}
        }
        let options = {};
        let page = parseInt(req.query.page);
        if (typeof req.query.page === "undefined" || req.query.page === null || req.query.page === "0") {
            page = 1;
        }
        // buscamos las ofertas por paginación
        offersRepository.getMachinesPg(filter, options, page).then(offers => {
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
            let response = {
                offers: offers.offers,
                pages: pages,
                currentPage: page,
                session: req.session,
            }
            res.render("machines/mymachines.twig", response);
        }).catch(error => {
            res.send("Se ha producido un error al listar los controles de maquinaria del usuario:" + error)
        });
    });

    /**
     * Método que devuelve la lista de vehículos del usuario que está logeado
     */
    app.get('/users/myvehicles', function (req, res) {
        let filter;
        if (req.session.user=="admin") {
            filter = {}
        } else {
            filter = {trabajador: req.session.user}
        }
        let options = {};
        let page = parseInt(req.query.page);
        if (typeof req.query.page === "undefined" || req.query.page === null || req.query.page === "0") {
            page = 1;
        }
        // buscamos las ofertas por paginación
        offersRepository.getVehiclesPg(filter, options, page).then(offers => {
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
            let response = {
                offers: offers.offers,
                pages: pages,
                currentPage: page,
                session: req.session,
            }
            res.render("vehicles/myvehicles.twig", response);
        }).catch(error => {
            res.send("Se ha producido un error al listar los controles de maquinaria del usuario:" + error)
        });
    });

    /**
     * Método get para la vista del formulario de añadir oferta
     */
    app.get('/users/add', function (req, res) {
        usersRepository.findUser({username: req.session.user}, {}).then(user => {
            let response = {
                session: req.session,
            }
            res.render("offers/add.twig", response);
        })
    });

    /**
     * Método get para la vista del formulario de añadir vehiculo
     */
    app.get('/users/addvehicle', function (req, res) {
        usersRepository.findUser({username: req.session.user}, {}).then(user => {
            let response = {
                session: req.session,
            }
            res.render("vehicles/add.twig", response);
        })
    });

    /**
     * Método get para la vista del formulario de añadir maquinaria
     */
    app.get('/users/addmachine', function (req, res) {
        usersRepository.findUser({username: req.session.user}, {}).then(user => {
            let response = {
                session: req.session,
            }
            res.render("machines/add.twig", response);
        })
    });

    /**
     * Añade oferta nueva
     */
    app.post('/users/add', async function (req, res) {
        const fecha1 = moment(req.body.dateS, 'HH:mm');
        const fecha2 = moment(req.body.dateF, 'HH:mm');
        const diferencia = moment.duration(fecha2.diff(fecha1));
        const distanciaHoras = diferencia.asHours().toFixed(2);
        let tareas = ["Segar el césped y desorillar", "Limpieza y barrido de viales", "Mantenimiento de terrarios",
            "Poda de árboles y arbustos"]
        let rees = []
        let e1 = req.body.task1
        let e2 = req.body.task2
        let e3 = req.body.task3
        let e4 = req.body.task4

        if (e1 != undefined) {
            rees.push(tareas[0])
        }
        if (e2 != undefined) {
            rees.push(tareas[1])
        }
        if (e3 != undefined) {
            rees.push(tareas[2])
        }
        if (e4 != undefined) {
            rees.push(tareas[3])
        }
        usersRepository.updateUser({username: req.session.user}, {$inc: {partes: 1}}).then(async result => {
            let offer = {
                title: req.body.title,
                date: req.body.date,
                client: req.body.client,
                place: req.body.lug,
                dateS: req.body.dateS,
                dateF: req.body.dateF,
                duration: distanciaHoras,
                type: req.body.highlight,
                employee: req.session.user,
                tasks: rees,
                material: req.body.material,
                euros: req.body.cash,
                observations: req.body.observations,
                state: "PENDIENTE DE FACTURAR"
            }
            await validateOffer(offer).then(result => {
                if (result.length > 0) {
                    let url = ""
                    for (error in result) {
                        url += "&message=" + result[error] + "&messageType=alert-danger "
                    }
                    res.redirect("/users/add?" + url);
                    return
                }
                offersRepository.insertOffer(offer).then(() => {
                    if (req.session.user == "admin") {
                        res.redirect("/users/searchOffers?message=Nuevo parte registrado&messageType=alert-info");
                    } else {
                        res.redirect("/users/myoffers?message=Nuevo parte registrado&messageType=alert-info");
                    }
                }).catch(() => {
                    res.redirect("/users/myoffers?message=Se ha producido un error al registrar un nuevo parte&messageType=alert-danger");
                });
            });
        });
    });

    /**
     * Añade vehiculo nuevo
     */
    app.post('/users/addvehicle', async function (req, res) {
        usersRepository.updateUser({username: req.session.user}, {$inc: {vehicles: 1}}).then(async result => {
            let offer = {
                matricula: req.body.matricula,
                marca: req.body.marca,
                modelo: req.body.modelo,
                kms: req.body.kms,
                itv: req.body.itv,
                agua: req.body.agua,
                aceite: req.body.aceite,
                frenos: req.body.frenos,
                neumaticos: req.body.neumaticos,
                comentarios: req.body.comentarios,
                fecha: req.body.fecha,
                trabajador: req.session.user
            }
            await validateVehicle(offer).then(result => {
                if (result.length > 0) {
                    let url = ""
                    for (error in result) {
                        url += "&message=" + result[error] + "&messageType=alert-danger "
                    }
                    res.redirect("/users/addvehicle?" + url);
                    return
                }
                offersRepository.insertVehicle(offer).then(() => {
                    res.redirect("/users/myvehicles?message=Nuevo vehiculo registrado&messageType=alert-info");
                }).catch(() => {
                    res.redirect("/users/myvehicles?message=Se ha producido un error al registrar un nuevo vehiculo&messageType=alert-danger");
                });
            });
        });
    });

    /**
     * Añade maquina nueva
     */
    app.post('/users/addmachine', async function (req, res) {
        console.log(req.body.agua)
        console.log(req.body.aceite)
        console.log(req.body.frenos)
        console.log(req.body.neumaticos)

        usersRepository.updateUser({username: req.session.user}, {$inc: {machines: 1}}).then(async result => {
            let offer = {
                marca: req.body.marca,
                tipo: req.body.tipo,
                modelo: req.body.modelo,
                agua: req.body.agua,
                aceite: req.body.aceite,
                frenos: req.body.frenos,
                neumaticos: req.body.neumaticos,
                comentarios: req.body.comentarios,
                fecha: req.body.fecha,
                trabajador: req.session.user
            }
            await validateMachine(offer).then(result => {
                if (result.length > 0) {
                    let url = ""
                    for (error in result) {
                        url += "&message=" + result[error] + "&messageType=alert-danger "
                    }
                    res.redirect("/users/addmachine?" + url);
                    return
                }
                offersRepository.insertMachine(offer).then(() => {
                    res.redirect("/users/mymachines?message=Nuevo máquina registrada&messageType=alert-info");
                }).catch(() => {
                    res.redirect("/users/mymachines?message=Se ha producido un error al registrar una nueva máquina&messageType=alert-danger");
                });
            });
        });
    });

    /**
     * Elimina un parte al pasarle un id
     */
    app.get('/users/elimina/:id/:page', async function (req, res) {
        let filter = {_id: new ObjectId(req.params.id)};
        let page = parseInt(req.params.page);
        if (typeof req.params.page === "undefined" || req.params.page === null || req.params.page === "0") {
            page = 1;
        }
        let userr = await offersRepository.findOffer(filter, {})
        offersRepository.deleteOffer(filter, {}).then(result => {
            if (result === null || result.deletedCount === 0) {
                res.send("No se ha podido eliminar el parte");
            } else {
                if (req.session.user == "admin") {
                    usersRepository.updateUser({username: userr.employee}, {$inc: {partes: -1}}).then(result => {
                        res.redirect("/users/searchOffers?page=" + page)
                    }).catch(error => {
                        res.send("Se ha producido un error al intentar decrementar los partes: " + error)
                    })
                } else {
                    usersRepository.updateUser({username: req.session.user}, {$inc: {partes: -1}}).then(result => {
                        res.redirect("/users/myoffers?page=" + page)
                    }).catch(error => {
                        res.send("Se ha producido un error al intentar decrementar los partes: " + error)
                    })
                }
            }
        }).catch(error => {
            res.send("Se ha producido un error al intentar eliminar el parte: " + error)
        });
    })

    /**
     * Elimina un vehículo al pasarle un id
     */
    app.get('/users/eliminavehicle/:id/:page', async function (req, res) {
        let filter = {_id: new ObjectId(req.params.id)};
        let page = parseInt(req.params.page);
        if (typeof req.params.page === "undefined" || req.params.page === null || req.params.page === "0") {
            page = 1;
        }
        offersRepository.deleteVehicle(filter, {}).then(result => {
            if (result === null || result.deletedCount === 0) {
                res.send("No se ha podido eliminar el parte");
            } else {
                    usersRepository.updateUser({username: req.session.user}, {$inc: {vehicles: -1}}).then(result => {
                        res.redirect("/users/myvehicles?page=" + page)
                    }).catch(error => {
                        res.send("Se ha producido un error al intentar decrementar los vehiculos: " + error)
                    })

            }
        }).catch(error => {
            res.send("Se ha producido un error al intentar eliminar el vehiculo: " + error)
        });
    })

    /**
     * Elimina una máquina al pasarle un id
     */
    app.get('/users/eliminamachine/:id/:page', async function (req, res) {
        let filter = {_id: new ObjectId(req.params.id)};
        let page = parseInt(req.params.page);
        if (typeof req.params.page === "undefined" || req.params.page === null || req.params.page === "0") {
            page = 1;
        }
        offersRepository.deleteMachine(filter, {}).then(result => {
            if (result === null || result.deletedCount === 0) {
                res.send("No se ha podido eliminar el parte");
            } else {
                usersRepository.updateUser({username: req.session.user}, {$inc: {machines: -1}}).then(result => {
                    res.redirect("/users/mymachines?page=" + page)
                }).catch(error => {
                    res.send("Se ha producido un error al intentar decrementar la maquinaria: " + error)
                })

            }
        }).catch(error => {
            res.send("Se ha producido un error al intentar eliminar la maquinaria: " + error)
        });
    })

    /**
     * Facturar una oferta al pasarle un id
     */
    app.get('/users/facturar/:id/:page', async function (req, res) {
        let filter = {_id: new ObjectId(req.params.id)};
        let page = parseInt(req.params.page);
        if (typeof req.params.page === "undefined" || req.params.page === null || req.params.page === "0") {
            page = 1;
        }
        offersRepository.updateOffer(filter, {$set: {state: "FACTURADO"}}).then(result => {
            res.redirect("/users/searchOffers?page=" + page)
        }).catch(error => {
            res.send("Se ha producido un error al facturar el parte: " + error)
        })
    })

    /**
     * Mover a pendiente una oferta al pasarle un id
     */
    app.get('/users/mover/:id/:page', async function (req, res) {
        let filter = {_id: new ObjectId(req.params.id)};
        let page = parseInt(req.params.page);
        if (typeof req.params.page === "undefined" || req.params.page === null || req.params.page === "0") {
            page = 1;
        }
        offersRepository.updateOffer(filter, {$set: {state: "PENDIENTE DE FACTURAR"}}).then(result => {
            res.redirect("/users/searchOffers?page=" + page)
        }).catch(error => {
            res.send("Se ha producido un error al facturar el parte: " + error)
        })
    })

    /**
     * Busca las ofertas por nombre del cliente
     */
    app.get('/users/searchOffers', function (req, res) {
        let filter = {};
        // establecemos el filtro
        if (req.query.search != null && typeof (req.query.search) != "undefined" && req.query.search != "") {
            filter = {"client": {$regex: new RegExp(".*" + req.query.search + ".*", "i")}}
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
            usersRepository.findUser({username: req.session.user}, {}).then(user => {
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
                    search: req.query.search,
                    pageSize: max
                }
                // volvemos a la vista de listar las ofertas
                res.render("offers/myoffers.twig", response);
            }).catch(error => {
                res.send("Se ha producido un error al encontrar el usuario en sesión: " + error)
            });
        }).catch(error => {
            res.send("Se ha producido un error al buscar los partes " + error)
        });
    });

    /**
     * Función que valida los campos título, detalle y precio
     */
    async function validateOffer(offer) {
        let errors = [];
        if (offer.title == null || offer.title == "") {
            errors.push("El título es obligatorio");
        }
        if (offer.date == null || offer.date == "") {
            errors.push("La fecha es obligatoria");
        }
        if (offer.client == null || offer.client == "") {
            errors.push("El cliente es obligatorio");
        }
        if (offer.dateS == null || offer.dateS == "") {
            errors.push("La fecha de comienzo es obligatoria");
        }
        if (offer.dateF == null || offer.dateF == "") {
            errors.push("La fecha de final es obligatoria");
        }
        if (offer.type == null || offer.type == "") {
            errors.push("Seleccione por favor, obra nueva o mantenimiento");
        }
        if (offer.material == null || offer.material == "") {
            errors.push("El material es obligatorio");
        }

        // Obtener las horas a comparar (en formato de 24 horas)
        var hora1 = offer.dateS;
        var hora2 = offer.dateF;

        // Crear objetos Date con la fecha de hoy y las horas a comparar
        var fechaHoy = new Date();
        var fechaHora1 = new Date(fechaHoy.toDateString() + ' ' + hora1);
        var fechaHora2 = new Date(fechaHoy.toDateString() + ' ' + hora2);

        // Comparar si la fecha/hora 1 es posterior a la fecha/hora 2
        if (fechaHora1 > fechaHora2) {
            errors.push("La hora de comienzo no puede ser posterior a la de final");
        }

        return errors;
    }

    /**
     * Función que valida los campos del vehiculo
     */
    async function validateVehicle(offer) {
        let errors = [];
        if (offer.matricula == null || offer.matricula == "") {
            errors.push("La matrícula es obligatorio");
        }
        if (offer.marca == null || offer.marca == "") {
            errors.push("La marca es obligatorio");
        }
        if (offer.modelo == null || offer.modelo == "") {
            errors.push("El modelo es obligatorio");
        }
        if (offer.kms == null || offer.kms == "") {
            errors.push("Los kms es obligatoria");
        }
        if (offer.itv == null || offer.itv == "") {
            errors.push("La itv es obligatoria");
        }
        if (offer.comentarios == null || offer.comentarios == "") {
            errors.push("Los comentarios es obligatoria");
        }
        if (offer.fecha == null || offer.fecha == "") {
            errors.push("La fecha es obligatoria");
        }

        return errors;
    }

    /**
     * Función que valida los campos de la máquina
     */
    async function validateMachine(offer) {
        let errors = [];
        if (offer.marca == null || offer.marca == "") {
            errors.push("La marca es obligatorio");
        }
        if (offer.tipo == null || offer.tipo == "") {
            errors.push("El tipo es obligatorio");
        }
        if (offer.modelo == null || offer.modelo == "") {
            errors.push("El modelo es obligatorio");
        }
        if (offer.comentarios == null || offer.comentarios == "") {
            errors.push("Los comentarios es obligatoria");
        }
        if (offer.fecha == null || offer.fecha == "") {
            errors.push("La fecha es obligatoria");
        }

        return errors;
    }

}