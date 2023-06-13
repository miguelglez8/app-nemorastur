let connection;
module.exports = {

    getConnection: async function (mongoClient,connectionStrings) {
        if(connection) return connection;
        connection= await mongoClient.connect(connectionStrings);
        console.log("Connected to MongoDB");
        return connection;
    }

}