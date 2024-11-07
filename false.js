
// Connect to MongoDB once and reuse connection
let db;
client.connect()
  .then(() => {
    console.log("Successfully connected to MongoDB!");
    db = client.db("Locker"); // Set your database here
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error);
  });

// Server status
const status = {
  Status_code: 400,
  Status: "Locker server run successfully",
  Author: "Md Arif Ahammed Reza",
  Contact: "reza35-951@diu.edu.bd"
};

// GET request for server status
app.get('/', (req, res) => {
  res.send(status);
});

// POST request to handle locker key data
app.post('/api/Locker/key', async (req, res) => {
  try {
    const data = req.body.data || "defaultData";
    const collection = db.collection("keys");

    // Check if the sID already exists in the database
    const existingEntry = await collection.findOne({ sID: data });
    if (existingEntry) {
      return res.status(400).send({ message: "ID already taken, please use a different key." });
    }

    // Create a new stack entry
    const date = new Date();
    const time = date.toLocaleTimeString();

    // Insert entry into the MongoDB collection
    const newEntry = { sID: data, date: date.toISOString(), time };
    await collection.insertOne(newEntry);

    res.send({ message: "Successfully taken id", data: data });
  } catch (error) {
    console.error("Error handling POST request:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

// GET request to retrieve all entries in LIFO order
app.get('/api/Locker/stack', async (req, res) => {
  try {
    const collection = db.collection("keys");

    // Retrieve all entries and send them in LIFO order
    const keys = await collection.find({}).toArray();
    res.status(200).send(keys.reverse());
  } catch (error) {
    console.error("Error retrieving stack:", error);
    res.status(500).send({ message: "Internal server error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
