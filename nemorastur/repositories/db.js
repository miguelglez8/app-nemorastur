let connection;
let mongoClientInstance;

module.exports = {
  getConnection: async function (mongoClient, connectionStrings) {
    if (connection) return connection;

    mongoClientInstance = new mongoClient(connectionStrings, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Configura el tamaño máximo del pool.
    });

    connection = await mongoClientInstance.connect();
    return connection;
  },

  closeConnection: async function () {
    if (mongoClientInstance) {
      await mongoClientInstance.close();
      console.log("Connection to MongoDB closed");
      connection = null;
      mongoClientInstance = null;
    }
  },
};
