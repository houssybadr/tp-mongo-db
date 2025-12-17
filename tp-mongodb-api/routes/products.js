const express = require('express');
const router = express.Router();

// GET /api/products/stats
// Must be defined before generic / to avoid conflict if we had /:id, though here it's fine.
router.get('/stats', async (req, res) => {
    try {
        const db = req.db;
        const collection = db.collection('products');

        // Exercise 6.1: Global Stats by Category
        const statsByCategory = await collection.aggregate([
            {
                $group: {
                    _id: "$category",
                    totalProducts: { $sum: 1 },
                    averagePrice: { $avg: "$price" },
                    maxPrice: { $max: "$price" },
                    minPrice: { $min: "$price" }
                }
            },
            { $sort: { averagePrice: -1 } },
            {
                $project: {
                    _id: 0,
                    categoryName: "$_id",
                    totalProducts: 1,
                    averagePrice: { $round: ["$averagePrice", 2] }, // Rounding for cleaner output
                    maxPrice: 1,
                    minPrice: 1
                }
            }
        ]).toArray();

        // Exercise 6.2: Best Rated Products > $500
        const bestRatedExpensive = await collection.aggregate([
            { $match: { price: { $gt: 500 } } },
            { $sort: { rating: -1 } },
            { $limit: 5 },
            {
                $project: {
                    _id: 0,
                    title: 1,
                    price: 1,
                    rating: 1
                }
            }
        ]).toArray();

        // Exercise 6.3: Brand Stats (Stock & Value)
        const statsByBrand = await collection.aggregate([
            {
                $group: {
                    _id: "$brand",
                    totalStock: { $sum: "$stock" },
                    totalValue: { $sum: { $multiply: ["$price", "$stock"] } }
                }
            },
             {
                $project: {
                    _id: 0,
                    brand: "$_id",
                    totalStock: 1,
                    totalValue: 1
                }
            }
        ]).toArray();

        res.json({
            statsByCategory,
            bestRatedExpensive,
            statsByBrand
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/products
router.get('/', async (req, res) => {
    try {
        const db = req.db;
        const collection = db.collection('products');

        // 1. Extract query parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const category = req.query.category;
        const search = req.query.search;
        const sort = req.query.sort;

        // 2. Build query
        const query = {};

        if (category) {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // 3. Build sort
        let sortOptions = {};
        if (sort) {
            // Handle cases like 'price' (asc) or '-price' (desc)
            const sortField = sort.replace('-', '');
            const sortOrder = sort.startsWith('-') ? -1 : 1;
            sortOptions[sortField] = sortOrder;
        }

        // 4. Pagination
        const skip = (page - 1) * limit;

        // 5. Execute query
        const products = await collection.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .toArray();

        const total = await collection.countDocuments(query);

        res.json({
            page,
            limit,
            total,
            products
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
