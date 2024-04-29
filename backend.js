// Required modules
const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Initialize express app
const app = express();

// Middleware
app.use(bodyParser.json());

// Database connection
mongoose.connect('mongodb://localhost:27017/product_transactions', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// MongoDB schema
const TransactionSchema = new mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    dateOfSale: Date,
    category: String,
    sold: Boolean
});

const Transaction = mongoose.model('Transaction', TransactionSchema);

// Routes

// API to initialize the database with seed data from third-party API
app.get('/api/initialize-database', async (req, res) => {
    try {
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        const transactions = response.data;

        // Insert transactions into database
        await Transaction.insertMany(transactions);

        res.status(200).json({ message: 'Database initialized successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error initializing database.' });
    }
});

// API to list all transactions with search and pagination
app.get('/api/transactions', async (req, res) => {
    const { month, searchText, page = 1, perPage = 10 } = req.query;

    try {
        let query = {};
        if (month) {
            // Convert month to number (e.g., January = 1, February = 2, etc.)
            const monthNumber = new Date(Date.parse(month + ' 1, 2000')).getMonth() + 1;
            query = { $expr: { $eq: [{ $month: '$dateOfSale' }, monthNumber] } };
        }

        if (searchText) {
            query.$or = [
                { title: { $regex: searchText, $options: 'i' } },
                { description: { $regex: searchText, $options: 'i' } },
                { price: { $regex: searchText, $options: 'i' } }
            ];
        }

        const transactions = await Transaction.find(query)
                                             .skip((page - 1) * perPage)
                                             .limit(parseInt(perPage));

        res.status(200).json(transactions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching transactions.' });
    }
});

// API for statistics
app.get('/api/statistics', async (req, res) => {
    const { month } = req.query;

    try {
        const monthNumber = new Date(Date.parse(month + ' 1, 2000')).getMonth() + 1;
        const totalSaleAmount = await Transaction.aggregate([
            {
                $match: { $expr: { $eq: [{ $month: '$dateOfSale' }, monthNumber] } }
            },
            {
                $group: { _id: null, totalAmount: { $sum: '$price' } }
            }
        ]);

        const totalSoldItems = await Transaction.countDocuments({
            $expr: { $eq: [{ $month: '$dateOfSale' }, monthNumber] },
            sold: true
        });

        const totalNotSoldItems = await Transaction.countDocuments({
            $expr: { $eq: [{ $month: '$dateOfSale' }, monthNumber] },
            sold: false
        });

        res.status(200).json({
            totalSaleAmount: totalSaleAmount.length ? totalSaleAmount[0].totalAmount : 0,
            totalSoldItems,
            totalNotSoldItems
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching statistics.' });
    }
});

// API for bar chart
app.get('/api/bar-chart', async (req, res) => {
    const { month } = req.query;

    try {
        const monthNumber = new Date(Date.parse(month + ' 1, 2000')).getMonth() + 1;
        const priceRanges = [
            { range: '0 - 100', count: await Transaction.countDocuments({ $expr: { $eq: [{ $month: '$dateOfSale' }, monthNumber] }, price: { $lte: 100 } }) },
            { range: '101 - 200', count: await Transaction.countDocuments({ $expr: { $eq: [{ $month: '$dateOfSale' }, monthNumber] }, price: { $gt: 100, $lte: 200 } }) },
            // Add other price ranges here...
        ];

        res.status(200).json(priceRanges);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching bar chart data.' });
    }
});

// API for pie chart
app.get('/api/pie-chart', async (req, res) => {
    const { month } = req.query;

    try {
        const monthNumber = new Date(Date.parse(month + ' 1, 2000')).getMonth() + 1;
        const categories = await Transaction.aggregate([
            {
                $match: { $expr: { $eq: [{ $month: '$dateOfSale' }, monthNumber] } }
            },
            {
                $group: { _id: '$category', count: { $sum: 1 } }
            }
        ]);

        res.status(200).json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching pie chart data.' });
    }
});

// Combined API
app.get('/api/combined-data', async (req, res) => {
    const { month } = req.query;

    try {
        const [transactions, statistics, barChartData, pieChartData] = await Promise.all([
            axios.get(`/api/transactions?month=${month}`),
            axios.get(`/api/statistics?month=${month}`),
            axios.get(`/api/bar-chart?month=${month}`),
            axios.get(`/api/pie-chart?month=${month}`)
        ]);

        res.status(200).json({
            transactions: transactions.data,
            statistics: statistics.data,
            barChartData: barChartData.data,
            pieChartData: pieChartData.data
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching combined data.' });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
