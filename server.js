const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// API proxy endpoint
app.post('/api/claude', async (req, res) => {
    try {
        if (!ANTHROPIC_API_KEY) {
            return res.status(500).json({ error: 'API key not configured on server' });
        }

        const { system, message } = req.body;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 4000,
                system: system,
                messages: [
                    { role: 'user', content: message }
                ]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            return res.status(response.status).json({ error: error.error?.message || 'API request failed' });
        }

        const data = await response.json();
        res.json({ response: data.content[0].text });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Yodo Tarot server running on port ${PORT}`);
    console.log(`API Key configured: ${ANTHROPIC_API_KEY ? 'Yes' : 'No'}`);
});
