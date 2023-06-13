const {getConnection} = require("./db");
module.exports = {
    mongoClient: null,
    app: null,
    init: function (app, mongoClient) {
        this.mongoClient = mongoClient;
        this.app = app;
    },
    /**
     * Obtiene los mensajes
     */
    getMessages: async function (filter, options) {
        try {
            const client = await this.mongoClient.connect(this.app.get('connectionStrings'));
            const database = client.db("entrega2");
            const collectionName = 'messages';
            const messagesCollection = database.collection(collectionName);
            const messages = await messagesCollection.find(filter, options).toArray();
            return messages;
        } catch (error) {
            throw (error);
        }
    },
    /**
     * Obtiene un mensaje dado un filtro
     */
    findMessage: async function (filter, options) {
        try {
            const client = await this.mongoClient.connect(this.app.get('connectionStrings'));
            const database = client.db("entrega2");
            const collectionName = 'messages';
            const messagesCollection = database.collection(collectionName);
            const message = await messagesCollection.findOne(filter, options);
            return message;
        } catch (error) {
            throw (error);
        }
    },
    insertMessage: async function (message, conversation) {
        try {
            const client = await getConnection(this.mongoClient, this.app.get('connectionStrings'))
            const database = client.db("entrega2");
            const collectionName = 'messages';
            const conversationsName = 'conversations';
            const messages = database.collection(collectionName);
            const conversations = database.collection(conversationsName);
            const result = await messages.insertOne(message);
            // Buscamos la conversación
            const newConversation = await conversations.find(conversation, {}).toArray();
            // Si lo retornado está vacío, significa que no existe. La insertamos.
            if (newConversation.length === 0) {
                conversations.insertOne(conversation);
            }
            return result.insertedId;
        } catch (error) {
            throw (error);
        }
    },
    /**
     * Obtiene los conversaciones
     */
    getConversations: async function (filter, options) {
        try {
            const client = await this.mongoClient.connect(this.app.get('connectionStrings'));
            const database = client.db("entrega2");
            const collectionName = 'conversations';
            const conversationsWithMessages = await database.collection(collectionName).aggregate([
                // Join the conversations and messages collections
                { $match: {
                    $or: [ {seller: filter.user}, {buyer: filter.user} ]
                } },
                {
                    $lookup: {
                        from: 'messages',
                        let: { buyer: "$buyer", seller: "$seller", offer: "$offer" },
                        pipeline: [
                            { $match:
                                    { $expr:
                                            { $and:
                                                    [
                                                        { $eq: [ "$buyer",  "$$buyer" ] },
                                                        { $eq: [ "$seller",  "$$seller" ] },
                                                        { $eq: [ "$offer",  "$$offer" ] }
                                                    ]
                                            }
                                    }
                            },
                        ],
                        as: 'messages'
                    }
                },
            ]).toArray();
            return conversationsWithMessages;
        } catch (error) {
            throw (error);
        }
    },
    deleteConversation: async function (filter, options) {
        try {
            const client = await this.mongoClient.connect(this.app.get('connectionStrings'));
            const database = client.db("entrega2");
            const collectionName = 'conversations';
            const conversationsCollection = database.collection(collectionName);
            const conversationToDelete = await conversationsCollection.findOne(filter, options);
            const result = await conversationsCollection.deleteOne(filter, options);
            // Si se ha encontrado la conversación
            // Borramos todos los mensajes asociados
            if (conversationToDelete !== null) {
                const messagesCollectionName = 'messages';
                const messagesCollection = database.collection(messagesCollectionName)
                const messageFilter = {
                    buyer: conversationToDelete.buyer,
                    seller: conversationToDelete.seller,
                    offer: conversationToDelete.offer
                }
                await messagesCollection.deleteMany(messageFilter, {});
            }
            return result;
        } catch (error) {
            throw (error);
        }
    },
    deleteConversations: async function (filter, options) {
        try {
            const client = await this.mongoClient.connect(this.app.get('connectionStrings'));
            const database = client.db("entrega2");
            const collectionName = 'conversations';
            const conversationsCollection = database.collection(collectionName);
            const conversationToDelete = await conversationsCollection.findOne(filter, options);
            const result = await conversationsCollection.deleteMany(filter, options);
            // Si se ha encontrado la conversación
            // Borramos todos los mensajes asociados
            if (conversationToDelete !== null) {
                const messagesCollectionName = 'messages';
                const messagesCollection = database.collection(messagesCollectionName)
                const messageFilter = {
                    offer: conversationToDelete.offer
                }
                await messagesCollection.deleteMany(messageFilter, {});
            }
            return result;
        } catch (error) {
            throw (error);
        }
    },
    updateMessage: async function (newMessage, filter, options) {
        try {
            const client = await this.mongoClient.connect(this.app.get('connectionStrings'));
            const database = client.db("entrega2");
            const collectionName = 'messages';
            const messagesCollection = database.collection(collectionName);
            const result = await messagesCollection.updateOne(filter, {$set: newMessage}, options);
            return result;
        } catch (error) {
            throw (error);
        }
    }
}