const express = require('express');
const logsRepository = require("../repositories/logRepository");
const logRouter = express.Router();

logRouter.use(function(req, res, next) {
    let now = new Date();
    log = {
        type: "PET",
        date: now.toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        description: req.originalUrl
    };
    logsRepository.insertLog(log);
    next();
});
module.exports = logRouter;