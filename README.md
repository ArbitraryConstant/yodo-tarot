# Yodo Tarot - Rhizomatic Divination System

A philosophical tarot reading application combining Jodorowskian interpretation with rhizomatic mapping and network visualization.

## Features

- **Tarot Reading**: Three modes - specific question, general life reading, or deep psychological exploration
- **Rhizomatic Mapping**: 4-cycle evolution of symbolic connections
- **Interactive Network Visualization**: Visual representation of symbolic nodes and relationships
- **Export**: Save readings as TXT, JSON, or HTML
- **Clean, Philosophical Design**: Modern aesthetic with thoughtful typography

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open browser to `http://localhost:3000`

## Railway Deployment

### Step 1: Prepare Repository (if using GitHub)
```bash
git init
git add .
git commit -m "Initial Yodo Tarot commit"
gh repo create yodo-tarot --public --source=. --remote=origin --push
```

### Step 2: Deploy to Railway

**Option A: Using Railway CLI**
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

**Option B: Using Railway Dashboard**
1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo" (if you created one) or "Empty Project"
4. If empty project: use Railway CLI to link or manually upload files
5. Railway will auto-detect Node.js and deploy

### Step 3: Configure API Key

When you first visit your deployed site, you'll be prompted to enter your Anthropic API key. This is stored in your browser's localStorage for future sessions.

**To get an Anthropic API key:**
1. Go to https://console.anthropic.com
2. Sign up or log in
3. Navigate to API Keys
4. Create a new key
5. Copy and paste it when prompted in Yodo Tarot

## Usage

1. **Choose Reading Type**: Select specific question, general reading, or deep exploration
2. **Enter Question**: Share your question or situation
3. **Receive Reading**: Get tarot interpretation in Yodo style
4. **Choose Path**: Decide to explore with Control (reading-only nodes) or Chaos (expanded connections)
5. **Rhizomatic Analysis**: Watch the network evolve through 4 cycles
6. **Synthesis**: Receive integrated insights and practical guidance
7. **Export**: Save your reading for future reference

## Technical Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Visualization**: Cytoscape.js for network graphs
- **AI**: Claude API (Anthropic)
- **Server**: Express.js (Node.js)
- **Deployment**: Railway

## Architecture

- `index.html` - Main application structure
- `styles.css` - Clean, philosophical aesthetic with custom typography
- `script.js` - Application logic, API integration, state management
- `server.js` - Express server for Railway deployment
- `package.json` - Node.js dependencies

## Future Enhancements (v2)

- [ ] Gemini API integration for tarot card images
- [ ] Visual card layouts during readings
- [ ] Save/load readings (database integration)
- [ ] User accounts and reading history
- [ ] Multiple tarot deck options
- [ ] Enhanced network visualization features
- [ ] Mobile app version

## Philosophy

Yodo Tarot combines psychological depth with symbolic exploration, creating a tool for self-reflection rather than fortune-telling. The rhizomatic mapping approach honors the interconnected nature of symbols and insights, allowing patterns to emerge organically through iterative cycles.

## Copyright Notice

This application uses interpretation styles inspired by philosophical approaches to tarot but makes no claim to represent any specific practitioner. "Yodo" is the public-facing brand name to avoid copyright concerns.

## License

MIT License - Feel free to modify and adapt for personal use.
