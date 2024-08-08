const express = require('express');
const app = express();

// Custom rate limiting middleware
const rateLimit = (options) => {
    const requestCounts = new Map();
    const { windowMs, max, message } = options;

    return (req, res, next) => {
        const currentTime = Date.now();
        const resetTime = currentTime + windowMs;
        const ip = req.ip;

        if (!requestCounts.has(ip)) {
            requestCounts.set(ip, { count: 1, resetTime });
        } else {
            const requestInfo = requestCounts.get(ip);

            if (currentTime > requestInfo.resetTime) {
                requestInfo.count = 1;
                requestInfo.resetTime = resetTime;
            } else {
                requestInfo.count += 1;
            }

            if (requestInfo.count > max) {
                return res.status(429).send(message || 'Too many requests, please try again later.');
            }
        }

        next();
    };
};

// Apply rate limiting middleware to all routes
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 10, // limit each IP to 10 requests per windowMs
    message: 'Too many requests from this IP, please try again after a minute.'
});

app.use(limiter);

// Define a simple route
app.get('/', (req, res) => {
    res.send('Hello, world!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
