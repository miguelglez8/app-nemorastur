const {getConnection, closeConnection} = require("./db");
module.exports = {
    mongoClient: null,
    app: null,
    init: function (app, mongoClient) {
        this.mongoClient = mongoClient;
        this.app = app;
    },
    /**
     * Obtiene las ofertas
     */
    getOffers: async function (filter, options) {
        let client;
        try {
            client = await this.mongoClient.connect(this.app.get('connectionStrings'));
            const database = client.db("entrega2");
            const collectionName = 'offers';
            const offersCollection = database.collection(collectionName);
            const offers = await offersCollection.find(filter, options).toArray();
            return offers;
        } catch (error) {
            throw (error);
        } finally {
            client.close();
        }
    },
    /**
     * Obtiene una oferta dada una id
     */
    findOffer: async function (filter, options) {
        let client;
        try {
            client = await this.mongoClient.connect(this.app.get('connectionStrings'));
            const database = client.db("entrega2");
            const collectionName = 'offers';
            const songsCollection = database.collection(collectionName);
            const offer = await songsCollection.findOne(filter, options);
            return offer;
        } catch (error) {
            throw (error);
        } finally {
            client.close();
        }
    },
    /**
     * Obtiene las ofertas con paginación
     */
    getOffersPg: async function (filter, options, page, pageSize=5) {
        let client;
        try {
            const limit = pageSize;
            client = await this.mongoClient.connect(this.app.get('connectionStrings'));
            const database = client.db("entrega2");
            const collectionName = 'offers';
            const offersCollection = database.collection(collectionName);
            const offersCollectionCount = await offersCollection.countDocuments(filter);
            const cursor = offersCollection.find(filter, options).skip((page - 1) * limit).limit(limit)
            const offers = await cursor.toArray();
            const result = {offers: offers, total: offersCollectionCount};
            return result;
        } catch (error) {
            throw (error);
        } finally {
            client.close();
        }
    },
    /**
     * Obtiene las ofertas con paginación
     */
    getMachinesPg: async function (filter, options, page, pageSize=5) {
        let client;
        try {
            const limit = pageSize;
            client = await this.mongoClient.connect(this.app.get('connectionStrings'));
            const database = client.db("entrega2");
            const collectionName = 'machines';
            const offersCollection = database.collection(collectionName);
            const offersCollectionCount = await offersCollection.countDocuments(filter);
            const cursor = offersCollection.find(filter, options).skip((page - 1) * limit).limit(limit)
            const offers = await cursor.toArray();
            const result = {offers: offers, total: offersCollectionCount};
            return result;
        } catch (error) {
            throw (error);
        } finally {
            client.close();
        }
    },
    /**
     * Obtiene las ofertas con paginación
     */
    getVehiclesPg: async function (filter, options, page, pageSize=5) {
        let client;
        try {
            const limit = pageSize;
            client = await this.mongoClient.connect(this.app.get('connectionStrings'));
            const database = client.db("entrega2");
            const collectionName = 'vehicles';
            const offersCollection = database.collection(collectionName);
            const offersCollectionCount = await offersCollection.countDocuments(filter);
            const cursor = offersCollection.find(filter, options).skip((page - 1) * limit).limit(limit)
            const offers = await cursor.toArray();
            const result = {offers: offers, total: offersCollectionCount};
            return result;
        } catch (error) {
            throw (error);
        } finally {
            client.close();
        }
    },
    insertOffer: async function (offer) {
        try {
            const client = await getConnection(this.mongoClient, this.app.get('connectionStrings'))
            const database = client.db("entrega2");
            const collectionName = 'offers';
            const offers = database.collection(collectionName);
            const result = await offers.insertOne(offer);
            return result.insertedId;
        } catch (error) {
            throw (error);
        } finally {
            closeConnection();
        }
    },
    insertMachine: async function (offer) {
        try {
            const client = await getConnection(this.mongoClient, this.app.get('connectionStrings'))
            const database = client.db("entrega2");
            const collectionName = 'machines';
            const offers = database.collection(collectionName);
            const result = await offers.insertOne(offer);
            return result.insertedId;
        } catch (error) {
            throw (error);
        } finally {
            closeConnection();
        }
    },
    insertVehicle: async function (offer) {
        try {
            const client = await getConnection(this.mongoClient, this.app.get('connectionStrings'))
            const database = client.db("entrega2");
            const collectionName = 'vehicles';
            const offers = database.collection(collectionName);
            const result = await offers.insertOne(offer);
            return result.insertedId;
        } catch (error) {
            throw (error);
        } finally {
            closeConnection();
        }
    },
    /**
     * Actualiza la oferta
     */
    updateOffer: async function (filter, options) {
        try {
            const client = await getConnection(this.mongoClient,this.app.get('connectionStrings'))
            const database = client.db("entrega2");
            const collectionName = 'offers';
            const offersCollection = database.collection(collectionName);
            return await offersCollection.updateOne(filter, options);
        } catch (error) {
            throw (error);
        } finally {
            closeConnection();
        }
    },
    /**
     *
     */
    deleteOffer: async function (filter, options) {
        let client;
        try {
            client = await this.mongoClient.connect(this.app.get('connectionStrings'));
            const database = client.db("entrega2");
            const collectionName = 'offers';
            const songsCollection = database.collection(collectionName);
            const result = await songsCollection.deleteMany(filter, options);
            return result;
        } catch (error) {
            throw (error);
        } finally {
            client.close();
        }
    },
    deleteVehicle: async function (filter, options) {
        let client;
        try {
            client = await this.mongoClient.connect(this.app.get('connectionStrings'));
            const database = client.db("entrega2");
            const collectionName = 'vehicles';
            const songsCollection = database.collection(collectionName);
            const result = await songsCollection.deleteMany(filter, options);
            return result;
        } catch (error) {
            throw (error);
        } finally {
            client.close();
        }
    },
    deleteMachine: async function (filter, options) {
        let client;
        try {
            client = await this.mongoClient.connect(this.app.get('connectionStrings'));
            const database = client.db("entrega2");
            const collectionName = 'machines';
            const songsCollection = database.collection(collectionName);
            const result = await songsCollection.deleteMany(filter, options);
            return result;
        } catch (error) {
            throw (error);
        } finally {
            client.close();
        }
    }
};
