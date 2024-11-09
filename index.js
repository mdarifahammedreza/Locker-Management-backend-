const express = require('express');
const cors = require('cors');
const status = require('./Status.js');
const Server = require('./RunServer.js');
const app = express();
const port = 3000;

console.log(status.Author);

app.use(cors());
app.use(express.json());

// const instance = ()=>{
//   const server =
// }



app.get('/', async (req, res) => {
  res.send(status);
  const server = new Server();
  await server.RunServer(); // Ensure the server is running before making DB calls
});

app.post('/api/Locker/key', async (req, res) => {
  const data = req.body.data || "00";
  console.log(data);

  const server = new Server();
  await server.RunServer(); // Ensure the server is running before making DB calls

  const message = await server.StackOfKey(data);
  console.log(message);

  res.json(message);
});

app.post('/api/student/booked-key', async (req, res) => {
  const rfId = req.body.data;
  console.log(rfId);

  if (!rfId) {
    return res.status(404).send({ message: "Scanning Failed!" });
  }

  try {
    const server = new Server();
    await server.RunServer();
    const collection = server.db.collection("Student_info");

    // Find the student by RF_ID
    const student = await collection.findOne({ RF_ID: rfId });

    // Check if the student exists and their Key Status is null
    if (!student) {
      return res.status(404).send({ message: "Student not found!" });
    }

    if (student.Key_Status !== null) {
      return res.status(403).send({ message: "Key already taken!" });
    }

    // Update Key Status to 'Taken'
    await collection.updateOne(
      { RF_ID: rfId },
      { $set: { Key_Status: "Taken", Last_Key_Activity_Time: new Date().toISOString() } }
    );

    res.status(200).send({ message: "Key booked successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "An error occurred while booking the key." });
  }
});


// GET request to retrieve all entries in LIFO order
app.get('/api/Locker/stack', async (req, res) => {
  try {
    const server = new Server();
    await server.RunServer(); // Ensure the server is running before making DB calls
    const collection = server.db.collection("Stack_of_Keys");

    // Retrieve all entries and send them in LIFO order
    const keys = await collection.find({}).toArray();
    res.status(200).send(keys.reverse());
  } catch (error) {
    console.error("Error retrieving stack:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});
app.get('/api/student/stack', async (req, res) => {
  try {
    const server = new Server();
    await server.RunServer(); // Ensure the server is running before making DB calls
    const collection = server.db.collection("Student_info");

    // Retrieve all entries and send them in LIFO order
    const keys = await collection.find({}).toArray();
    res.status(200).send(keys);
  } catch (error) {
    console.error("Error retrieving stack:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
