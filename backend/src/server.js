import express from 'express';
import { MongoClient } from 'mongodb';
import path from 'path';

async function start() {

    console.log("Connecting to MongoDB...");
    const mongoDbUrl = `mongodb+srv://master-user:5HvW5JKbmNfRCQYh@cluster0.qsum1cb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
    const mongoClient = new MongoClient(mongoDbUrl);
    await mongoClient.connect();
    console.log("Connected to MongoDB!");
    const db = mongoClient.db('full-stack-vue');


    const app = express();
    app.use(express.json());
    app.use('/images', express.static(path.join(__dirname, '..', 'assets')));
    console.log("Static dir:", path.join(__dirname, "assets"));

    app.get('/api/products', async (req, res) => {
        const products = await db.collection('products').find().toArray();
        res.send(products);
    });

    async function populateCartItems(Ids) {
        return Promise.all(Ids.map(id => db.collection('products').findOne({ id })));
    }

    app.get('/api/users/:userId/cart', async (req, res) => {
        const user = await db.collection('users').findOne({ id: req.params.userId });
        const populatedCartItems = await populateCartItems(user.cartItems);
        res.json(populatedCartItems);
    });

    app.post('/api/users/:userId/cart', async (req, res) => {
        const userId = req.params.userId;
        const productId = req.body.id;

        await db.collection('users').updateOne({ id: userId }, {
            $addToSet: { cartItems: productId },
        });

        const user = await db.collection('users').findOne({ id: userId });
        const populatedCartItems = await populateCartItems(user.cartItems);
        res.json(populatedCartItems);
    });

    app.delete('/api/users/:userId/cart/:productId', async (req, res) => {
        const userId = req.params.userId;
        const productId = req.params.productId;
        await db.collection('users').updateOne({ id: userId }, {
            $pull: { cartItems: productId },
        });

        const user = await db.collection('users').findOne({ id: userId });
        const populatedCartItems = await populateCartItems(user.cartItems);
        res.json(populatedCartItems);
    });

    app.get('/api/products/:productId', async (req, res) => {
        const id = req.params.productId
        const product = await db.collection('products').findOne({ id });
        res.json(product);
    });

    app.listen(8000, () => {
        console.log('Server is listening on port 8000');
    });
}

start();