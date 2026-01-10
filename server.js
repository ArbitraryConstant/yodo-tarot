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
        console.log('API Key present:', !!ANTHROPIC_API_KEY);
        console.log('API Key length:', ANTHROPIC_API_KEY ? ANTHROPIC_API_KEY.length : 0);
        
        if (!ANTHROPIC_API_KEY) {
            console.error('No API key configured');
            return res.status(500).json({ error: 'API key not configured on server. Check Railway environment variables.' });
        }

        const { system, message } = req.body;
        console.log('Received request - system length:', system?.length, 'message length:', message?.length);

        const anthropicRequest = {
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            system: system,
            messages: [
                { role: 'user', content: message }
            ]
        };

        console.log('Calling Anthropic API...');
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(anthropicRequest)
        });

        console.log('Anthropic API response status:', response.status);

        if (!response.ok) {
            const error = await response.json();
            console.error('Anthropic API error:', error);
            return res.status(response.status).json({ 
                error: error.error?.message || `API request failed with status ${response.status}` 
            });
        }

        const data = await response.json();
        console.log('Successfully received response from Anthropic');
        res.json({ response: data.content[0].text });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: `Server error: ${error.message}` });
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
