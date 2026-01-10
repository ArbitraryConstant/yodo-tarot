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
        document.getElementById('reading-complete').classList.add('hidden');
        document.getElementById('followup-section').classList.remove('hidden');
        document.getElementById('followup-question').focus();
    });
    
    // Submit follow-up question
    document.getElementById('submit-followup').addEventListener('click', handleFollowupQuestion);

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
    
    // Cycle modal close
    document.getElementById('close-cycle-modal').addEventListener('click', closeCycleModal);
    
    // ESC key closes cycle modal too
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const cardModal = document.getElementById('card-modal');
            const cycleModal = document.getElementById('cycle-modal');
            
            if (cardModal.classList.contains('active')) {
                closeCardModal();
            } else if (!cycleModal.classList.contains('hidden')) {
                closeCycleModal();
            }
        }
    });
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
    
    // Start countdown timer
    startCountdownTimer('reading-timer', 30);

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

// Countdown timer utility
let timerInterval = null;
let followupTimerInterval = null;

function startCountdownTimer(elementId, seconds) {
    // Clear any existing timer for this element
    if (elementId === 'followup-timer') {
        if (followupTimerInterval) {
            clearInterval(followupTimerInterval);
        }
    } else {
        if (timerInterval) {
            clearInterval(timerInterval);
        }
    }
    
    const timerElement = document.getElementById(elementId);
    if (!timerElement) return;
    
    let remaining = seconds;
    
    const updateTimer = () => {
        if (remaining > 0) {
            timerElement.textContent = `~${remaining} seconds`;
            remaining--;
        } else {
            timerElement.textContent = 'Almost there...';
        }
    };
    
    updateTimer(); // Initial update
    
    const interval = setInterval(updateTimer, 1000);
    
    // Store the interval
    if (elementId === 'followup-timer') {
        followupTimerInterval = interval;
    } else {
        timerInterval = interval;
    }
}

async function handleFollowupQuestion() {
    const followup = document.getElementById('followup-question').value.trim();
    if (!followup) {
        alert('Please enter a follow-up question or comment.');
        return;
    }

    // Hide follow-up textarea and button, show loading at bottom
    document.getElementById('followup-question').classList.add('hidden');
    document.getElementById('submit-followup').classList.add('hidden');
    document.getElementById('followup-loading').classList.remove('hidden');
    
    // Also show loading at top
    document.getElementById('reading-loading').classList.remove('hidden');
    
    // Start countdown timer
    startCountdownTimer('followup-timer', 30);
    startCountdownTimer('reading-timer', 30);

    try {
        // Create context-aware follow-up prompt
        const systemPrompt = `You are continuing a tarot reading. The original reading is provided as context. Now the querent has a follow-up question or comment. Provide additional insight, draw new cards if needed, or explore the themes more deeply.

Original reading:
${state.readingContent}

Continue in the same philosophical, insightful style. Keep your response focused and substantial.`;

        const userPrompt = `The querent says: "${followup}"

Please continue the reading, addressing their follow-up.`;

        const response = await callClaudeAPI(systemPrompt, userPrompt);
        
        // Create visual separator
        const separator = `<div class="reading-separator"><h4>Continued Exploration</h4></div>`;
        
        // Append to reading content with separator
        state.readingContent += '\n\n---SEPARATOR---\n\n' + response;
        
        // Display updated reading with visual separator
        const contentBox = document.getElementById('reading-content');
        const formattedContent = formatContentWithCards(state.readingContent);
        contentBox.innerHTML = formattedContent.replace(/---SEPARATOR---/g, separator);
        
        // Show "Ready to Explore" again
        document.getElementById('reading-complete').classList.remove('hidden');
        
        // Reset follow-up section
        document.getElementById('followup-question').value = '';
        document.getElementById('followup-question').classList.remove('hidden');
        document.getElementById('submit-followup').classList.remove('hidden');
        document.getElementById('followup-loading').classList.add('hidden');
        document.getElementById('followup-section').classList.add('hidden');
        
        // Scroll to the new content smoothly
        setTimeout(() => {
            const separators = contentBox.querySelectorAll('.reading-separator');
            const lastSeparator = separators[separators.length - 1];
            if (lastSeparator) {
                lastSeparator.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
        
    } catch (error) {
        console.error('Error generating follow-up:', error);
        const contentBox = document.getElementById('reading-content');
        contentBox.innerHTML += '<p style="color: #f87171;">Error generating follow-up. Please try again.</p>';
    } finally {
        document.getElementById('reading-loading').classList.add('hidden');
        document.getElementById('followup-loading').classList.add('hidden');
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
    
    // Show reading summary
    const summary = document.getElementById('reading-summary');
    const summaryText = document.getElementById('summary-text');
    const questionPreview = state.userQuestion.length > 80 
        ? state.userQuestion.substring(0, 80) + '...' 
        : state.userQuestion;
    summaryText.textContent = questionPreview;
    summary.classList.remove('hidden');
    
    // Start countdown timer (18 seconds per cycle * 4 = 72 seconds)
    startCountdownTimer('mapping-timer', 72);

    try {
        // Generate nodes from reading
        await generateInitialNodes();
        
        // Run 4 cycles of evolution
        for (let i = 1; i <= 4; i++) {
            await runMappingCycle(i);
        }

        // Generate final synthesis
        await generateFinalSynthesis();
        
        // Clear timer
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        hidePhase('phase-mapping');
        showPhase('phase-synthesis');
    } catch (error) {
        console.error('Error in mapping process:', error);
        alert('Error during rhizomatic mapping. Please try again.');
        if (timerInterval) {
            clearInterval(timerInterval);
        }
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

IMPORTANT: Respond ONLY with valid JSON, no other text.

Format:
{
  "nodes": [
    {"id": "node1", "label": "Shadow Integration", "type": "psychological"},
    {"id": "node2", "label": "Creative Renewal", "type": "theme"}
  ]
}

Node types: symbol, theme, insight, archetype, emotion, action`;

    const userPrompt = `Extract initial nodes from this reading:

${state.readingContent}

${state.mappingMode === 'chaos' ? 'Feel free to add symbolic connections beyond what\'s explicitly stated.' : 'Only extract nodes directly derived from the reading.'}

Return ONLY the JSON, no explanation or preamble.`;

    const response = await callClaudeAPI(systemPrompt, userPrompt);
    
    console.log('Initial nodes response:', response.substring(0, 200));
    
    // Try to extract JSON from response
    try {
        // Remove any markdown code blocks
        let cleanResponse = response.trim();
        if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }
        
        const data = JSON.parse(cleanResponse);
        if (data.nodes && Array.isArray(data.nodes)) {
            state.nodes = data.nodes;
            console.log('Successfully parsed nodes:', state.nodes.length);
        } else {
            throw new Error('Invalid nodes structure');
        }
    } catch (e) {
        console.error('Error parsing nodes JSON:', e);
        console.error('Response was:', response);
        // Fallback parsing if not proper JSON
        state.nodes = parseNodesFromText(response);
        console.log('Using fallback parsing, got:', state.nodes.length, 'nodes');
    }
}

async function runMappingCycle(cycleNum) {
    document.getElementById('current-cycle').textContent = cycleNum;
    
    // Update progress bar
    const progressBar = document.getElementById('cycle-progress-bar');
    progressBar.style.width = `${(cycleNum / 4) * 100}%`;
    
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

IMPORTANT: Return ONLY valid JSON, no other text.

Format:
{
  "edges": [{"from": "node1", "to": "node2", "relationship": "description"}],
  "newNodes": [{"id": "nodeX", "label": "New Concept", "type": "insight"}],
  "insights": "Key patterns discovered this cycle..."
}`;

    const userPrompt = `Perform cycle ${cycleNum} analysis. Analyze the current nodes and generate connections, patterns, and insights as specified. Return ONLY the JSON response, no explanation.`;
    
    const response = await callClaudeAPI(systemPrompt, userPrompt);
    
    console.log(`Cycle ${cycleNum} response:`, response.substring(0, 200));
    
    try {
        // Remove any markdown code blocks
        let cleanResponse = response.trim();
        if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }
        
        const data = JSON.parse(cleanResponse);
        if (data.edges) state.edges.push(...data.edges);
        if (data.newNodes) state.nodes.push(...data.newNodes);
        
        // Store cycle data for viewing later
        state.cycles.push({
            cycle: cycleNum,
            insights: data.insights || '',
            nodeCount: state.nodes.length,
            edgeCount: state.edges.length,
            nodes: JSON.parse(JSON.stringify(state.nodes)),  // Deep copy
            edges: JSON.parse(JSON.stringify(state.edges))   // Deep copy
        });
        
        console.log(`Cycle ${cycleNum} complete: ${state.nodes.length} nodes, ${state.edges.length} edges`);
        
        // Add button for this cycle
        addCycleButton(cycleNum);
        
    } catch (e) {
        console.error(`Error parsing cycle ${cycleNum} response:`, e);
        console.error('Response was:', response);
        // Still add cycle info even if parsing failed
        state.cycles.push({
            cycle: cycleNum,
            insights: 'Unable to parse cycle insights',
            nodeCount: state.nodes.length,
            edgeCount: state.edges.length,
            nodes: JSON.parse(JSON.stringify(state.nodes)),
            edges: JSON.parse(JSON.stringify(state.edges))
        });
    }

    // Update visualization
    updateNetworkGraph();
    
    // Display insights
    const insightsBox = document.getElementById('mapping-insights');
    insightsBox.innerHTML = `<h4>Cycle ${cycleNum} Insights</h4><p>${state.cycles[cycleNum - 1]?.insights || 'Connections forming...'}</p>`;

    // Small delay between cycles for visual effect
    await new Promise(resolve => setTimeout(resolve, 1000));
}

// Add button for viewing a specific cycle
function addCycleButton(cycleNum) {
    const buttonsContainer = document.getElementById('cycle-buttons');
    const button = document.createElement('button');
    button.className = 'cycle-button';
    button.textContent = `View Cycle ${cycleNum}`;
    button.style.animationDelay = `${cycleNum * 0.1}s`;
    button.onclick = () => viewCycle(cycleNum);
    buttonsContainer.appendChild(button);
}

// View a specific cycle in modal
function viewCycle(cycleNum) {
    const cycleData = state.cycles[cycleNum - 1];
    if (!cycleData) return;
    
    const modal = document.getElementById('cycle-modal');
    const title = document.getElementById('cycle-modal-title');
    const insights = document.getElementById('cycle-modal-insights');
    
    title.textContent = `Cycle ${cycleNum} - ${cycleData.nodeCount} nodes, ${cycleData.edgeCount} connections`;
    insights.innerHTML = `<h4>Insights</h4><p>${cycleData.insights}</p>`;
    
    // Render the network graph for this cycle
    renderCycleGraph(cycleData);
    
    modal.classList.remove('hidden');
    
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
}

// Close cycle modal
function closeCycleModal() {
    document.getElementById('cycle-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Render network graph for a specific cycle
function renderCycleGraph(cycleData) {
    const container = document.getElementById('cycle-modal-graph');
    
    const elements = [
        ...cycleData.nodes.map(node => ({
            data: { id: node.id, label: node.label, type: node.type }
        })),
        ...cycleData.edges.map((edge, idx) => ({
            data: { 
                id: `edge${idx}`, 
                source: edge.from, 
                target: edge.to,
                label: edge.relationship 
            }
        }))
    ];

    const cy = cytoscape({
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
            animate: false,
            nodeRepulsion: 8000,
            idealEdgeLength: 100,
            nodeOverlap: 20,
            gravity: 0.1
        },
        userPanningEnabled: true,
        boxSelectionEnabled: false
    });
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
        },
        // Enable panning with both mouse buttons
        userPanningEnabled: true,
        boxSelectionEnabled: false
    });
    
    // Add right-click panning support
    let isPanning = false;
    let panStartPos = { x: 0, y: 0 };
    
    container.addEventListener('mousedown', (e) => {
        if (e.button === 2) { // Right mouse button
            e.preventDefault();
            isPanning = true;
            panStartPos = { x: e.clientX, y: e.clientY };
            container.style.cursor = 'grabbing';
        }
    });
    
    container.addEventListener('mousemove', (e) => {
        if (isPanning) {
            e.preventDefault();
            const dx = e.clientX - panStartPos.x;
            const dy = e.clientY - panStartPos.y;
            
            const pan = state.cy.pan();
            state.cy.pan({
                x: pan.x + dx,
                y: pan.y + dy
            });
            
            panStartPos = { x: e.clientX, y: e.clientY };
        }
    });
    
    container.addEventListener('mouseup', (e) => {
        if (e.button === 2) {
            isPanning = false;
            container.style.cursor = 'default';
        }
    });
    
    container.addEventListener('mouseleave', () => {
        isPanning = false;
        container.style.cursor = 'default';
    });
    
    // Prevent context menu on right-click
    container.addEventListener('contextmenu', (e) => {
        e.preventDefault();
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

    const userPrompt = `Please create the final synthesis integrating all insights from the reading and rhizomatic mapping process.`;
    
    const response = await callClaudeAPI(systemPrompt, userPrompt);
    state.synthesis = response;
    document.getElementById('synthesis-content').innerHTML = formatContentWithCards(response);
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
    console.log('=== callClaudeAPI called ===');
    console.log('Endpoint:', CONFIG.apiEndpoint);
    console.log('System prompt length:', systemPrompt?.length);
    console.log('User prompt length:', userPrompt?.length);
    
    try {
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

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                throw new Error(`API Error (${response.status}): ${errorText}`);
            }
            throw new Error(`API Error: ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('Response data received, length:', data.response?.length);
        return data.response;
    } catch (error) {
        console.error('=== callClaudeAPI error ===');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Full error:', error);
        throw error;
    }
}

function displayReading(content) {
    document.getElementById('reading-content').innerHTML = formatContentWithCards(content);
    document.getElementById('reading-complete').classList.remove('hidden');
}

function formatContent(text) {
    // Simple formatting: preserve paragraphs and add structure
    return text
        .split('\n\n')
        .map(para => `<p>${para.trim()}</p>`)
        .join('');
}

// Enhanced format content with card detection and insertion
function formatContentWithCards(text) {
    const paragraphs = text.split('\n\n');
    const formattedParagraphs = [];
    
    for (let para of paragraphs) {
        const paraText = para.trim();
        
        // Check if this paragraph mentions any cards
        const cardMatches = detectCardsInTextOrdered(paraText);
        
        // Insert paragraph first
        formattedParagraphs.push(`<p>${paraText}</p>`);
        
        // Then insert card images in order of first mention, no duplicates
        if (cardMatches.length > 0) {
            for (let cardInfo of cardMatches) {
                const cardKey = cardInfo.name.toLowerCase();
                if (CARD_MAPPING[cardKey]) {
                    formattedParagraphs.push(createCardHTML(cardInfo.name, CARD_MAPPING[cardKey], cardInfo.reversed));
                }
            }
        }
    }
    
    return formattedParagraphs.join('');
}

// Detect card names in text, maintaining order and removing duplicates
function detectCardsInTextOrdered(text) {
    const lowerText = text.toLowerCase();
    const matches = [];
    const matchedRanges = []; // Track which parts of text we've already matched
    
    // Sort card names by length (longest first) to match "Knight of Cups" before "Cups"
    const sortedCardNames = Object.keys(CARD_MAPPING).sort((a, b) => b.length - a.length);
    
    // Find all matches with their positions
    for (let cardName of sortedCardNames) {
        const regex = new RegExp(`\\b${cardName}(\\s+reversed)?\\b`, 'gi');
        let match;
        
        while ((match = regex.exec(lowerText)) !== null) {
            const start = match.index;
            const end = start + match[0].length;
            const isReversed = match[1] !== undefined;
            
            // Check if this position overlaps with any existing match
            const overlaps = matchedRanges.some(range => 
                (start >= range.start && start < range.end) ||
                (end > range.start && end <= range.end) ||
                (start <= range.start && end >= range.end)
            );
            
            if (!overlaps) {
                matches.push({
                    name: cardName,
                    position: start,
                    filename: CARD_MAPPING[cardName],
                    reversed: isReversed
                });
                matchedRanges.push({ start, end });
            }
        }
    }
    
    // Sort by position (order of appearance)
    matches.sort((a, b) => a.position - b.position);
    
    // Remove any remaining duplicates by filename + reversed state
    const seen = new Set();
    const uniqueMatches = [];
    
    for (let match of matches) {
        const key = `${match.filename}-${match.reversed}`;
        if (!seen.has(key)) {
            uniqueMatches.push({
                name: match.name,
                reversed: match.reversed
            });
            seen.add(key);
        }
    }
    
    return uniqueMatches;
}

// Create card HTML element
function createCardHTML(cardName, filename, isReversed = false) {
    const displayName = cardName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    
    const rotationStyle = isReversed ? 'transform: rotate(180deg);' : '';
    const reversedLabel = isReversed ? ' (Reversed)' : '';
    
    return `
        <div class="tarot-card-container">
            <img src="cards/${filename}" 
                 alt="${displayName}${reversedLabel}" 
                 class="tarot-card-image" 
                 style="${rotationStyle}"
                 onclick="openCardModal('cards/${filename}', '${displayName}${reversedLabel}', ${isReversed})"
                 loading="lazy"
                 onerror="this.style.opacity='0.3'; this.style.border='2px dashed var(--border)';">
            <div class="tarot-card-name">${displayName}${reversedLabel}</div>
        </div>
    `;
}

// Open card in full-size modal
function openCardModal(imagePath, cardName, isReversed = false) {
    const modal = document.getElementById('card-modal');
    const modalImage = document.getElementById('card-modal-image');
    
    modalImage.src = imagePath;
    modalImage.alt = cardName;
    modalImage.style.transform = isReversed ? 'rotate(180deg)' : 'none';
    modal.classList.add('active');
}

// Close card modal
function closeCardModal() {
    const modal = document.getElementById('card-modal');
    modal.classList.remove('active');
}

// Initialize modal close handlers
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('card-modal');
    const closeBtn = modal.querySelector('.card-modal-close');
    
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeCardModal();
    });
    
    modal.addEventListener('click', closeCardModal);
    
    // Prevent closing when clicking the image itself
    const modalImage = document.getElementById('card-modal-image');
    modalImage.addEventListener('click', (e) => {
        e.stopPropagation();
    });
});

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
        downloadFile(content, filename, mimeType, extension);
    } else if (format === 'json') {
        content = generateJSONExport();
        mimeType = 'application/json';
        extension = 'json';
        downloadFile(content, filename, mimeType, extension);
    } else if (format === 'html') {
        content = generateHTMLExport();
        mimeType = 'text/html';
        extension = 'html';
        downloadFile(content, filename, mimeType, extension);
    } else if (format === 'pdf') {
        generatePDFExport(filename);
    }
    
    document.getElementById('export-modal').classList.add('hidden');
}

function downloadFile(content, filename, mimeType, extension) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
}

async function generatePDFExport(filename) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    let yPos = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const maxWidth = 170;
    
    // Helper to add text with word wrap
    const addText = (text, fontSize = 12, isBold = false) => {
        doc.setFontSize(fontSize);
        if (isBold) doc.setFont(undefined, 'bold');
        else doc.setFont(undefined, 'normal');
        
        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach(line => {
            if (yPos > pageHeight - margin) {
                doc.addPage();
                yPos = margin;
            }
            doc.text(line, margin, yPos);
            yPos += fontSize * 0.5;
        });
        yPos += 5;
    };
    
    // Title
    addText('YODO TAROT READING', 18, true);
    addText(`Generated: ${new Date().toLocaleString()}`, 10);
    yPos += 5;
    
    // Question
    addText('QUESTION:', 14, true);
    addText(state.userQuestion);
    
    // Reading
    addText('READING:', 14, true);
    const readingText = state.readingContent.replace(/---SEPARATOR---/g, '\n--- Continued Exploration ---\n');
    addText(readingText);
    
    // Cycles
    if (state.cycles.length > 0) {
        doc.addPage();
        yPos = margin;
        addText('RHIZOMATIC ANALYSIS', 16, true);
        
        state.cycles.forEach((cycle, idx) => {
            addText(`Cycle ${idx + 1}: ${cycle.nodeCount} nodes, ${cycle.edgeCount} connections`, 12, true);
            addText(cycle.insights);
        });
    }
    
    // Synthesis
    if (state.synthesis) {
        doc.addPage();
        yPos = margin;
        addText('SYNTHESIS:', 14, true);
        addText(state.synthesis);
    }
    
    doc.save(`${filename}.pdf`);
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
