const express = require('express');
var cors = require('cors');
const app = express();
const port = 7000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory stack array
let stack = [];

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
app.post('/api/Locker/key', (req, res) => {
    console.log("Request body:", req.body);
    const data = req.body.data || "defaultData";
    console.log(data);
    
    // Check if the sID already exists in the stack
    const existingEntry = stack.find(entry => entry.sID === data);
    if (existingEntry) {
        return res.status(400).send({ message: "ID already taken, please use a different key." });
    }

    // Create a new stack entry
    const date = new Date();
    const time = date.toLocaleTimeString();
    
    // Push entry onto the stack
    stack.push({ sID: data, date: date.toISOString(), time });

    res.send({ message: "Successfully taken id", data: data });
});

// GET request to retrieve all entries in LIFO order
app.get('/api/Locker/stack', (req, res) => {
    res.status(200).send(stack.reverse()); // Send the stack in LIFO order
});

// Start the server
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
