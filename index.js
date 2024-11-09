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

app.use(cors());
app.use(express.json());

// Root route for status
app.get('/', (req, res) => res.send(status));

// Route to handle key stack
app.post('/api/Locker/key', async (req, res) => {
  const data = req.body.data;
  try {
    const message = await server.StackOfKey(data);
    res.json(message);
  } catch (error) {
    console.error("Error handling key stack:", error);
    res.status(500).send({ message: "Error processing the key stack." });
  }
});

// Route for booking key by RFID
app.post('/api/student/booked-key', async (req, res) => {
  const rfId = req.body.data;
  const booked_key = req.body.key || null;
  console.log("booked_key",booked_key);
  if (!rfId) return res.status(400).send({ message: "RFID is required." });

  try {
    // Get the latest key from the Stack_of_Keys
    const key = (await server.db.collection("Stack_of_Keys").find({}).sort({ _id: -1 }).toArray())[0].Key_ID;
    if (!key) return res.status(404).send({ message: "No keys available." });

    // Find the student in the Student_info collection
    const student = await server.db.collection("Student_info").findOne({ rfId });
    if (!student) return res.status(404).send({ message: "Student not found!" });
    if (student.keyStatus === 'Taken') return res.status(200).send({ message: "Key already taken!" ,code:"Camera activeted"});

    // Update the student's key status and store the taken key
    await server.db.collection("Student_info").updateOne(
      { rfId },
      { $set: { keyStatus: "Taken", lastKeyActivityTime: new Date().toISOString(), TakenKeyNumber: key } }
    );

    // Remove the key from Stack_of_Keys
    await server.db.collection("Stack_of_Keys").deleteOne({ Key_ID: key });

    res.status(200).send({ message: `Key booked successfully!->${key}` });
  } catch (error) {
    console.error("Error booking key:", error);
    res.status(500).send({ message: "Error booking the key." });
  }
});

// Route to retrieve stack of keys in LIFO order
app.get('/api/Locker/stack', async (req, res) => {
  try {
    const keys = await server.db.collection("Stack_of_Keys").find({}).sort({ _id: -1 }).toArray();
    res.status(200).send(keys);
  } catch (error) {
    console.error("Error retrieving stack:", error);
    res.status(500).send({ message: "Error retrieving stack." });
  }
});

// Route to retrieve student information stack
app.get('/api/student/stack', async (req, res) => {
  try {
    const students = await server.db.collection("Student_info").find({}).sort({ _id: -1 }).toArray();
    res.status(200).send(students);
  } catch (error) {
    console.error("Error retrieving student stack:", error);
    res.status(500).send({ message: "Error retrieving student stack." });
  }
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
