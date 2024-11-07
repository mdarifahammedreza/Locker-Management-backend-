const express = require('express');
const cors = require('cors');
const status = require('./Status.js');
const Server = require('./RunServer.js');
const app = express();
const port = 3000;

console.log(status.Author);

app.use(cors());
app.use(express.json());

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
