const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

class Server {
  constructor() {
    // Initialize MongoDB client
    const uri = `mongodb+srv://reza1:${process.env.PASS}@reza.lrvbq.mongodb.net/?retryWrites=true&w=majority&appName=REZA`;
    this.client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    this.db = null;
    console.log("Server class started");
  }

  // Method to run the server and connect to MongoDB
  async RunServer() {
    try {
      console.log('Trying to connect to MongoDB...');
      await this.client.connect();
      // Send a ping to confirm a successful connection
      await this.client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
      this.db = this.client.db('reza1'); // Set the DB once connected
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
    }
  }

  async StackOfKey(Key_ID) {
    if (!this.db) {
      return { message: "Database connection is not established." };
    }

    const collection = this.db.collection("Stack_of_Keys");
    // Check if the Key_ID already exists in the database
    const existingEntry = await collection.findOne({ Key_ID });
    if (existingEntry) {
      return { message: "Key Number already taken, please use a different key." };
    }

    // Create a new stack entry
    const date = new Date();
    const time = date.toLocaleTimeString();

    // Insert entry into the MongoDB collection
    const newEntry = { Key_ID, date: date.toISOString(), time };
    await collection.insertOne(newEntry);

    return { messageType: "Success", message: "Successfully taken id", data: Key_ID };
  }

  async HandleStudent(){
    if(!this.db){
      return {message:"Database connection is not established"}
    }

    const collection = this.db.collection("Student_key");

    const existingEntry = await collection.findOne({ RF_ID });
    if (existingEntry) {
      return { message: "?ID already Used?" };
    }

  }

}

module.exports = Server;
