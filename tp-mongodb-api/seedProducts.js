require('dotenv').config();
const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGO_URI;

async function seed() {
    const client = new MongoClient(mongoUri);

    try {
        await client.connect();
        console.log('Connected to MongoDB for seeding');
        const db = client.db();
        const collection = db.collection('products');

        // Fetch data
        console.log('Fetching products from dummyjson.com...');
        // Using native fetch (Node.js 18+)
        const response = await fetch('https://dummyjson.com/products?limit=100');
        const data = await response.json();
        const products = data.products;

        if (!products || products.length === 0) {
            console.log('No products found to seed.');
            return;
        }

        // Clear existing data
        console.log('Clearing existing products...');
        await collection.deleteMany({});

        // Insert new data
        console.log(`Inserting ${products.length} products...`);
        await collection.insertMany(products);

        console.log('Seeding completed successfully.');

    } catch (error) {
        console.error('Error during seeding:', error);
    } finally {
        await client.close();
        console.log('Disconnected from MongoDB');
    }
}

seed();
