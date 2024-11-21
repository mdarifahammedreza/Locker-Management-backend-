const express = require('express');
const cors = require('cors');
const status = require('./Status.js');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

// Server Config
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Class
class Server {
  constructor() {
    const uri = `mongodb+srv://reza1:${process.env.PASS}@reza.lrvbq.mongodb.net/?retryWrites=true&w=majority&appName=REZA`;
    this.client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    this.db = null;
  }

  // Connect to MongoDB
  async connectToDatabase() {
    try {
      console.log('Connecting to MongoDB...');
      await this.client.connect();
      await this.client.db("admin").command({ ping: 1 });
      console.log('Connected to MongoDB successfully.');
      this.db = this.client.db('reza1');
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      throw error;
    }
  }

  // Close MongoDB Connection
  async closeConnection() {
    try {
      await this.client.close();
      console.log('MongoDB connection closed.');
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
    }
  }

  // Add Key to Stack
  async addKeyToStack(Key_ID) {
    if (!this.db) return { message: 'Database connection is not established.' };

    const collection = this.db.collection('Stack_of_Keys');
    const existingKey = await collection.findOne({ Key_ID });

    if (existingKey) {
      return { message: 'Key Number already taken. Use a different key.' };
    }

    const newEntry = {
      Key_ID,
      date: new Date().toISOString(),
      time: new Date().toLocaleTimeString(),
    };

    await collection.insertOne(newEntry);
    return { messageType: 'Success', message: 'Key successfully added to stack.', data: Key_ID };
  }

  // Register a New Student
  async registerStudent(rfId, studentId, name) {
    if (!this.db) return { message: 'Database connection is not established.' };

    const collection = this.db.collection('Student_info');
    const newStudent = {
      rfId,
      studentId,
      name,
      keyStatus: 'Available',
      lastKeyActivityTime: new Date().toISOString(),
      studentBannedStatus: false,
      studentWarningStatus: 0,
      TakenKeyNumber: null,
    };

    const result = await collection.insertOne(newStudent);
    return { message: `Student ${name} registered successfully!`, studentId: result.insertedId };
  }

  // Book a Key for a Student
  async bookKeyForStudent(rfId) {
    if (!this.db) return { message: 'Database connection is not established.' };

    const keysCollection = this.db.collection('Stack_of_Keys');
    const studentsCollection = this.db.collection('Student_info');

    const availableKey = await keysCollection.find({}).sort({ _id: -1 }).limit(1).toArray();
    if (!availableKey.length) return { message: 'No keys available.' };

    const key = availableKey[0].Key_ID;
    const student = await studentsCollection.findOne({ rfId });

    if (!student) return { message: 'Student not found.' };
    if (student.keyStatus === 'Taken') return { message: 'Key already taken.', code: 'Camera activated' };

    await studentsCollection.updateOne(
      { rfId },
      { $set: { keyStatus: 'Taken', lastKeyActivityTime: new Date().toISOString(), TakenKeyNumber: key } }
    );

    await keysCollection.deleteOne({ Key_ID: key });
    return { message: `Key booked successfully: ${key}` };
  }
}

// Initialize the Server
const server = new Server();

(async () => {
  try {
    await server.connectToDatabase();
    console.log('Server initialization complete.');
  } catch (error) {
    console.error('Server failed to initialize:', error);
    process.exit(1); // Exit if the server fails to initialize
  }
})();

// Routes
app.get('/', (req, res) => res.send(status));

app.post('/api/Locker/key', async (req, res) => {
  const { data: Key_ID } = req.body;

  if (!Key_ID) return res.status(400).send({ message: 'Key_ID is required.' });

  try {
    const response = await server.addKeyToStack(Key_ID);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).send({ message: 'Error adding key to stack.', error });
  }
});

app.post('/api/student/register', async (req, res) => {
  const { rfId, studentId, name } = req.body;

  if (!rfId || !studentId || !name) {
    return res.status(400).send({ message: 'RFID, Student ID, and Name are required.' });
  }

  try {
    const response = await server.registerStudent(rfId, studentId, name);
    res.status(201).json(response);
  } catch (error) {
    res.status(500).send({ message: 'Error registering student.', error });
  }
});

app.post('/api/student/booked-key', async (req, res) => {
  const { data: rfId } = req.body;

  if (!rfId) return res.status(400).send({ message: 'RFID is required.' });

  try {
    const response = await server.bookKeyForStudent(rfId);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).send({ message: 'Error booking key.', error });
  }
});

// Server Listener
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
