const express = require('express');
const cors = require('cors');
const status = require('./Status.js');
const Server = require('./RunServer.js');
const app = express();
const port = 3000;

// Initialize server and database connection
const server = new Server();

(async () => {
  await server.RunServer();
  console.log(status.Author);
})();

// Middleware for CORS and JSON handling
app.use(cors());
app.use(express.json());

// Helper function to handle DB errors and responses
const handleDbError = (res, errorMessage, statusCode = 500) => {
  console.error(errorMessage, errorMessage);
  res.status(statusCode).send({ message: errorMessage });
};

// Route for status
app.get('/', (req, res) => res.send(status));

// Route to handle key stack actions (simplified for reuse)
app.post('/api/Locker/key', async (req, res) => {
  const { data } = req.body;
  try {
    const message = await server.StackOfKey(data);
    res.json(message);
  } catch (error) {
    handleDbError(res, "Error processing the key stack.");
  }
});

// Route for booking key by RFID (with booking logic reused)
app.post('/api/student/booked-key', async (req, res) => {
  const { data: rfId, key: bookedKey } = req.body;

  if (!rfId) return res.status(400).send({ message: "RFID is required." });

  if (bookedKey) {
    try {
      const message = await server.StackOfKey(bookedKey);
      await server.db.collection("Student_info").updateOne(
        { rfId },
        { $set: { keyStatus: "Available", lastKeyActivityTime: new Date().toISOString(), TakenKeyNumber: null } }
      );
      return res.json(message);
    } catch (error) {
      return handleDbError(res, "Error processing the key stack.");
    }
  }

  try {
    const key = (await server.db.collection("Stack_of_Keys").find({}).sort({ _id: -1 }).toArray())[0]?.Key_ID;
    if (!key) return res.status(404).send({ message: "No keys available." });

    const student = await server.db.collection("Student_info").findOne({ rfId });
    if (!student) return res.status(404).send({ message: "Student not found!" });
    if (student.keyStatus === 'Taken') return res.status(200).send({ message: "Key already taken!", code: "Camera activated" });

    await server.db.collection("Student_info").updateOne(
      { rfId },
      { $set: { keyStatus: "Taken", lastKeyActivityTime: new Date().toISOString(), TakenKeyNumber: key } }
    );

    await server.db.collection("Stack_of_Keys").deleteOne({ Key_ID: key });

    res.status(200).send({ message: `Key booked successfully!->${key}` });
  } catch (error) {
    return handleDbError(res, "Error booking the key.");
  }
});

// Route to retrieve the stack of keys
app.get('/api/Locker/stack', async (req, res) => {
  try {
    const keys = await server.db.collection("Stack_of_Keys").find({}).sort({ _id: -1 }).toArray();
    res.status(200).send(keys);
  } catch (error) {
    handleDbError(res, "Error retrieving stack.");
  }
});

// Route to retrieve student stack
app.get('/api/student/stack', async (req, res) => {
  try {
    const students = await server.db.collection("Student_info").find({}).sort({ _id: -1 }).toArray();
    res.status(200).send(students);
  } catch (error) {
    handleDbError(res, "Error retrieving student stack.");
  }
});

// **New API to register a student**
app.post('/api/student/register', async (req, res) => {
  const { rfId, studentId, name } = req.body;
  const newStudent = {
    rfId,
    studentId,
    name,
    keyStatus: 'Available',
    lastKeyActivityTime: new Date().toISOString(),
    studentBannedStatus: false,
    studentWarningStatus: 0,
    TakenKeyNumber: null
  };

  if (!rfId || !studentId || !name) {
    return res.status(400).send({ message: "RFID, Student ID, and Name are required." });
  }

  try {
    const result = await server.db.collection("Student_info").insertOne(newStudent);
    res.status(201).send({ message: `Student ${name} registered successfully!`, studentId: result.insertedId });
  } catch (error) {
    handleDbError(res, "Error registering student.");
  }
});

// Start server
app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
