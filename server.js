const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        apiKeyConfigured: !!ANTHROPIC_API_KEY,
        timestamp: new Date().toISOString()
    });
});

// API proxy endpoint
app.post('/api/claude', async (req, res) => {
    console.log('=== API Request Received ===');
    console.log('API Key present:', !!ANTHROPIC_API_KEY);
    console.log('API Key first 10 chars:', ANTHROPIC_API_KEY ? ANTHROPIC_API_KEY.substring(0, 10) + '...' : 'none');
    
    if (!ANTHROPIC_API_KEY) {
        console.error('ERROR: No API key configured');
        return res.status(500).json({ 
            error: 'API key not configured. Please set ANTHROPIC_API_KEY in Railway environment variables.' 
        });
    }

    try {
        const { system, message } = req.body;
        console.log('System prompt length:', system?.length || 0);
        console.log('User message length:', message?.length || 0);

        const requestBody = {
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            system: system,
            messages: [{ role: 'user', content: message }]
        };

        console.log('Calling Anthropic API...');
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(requestBody)
        });

        console.log('Anthropic response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Anthropic API error:', JSON.stringify(errorData, null, 2));
            return res.status(response.status).json({ 
                error: errorData.error?.message || `API error: ${response.status}` 
            });
        }

        const data = await response.json();
        console.log('SUCCESS: Received response from Anthropic');
        console.log('Response length:', data.content[0]?.text?.length || 0);
        
        res.json({ response: data.content[0].text });
    } catch (error) {
        console.error('=== SERVER ERROR ===');
        console.error('Error type:', error.name);
        console.error('Error message:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ error: `Server error: ${error.message}` });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log('=================================');
    console.log('Yodo Tarot Server Started');
    console.log('=================================');
    console.log('Port:', PORT);
    console.log('API Key configured:', !!ANTHROPIC_API_KEY);
    console.log('Time:', new Date().toISOString());
    console.log('=================================');
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    process.exit(0);
});
