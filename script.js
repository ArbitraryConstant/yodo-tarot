// Configuration
const CONFIG = {
    apiKey: '', // Will be fetched from server
    apiEndpoint: '/api/claude', // Use server endpoint instead of direct API
    model: 'claude-sonnet-4-20250514',
    maxTokens: 4000
};

// State management
const state = {
    readingType: null,
    userQuestion: null,
    readingContent: null,
    mappingMode: null,
    nodes: [],
    edges: [],
    cycles: [],
    synthesis: null,
    cy: null // Cytoscape instance
};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
});

function initializeEventListeners() {
    // Phase 1: Reading type selection
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const choice = e.currentTarget.dataset.choice;
            if (choice) {
                handleReadingTypeSelection(choice);
            }
        });
    });

    // Submit question
    document.getElementById('submit-question').addEventListener('click', handleQuestionSubmit);

    // Explore decision
    document.getElementById('explore-yes').addEventListener('click', () => {
        hidePhase('phase-reading');
        showPhase('phase-choice');
    });

    document.getElementById('explore-no').addEventListener('click', () => {
        hidePhase('phase-reading');
        showPhase('phase-synthesis');
        generateBasicSynthesis();
    });

    // Control or Chaos
    document.getElementById('choice-control').addEventListener('click', () => {
        state.mappingMode = 'control';
        hidePhase('phase-choice');
        showPhase('phase-confirm');
    });

    document.getElementById('choice-chaos').addEventListener('click', () => {
        state.mappingMode = 'chaos';
        hidePhase('phase-choice');
        showPhase('phase-confirm');
    });

    // Begin mapping
    document.getElementById('begin-mapping').addEventListener('click', handleBeginMapping);

    // Export and new reading
    document.getElementById('export-btn').addEventListener('click', () => {
        document.getElementById('export-modal').classList.remove('hidden');
    });

    document.getElementById('close-modal').addEventListener('click', () => {
        document.getElementById('export-modal').classList.add('hidden');
    });

    document.querySelectorAll('.export-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const format = e.currentTarget.dataset.format;
            exportReading(format);
        });
    });

    document.getElementById('new-reading-btn').addEventListener('click', resetApplication);
}

function handleReadingTypeSelection(choice) {
    state.readingType = choice;
    document.getElementById('question-input').classList.remove('hidden');
    
    // Set placeholder based on choice
    const textarea = document.getElementById('user-question');
    const placeholders = {
        specific: 'Share your question or describe your situation...',
        general: 'Tell me about what\'s present in your life right now...',
        deep: 'What aspect of your psyche calls for exploration?'
    };
    textarea.placeholder = placeholders[choice];
    textarea.focus();
}

async function handleQuestionSubmit() {
    const question = document.getElementById('user-question').value.trim();
    if (!question) {
        alert('Please share your question or situation.');
        return;
    }

    state.userQuestion = question;
    hidePhase('phase-question');
    showPhase('phase-reading');
    document.getElementById('reading-loading').classList.remove('hidden');

    try {
        const reading = await generateReading(state.readingType, question);
        state.readingContent = reading;
        displayReading(reading);
    } catch (error) {
        console.error('Error generating reading:', error);
        document.getElementById('reading-content').innerHTML = 
            '<p style="color: #f87171;">Error generating reading. Please check your API key and try again.</p>';
    } finally {
        document.getElementById('reading-loading').classList.add('hidden');
    }
}

async function generateReading(type, question) {
    const systemPrompt = `You are an AI simulation conducting a tarot reading in the style of a wise, insightful divination practitioner. Your approach combines:
- Deep psychological insight and symbolism
- Philosophical wisdom with practical application
- A blend of gentle humor and profound understanding
- Therapeutic guidance that empowers the querent

For this ${type} reading, provide:
1. A thoughtful introduction acknowledging their question
2. A spread of 3-5 cards with detailed symbolic interpretation
3. Analysis of relationships between cards
4. Integration of insights into a coherent narrative
5. Practical guidance and next steps

Keep the tone warm, philosophical, and empowering. Focus on psychological depth rather than fortune-telling.`;

    const userPrompt = `The querent asks: "${question}"

Please conduct a complete tarot reading for this ${type === 'specific' ? 'specific question' : type === 'general' ? 'general life reading' : 'deep psychological exploration'}.`;

    const response = await callClaudeAPI(systemPrompt, userPrompt);
    return response;
}

async function handleBeginMapping() {
    hidePhase('phase-confirm');
    showPhase('phase-mapping');
    document.getElementById('mapping-loading').classList.remove('hidden');

    try {
        // Generate nodes from reading
        await generateInitialNodes();
        
        // Run 4 cycles of evolution
        for (let i = 1; i <= 4; i++) {
            await runMappingCycle(i);
        }

        // Generate final synthesis
        await generateFinalSynthesis();
        
        hidePhase('phase-mapping');
        showPhase('phase-synthesis');
    } catch (error) {
        console.error('Error in mapping process:', error);
        alert('Error during rhizomatic mapping. Please try again.');
    } finally {
        document.getElementById('mapping-loading').classList.add('hidden');
    }
}

async function generateInitialNodes() {
    const systemPrompt = `You are analyzing a tarot reading to extract key symbolic nodes for rhizomatic mapping.

Extract 8-12 distinct nodes from the reading. Each node should be:
- A key symbol, theme, insight, or archetypal pattern
- Brief (2-5 words)
- Conceptually distinct from other nodes

Format your response as JSON:
{
  "nodes": [
    {"id": "node1", "label": "Shadow Integration", "type": "psychological"},
    {"id": "node2", "label": "Creative Renewal", "type": "theme"}
  ]
}

Node types: symbol, theme, insight, archetype, emotion, action`;

    const userPrompt = `Extract initial nodes from this reading:\n\n${state.readingContent}

${state.mappingMode === 'chaos' ? 'Feel free to add symbolic connections beyond what\'s explicitly stated.' : 'Only extract nodes directly derived from the reading.'}`;

    const response = await callClaudeAPI(systemPrompt, userPrompt);
    
    // Parse JSON response
    try {
        const data = JSON.parse(response);
        state.nodes = data.nodes || [];
    } catch (e) {
        // Fallback parsing if not proper JSON
        state.nodes = parseNodesFromText(response);
    }
}

async function runMappingCycle(cycleNum) {
    document.getElementById('current-cycle').textContent = cycleNum;
    
    const descriptions = [
        'Identifying primary connections and patterns...',
        'Discovering deeper symbolic relationships...',
        'Exploring emergent themes and resonances...',
        'Synthesizing insights and practical applications...'
    ];
    
    document.getElementById('cycle-description').textContent = descriptions[cycleNum - 1];

    const systemPrompt = `You are conducting cycle ${cycleNum} of rhizomatic analysis on tarot reading insights.

Current nodes: ${JSON.stringify(state.nodes)}

For this cycle:
1. Identify new connections between nodes
2. ${cycleNum === 1 ? 'Find obvious thematic links' : ''}
3. ${cycleNum === 2 ? 'Explore symbolic resonances' : ''}
4. ${cycleNum === 3 ? 'Discover emergent patterns' : ''}
5. ${cycleNum === 4 ? 'Connect to practical applications' : ''}

${state.mappingMode === 'chaos' && cycleNum > 2 ? 'Add 2-3 new nodes that expand the symbolic network.' : ''}

Return JSON:
{
  "edges": [{"from": "node1", "to": "node2", "relationship": "description"}],
  "newNodes": [{"id": "nodeX", "label": "New Concept", "type": "insight"}],
  "insights": "Key patterns discovered this cycle..."
}`;

    const response = await callClaudeAPI(systemPrompt, '');
    
    try {
        const data = JSON.parse(response);
        if (data.edges) state.edges.push(...data.edges);
        if (data.newNodes) state.nodes.push(...data.newNodes);
        state.cycles.push({
            cycle: cycleNum,
            insights: data.insights || '',
            nodeCount: state.nodes.length,
            edgeCount: state.edges.length
        });
    } catch (e) {
        console.error('Error parsing cycle response:', e);
    }

    // Update visualization
    updateNetworkGraph();
    
    // Display insights
    const insightsBox = document.getElementById('mapping-insights');
    insightsBox.innerHTML = `<h4>Cycle ${cycleNum} Insights</h4><p>${state.cycles[cycleNum - 1]?.insights || 'Connections forming...'}</p>`;

    // Small delay between cycles for visual effect
    await new Promise(resolve => setTimeout(resolve, 1000));
}

function updateNetworkGraph() {
    const container = document.getElementById('network-graph');
    
    // Convert nodes and edges to Cytoscape format
    const elements = [
        ...state.nodes.map(node => ({
            data: { id: node.id, label: node.label, type: node.type }
        })),
        ...state.edges.map((edge, idx) => ({
            data: { 
                id: `edge${idx}`, 
                source: edge.from, 
                target: edge.to,
                label: edge.relationship 
            }
        }))
    ];

    if (state.cy) {
        state.cy.destroy();
    }

    state.cy = cytoscape({
        container: container,
        elements: elements,
        style: [
            {
                selector: 'node',
                style: {
                    'background-color': '#7366ff',
                    'label': 'data(label)',
                    'color': '#e8e8f0',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'font-size': '12px',
                    'font-family': 'Fira Sans, sans-serif',
                    'text-wrap': 'wrap',
                    'text-max-width': '100px',
                    'width': '60px',
                    'height': '60px'
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 2,
                    'line-color': '#5a4ecc',
                    'target-arrow-color': '#5a4ecc',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                    'opacity': 0.6
                }
            }
        ],
        layout: {
            name: 'cose',
            animate: true,
            animationDuration: 1000,
            nodeRepulsion: 8000,
            idealEdgeLength: 100,
            nodeOverlap: 20,
            gravity: 0.1
        }
    });
}

async function generateFinalSynthesis() {
    const systemPrompt = `You are creating a final synthesis of the rhizomatic tarot reading analysis.

Original question: ${state.userQuestion}
Reading content: ${state.readingContent}
Nodes discovered: ${state.nodes.length}
Connections mapped: ${state.edges.length}
Cycle insights: ${JSON.stringify(state.cycles)}

Create a comprehensive synthesis that includes:
1. Core patterns and themes identified
2. Key symbolic clusters
3. Practical applications and next steps
4. Integration with the original question
5. Emergent insights from the mapping process

Write in a clear, insightful, and actionable style.`;

    const response = await callClaudeAPI(systemPrompt, '');
    state.synthesis = response;
    document.getElementById('synthesis-content').innerHTML = formatContent(response);
}

function generateBasicSynthesis() {
    // If user chose not to explore, create simple synthesis
    const content = `<h3>Reading Synthesis</h3>
    <p>Your reading provided guidance through symbolic interpretation. The cards revealed patterns and insights relevant to your question.</p>
    <div style="margin-top: 2rem;">${formatContent(state.readingContent)}</div>`;
    
    state.synthesis = content;
    document.getElementById('synthesis-content').innerHTML = content;
}

async function callClaudeAPI(systemPrompt, userPrompt) {
    const response = await fetch(CONFIG.apiEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            system: systemPrompt,
            message: userPrompt
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`API Error: ${error.error || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.response;
}

function displayReading(content) {
    document.getElementById('reading-content').innerHTML = formatContent(content);
    document.getElementById('reading-complete').classList.remove('hidden');
}

function formatContent(text) {
    // Simple formatting: preserve paragraphs and add structure
    return text
        .split('\n\n')
        .map(para => `<p>${para.trim()}</p>`)
        .join('');
}

function parseNodesFromText(text) {
    // Fallback parser if JSON fails
    const nodes = [];
    const lines = text.split('\n');
    let idCounter = 1;
    
    lines.forEach(line => {
        if (line.trim() && !line.includes('{') && !line.includes('}')) {
            nodes.push({
                id: `node${idCounter++}`,
                label: line.trim().substring(0, 50),
                type: 'general'
            });
        }
    });
    
    return nodes.slice(0, 12); // Limit to 12 nodes
}

function exportReading(format) {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `yodo-reading-${timestamp}`;
    
    let content, mimeType, extension;
    
    if (format === 'txt') {
        content = generateTextExport();
        mimeType = 'text/plain';
        extension = 'txt';
    } else if (format === 'json') {
        content = generateJSONExport();
        mimeType = 'application/json';
        extension = 'json';
    } else if (format === 'html') {
        content = generateHTMLExport();
        mimeType = 'text/html';
        extension = 'html';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
    
    document.getElementById('export-modal').classList.add('hidden');
}

function generateTextExport() {
    return `YODO TAROT READING
Generated: ${new Date().toLocaleString()}
Reading Type: ${state.readingType}

QUESTION:
${state.userQuestion}

READING:
${state.readingContent}

${state.synthesis ? `\nSYNTHESIS:\n${state.synthesis}` : ''}

${state.nodes.length > 0 ? `\nRHIZOMATIC NODES (${state.nodes.length}):\n${state.nodes.map(n => `- ${n.label}`).join('\n')}` : ''}
`;
}

function generateJSONExport() {
    return JSON.stringify({
        timestamp: new Date().toISOString(),
        readingType: state.readingType,
        question: state.userQuestion,
        reading: state.readingContent,
        synthesis: state.synthesis,
        rhizomaticMapping: {
            mode: state.mappingMode,
            nodes: state.nodes,
            edges: state.edges,
            cycles: state.cycles
        }
    }, null, 2);
}

function generateHTMLExport() {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Yodo Tarot Reading</title>
    <style>
        body { font-family: Georgia, serif; max-width: 800px; margin: 2rem auto; padding: 2rem; line-height: 1.8; background: #0a0a0f; color: #e8e8f0; }
        h1 { color: #7366ff; }
        .section { margin: 2rem 0; padding: 1.5rem; background: #1a1a24; border-left: 3px solid #7366ff; }
        .meta { color: #a8a8b8; font-size: 0.9rem; }
    </style>
</head>
<body>
    <h1>Yodo Tarot Reading</h1>
    <p class="meta">Generated: ${new Date().toLocaleString()}</p>
    
    <div class="section">
        <h2>Question</h2>
        <p>${state.userQuestion}</p>
    </div>
    
    <div class="section">
        <h2>Reading</h2>
        ${formatContent(state.readingContent)}
    </div>
    
    ${state.synthesis ? `<div class="section"><h2>Synthesis</h2>${formatContent(state.synthesis)}</div>` : ''}
    
    ${state.nodes.length > 0 ? `<div class="section"><h2>Rhizomatic Nodes</h2><ul>${state.nodes.map(n => `<li>${n.label}</li>`).join('')}</ul></div>` : ''}
</body>
</html>`;
}

function showPhase(phaseId) {
    document.getElementById(phaseId).classList.remove('hidden');
    document.getElementById(phaseId).classList.add('active');
}

function hidePhase(phaseId) {
    document.getElementById(phaseId).classList.remove('active');
    document.getElementById(phaseId).classList.add('hidden');
}

function resetApplication() {
    // Reset state
    Object.keys(state).forEach(key => {
        if (Array.isArray(state[key])) {
            state[key] = [];
        } else if (key !== 'cy') {
            state[key] = null;
        }
    });
    
    if (state.cy) {
        state.cy.destroy();
        state.cy = null;
    }
    
    // Reset UI
    document.querySelectorAll('.phase').forEach(phase => {
        phase.classList.add('hidden');
        phase.classList.remove('active');
    });
    
    document.getElementById('phase-question').classList.remove('hidden');
    document.getElementById('phase-question').classList.add('active');
    document.getElementById('question-input').classList.add('hidden');
    document.getElementById('user-question').value = '';
}
