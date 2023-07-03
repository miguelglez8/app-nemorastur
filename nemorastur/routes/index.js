let express = require('express');
const axios = require("axios");
const geoip = require("geoip-lite");
let router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    const axios = require('axios');

    axios.get('https://find-ip.openjavascript.info').then((response) => {
        ipAddress = response.data.iso.traits.ipAddress;
        console.log(response.data.iso)
        console.log('Dirección IP pública:', ipAddress);
        const geo = geoip.lookup(ipAddress);

        if (geo) {
            console.log('Información de geolocalización:');
            console.log('IP:', geo.ip);
            console.log('País:', geo.country);
            console.log('Región:', geo.region);
            console.log('Ciudad:', geo.city);
            country = geo.country;
            region = geo.region;
            city = geo.city;
            console.log('Latitud:', geo.ll[0]);
            console.log('Longitud:', geo.ll[1]);
        } else {
            console.log('No se encontró información de geolocalización para la dirección IP proporcionada.');
        }
    })

    res.render('index', { title: 'Nemorastur' });
});

module.exports = router;
