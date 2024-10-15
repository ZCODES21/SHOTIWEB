const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const API_KEY = 'shoti-3673ed33bc8186f@b37aba4c425fa@36@e6f30c0863dae181779bad3ee08@6ae95834eb@c8d1ccdf1d21a@b5@b4dc41afe7d@b8063f202@19c1c3fbf7bf1cbb@b1cac4b2d71fabc6c1b760ac0769490baaf4e6@c50';

app.get('/api/getvideo', async (req, res) => {
    try {
        const videoResponse = await axios.get(`https://shoti.kenliejugarap.com/getvideo.php?apikey=${API_KEY}`);

        if (videoResponse.data.error) {
            return res.status(400).json(videoResponse.data);
        }

        const videoUrl = videoResponse.data.videoDownloadLink;

        if (!videoUrl) {
            return res.status(400).send('Video URL not found');
        }

        const headResponse = await axios.head(videoUrl);
        const fileSize = parseInt(headResponse.headers['content-length'], 10);
        const contentType = headResponse.headers['content-type'];
        res.setHeader('Content-Type', contentType);

        const range = req.headers.range;
        if (!range) {
            res.setHeader('Content-Length', fileSize);
            const videoStreamResponse = await axios.get(videoUrl, { responseType: 'stream' });
            return videoStreamResponse.data.pipe(res);
        }

        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (start >= fileSize || end >= fileSize) {
            res.status(416).send('Requested range not satisfiable');
            return;
        }

        const chunkSize = (end - start) + 1;
        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize,
            'Content-Type': contentType
        });

        const videoStreamResponse = await axios.get(videoUrl, {
            responseType: 'stream',
            headers: {
                Range: `bytes=${start}-${end}`
            }
        });

        videoStreamResponse.data.pipe(res);
    } catch (error) {
        console.error('Error retrieving video:', error.message);
        res.status(500).send('Error retrieving video');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
