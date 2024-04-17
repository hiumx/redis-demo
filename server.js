const express = require('express');
const redis = require('redis');

const PORT = process.env.PORT || 5111;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

let redisClient;

const connectRedis = async () => {
    redisClient = redis.createClient({
        host: 'localhost',
        port: REDIS_PORT
    });


    redisClient.on('connect', () => console.log('Connect to Redis successfully'));
    redisClient.on('error', (err) => console.log('Connect to Redis failure', err));

    await redisClient.connect();

    redisClient.set('age', 20);
}

connectRedis();

const app = express();

const fetchApi = async (id) => {
    try {
        const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`);

        const data = await res.json();
        return data;

    } catch (error) {
        console.error(error);
        throw error;
    }
}

const responseData = (res, data) => {
    res.status(200).json(data);
}

// Caching data with Redis
const cache = async (req, res, next) => {
    try {
        const { id } = req.params;

        const data = await redisClient.get(`post:${id}`);

        if (data !== null) responseData(res, data);
        else next();

    } catch (error) {
        console.error(error);
        throw error;
    }
}

app.get('/posts/:id', cache, async (req, res, next) => {
    const { id } = req.params;
    const { title } = await fetchApi(id);
    redisClient.setEx(`post:${id}`, 3600, title);

    responseData(res, title);
})

app.listen(PORT, () => {
    console.log(`App listen on port ${PORT}`);
})