const {getConnection} = require("./db");
module.exports = {
    mongoClient: null,
    app: null,

    init: function (app, mongoClient) {
        this.mongoClient = mongoClient;
        this.app = app;
    },

    /**
     * @param filter
     * @param options
     * @returns {Promise<*>}
     */
    getLogss: async function (filter, options) {
        try {
            const client =await getConnection(this.mongoClient,this.app.get('connectionStrings'))
            const database = client.db("entrega2");
            const collectionName = 'logs';
            const logsCollection = database.collection(collectionName);
            return await logsCollection.find(filter, options).toArray();
        } catch (error) {
            throw (error);
        }
    },

    /**
     * @param filter
     * @param options
     * @param page
     * @returns {Promise<{total: *, logss: *}>}
     */
    getLogsPg: async function (filter, options, page){
        try {
            const limit = 10;
            const client = await getConnection(this.mongoClient,this.app.get('connectionStrings'))
            const database = client.db("entrega2");
            const collectionName = 'logs';
            const logsCollection = database.collection(collectionName);
            const logsCollectionCount = await logsCollection.find(filter, options).count();
            const cursor = logsCollection.find(filter, options).skip((page - 1) * limit).limit(limit)
            const logs = await cursor.toArray();
            return {logs: logs, total: logsCollectionCount };
        } catch (error) {
            throw (error);
        }
    },

    getLogs: async function (filter, options){
        try {
            const client = await getConnection(this.mongoClient,this.app.get('connectionStrings'))
            const database = client.db("entrega2");
            const collectionName = 'logs';
            const c = database.collection(collectionName);
            const logssCollection = await c.find(filter, options);
            const logs = await logssCollection.toArray();
            return {logs: logs };
        } catch (error) {
            throw (error);
        }
    },

    /**
     *
     * @param log
     * @returns {Promise<any>}
     */
    insertLog: async function (log) {
        try {
            const client = await getConnection(this.mongoClient,this.app.get('connectionStrings'))
            const database = client.db("entrega2");
            const collectionName = 'logs';
            const logsCollection = database.collection(collectionName);
            const result = await logsCollection.insertOne(log);
            return result.insertedId;
        } catch (error) {
            throw (error);
        }
    },

    resetLogs: async function (logs) {
        try {
            const client = await getConnection(this.mongoClient,this.app.get('connectionStrings'))
            const database = client.db("entrega2");
            const collectionName = 'logs';
            const logsCollection = database.collection(collectionName);
            await logsCollection.deleteMany();
            await logsCollection.insertMany(logs);
            return true;
        } catch(error){
            throw error;
        }
    },


    deleteLogs: async function (filter, options) {
        try {
            const client = await getConnection(this.mongoClient,this.app.get('connectionStrings'))
            const database = client.db("entrega2");
            const collectionName = 'logs';
            const logsCollection = database.collection(collectionName);
            const result = await logsCollection.deleteMany({}, options);
            return result;
        } catch (error) {
            throw (error);
        }
    },


};