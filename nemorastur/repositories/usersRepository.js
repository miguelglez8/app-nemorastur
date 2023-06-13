const {getConnection} = require("./db");
module.exports = {
    mongoClient: null,
    app: null,

    init: function (app, mongoClient) {
        this.mongoClient = mongoClient;
        this.app = app;
    },

    /**
     *
     * @param filter
     * @param options
     * @returns {Promise<*>}
     */
    findUser: async function (filter, options) {
        try {
            const client = await getConnection(this.mongoClient,this.app.get('connectionStrings'))
            const database = client.db("entrega2");
            const collectionName = 'users';
            const usersCollection = database.collection(collectionName);
            const user = await usersCollection.findOne(filter, options);
            return user;
        } catch (error) {
            throw (error);
        }
    },

    /**
     *
     * @param filter
     * @param options
     * @returns {Promise<*>}
     */
    updateUser: async function (filter, options) {
        try {
            const client = await getConnection(this.mongoClient,this.app.get('connectionStrings'))
            const database = client.db("entrega2");
            const collectionName = 'users';
            const usersCollection = database.collection(collectionName);
            return await usersCollection.updateOne(filter, options);
        } catch (error) {
            throw (error);
        }
    },


    /**
     * @param filter
     * @param options
     * @returns {Promise<*>}
     */
    getUsers: async function (filter, options) {
        try {
            const client =await getConnection(this.mongoClient,this.app.get('connectionStrings'))
            const database = client.db("entrega2");
            const collectionName = 'users';
            const usersCollection = database.collection(collectionName);
            return await usersCollection.find(filter, options).toArray();
        } catch (error) {
            throw (error);
        }
    },

    /**
     * @param filter
     * @param options
     * @param page
     * @returns {Promise<{total: *, users: *}>}
     */
    getUsersPg: async function (filter, options, page){
        try {
            const limit = 5;
            const client = await getConnection(this.mongoClient,this.app.get('connectionStrings'))
            const database = client.db("entrega2");
            const collectionName = 'users';
            const usersCollection = database.collection(collectionName);
            const usersCollectionCount = await usersCollection.countDocuments(filter);
            const cursor = usersCollection.find(filter, options).skip((page - 1) * limit).limit(limit)
            const users = await cursor.toArray();
            return {users: users, total: usersCollectionCount };
        } catch (error) {
            throw (error);
        }
    },

    getUsers: async function (filter, options){
        try {
            const client = await getConnection(this.mongoClient,this.app.get('connectionStrings'))
            const database = client.db("entrega2");
            const collectionName = 'users';
            const c = database.collection(collectionName);
            const usersCollection = await c.find(filter, options);
            const users = await usersCollection.toArray();
            return {users: users };
        } catch (error) {
            throw (error);
        }
    },

    /**
     *
     * @param user
     * @returns {Promise<any>}
     */
    insertUser: async function (user) {
        try {
            const client = await getConnection(this.mongoClient,this.app.get('connectionStrings'))
            const database = client.db("entrega2");
            const collectionName = 'users';
            const usersCollection = database.collection(collectionName);
            const result = await usersCollection.insertOne(user);
            return result.insertedId;
        } catch (error) {
            throw (error);
        }
    },

    resetUsers: async function (users) {
        try {
            const client = await getConnection(this.mongoClient,this.app.get('connectionStrings'))
            const database = client.db("entrega2");
            const collectionName = 'users';
            const usersCollection = database.collection(collectionName);
            await usersCollection.deleteMany();
            await usersCollection.insertMany(users);
            return true;
        } catch(error){
            throw error;
        }
    },


    deleteUser: async function (filter, options) {
        try {
            const client = await getConnection(this.mongoClient,this.app.get('connectionStrings'))
            const database = client.db("entrega2");
            const collectionName = 'users';
            const usersCollection = database.collection(collectionName);
            const result = await usersCollection.deleteOne(filter, options);
            return result;
        } catch (error) {
            throw (error);
        }
    },


};