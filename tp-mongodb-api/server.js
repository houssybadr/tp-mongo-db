require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const productsRouter = require('./routes/products');

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGO_URI;

let db;

// Middleware to parse JSON
app.use(express.json());

// Connect to MongoDB
MongoClient.connect(mongoUri)
    .then(client => {
        console.log('Connected to MongoDB');
        db = client.db();
        
        // Make db available in requests
        app.use((req, res, next) => {
            req.db = db;
            next();
        });

        // Routes
        app.use('/api/products', productsRouter);

        app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });
    })
    .catch(err => {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    });
