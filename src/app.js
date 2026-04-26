// IdeaCheck â€” AI Startup Idea Validator
// Uses OpenAI API (GPT-4o) with two-phase conversation flow

const OPENAI_API_KEY = window.OPENAI_API_KEY || '';

// â”€â”€â”€ State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let conversationHistory = [];
let phase = 'intake'; // 'intake' | 'scoring'
let questionCount = 0;
const MAX_QUESTIONS = 4;

// â”€â”€â”€ DOM refs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const introScreen = document.getElementById('intro-screen');
const chatScreen  = document.getElementById('chat-screen');
const scoreScreen = document.getElementById('score-screen');
const messagesEl  = document.getElementById('messages');
const userInput   = document.getElementById('user-input');
const sendBtn     = document.getElementById('send-btn');

// â”€â”€â”€ System prompts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const INTAKE_SYSTEM = `You are IdeaCheck, a sharp but constructive startup analyst. 
Your job is to understand a founder's startup idea deeply before evaluating it.

PHASE: INTAKE (clarifying questions only)

Rules:
- Ask ONE clarifying question at a time â€” no more.
- Ask about: target customer, revenue model, key competitors, unfair advantage, biggest risk.
- Keep questions short and conversational.
- Do NOT give any evaluation or scores yet.
- After ${MAX_QUESTIONS} questions, say EXACTLY this and nothing else: "READY_TO_SCORE"
- Be warm but direct. No fluff.`;

const SCORING_SYSTEM = `You are IdeaCheck, a rigorous startup analyst. 
Based on the conversation, produce a startup idea scorecard.

Return ONLY a valid JSON object â€” no markdown, no explanation, just raw JSON:

{
  "overall": <number 1-10>,
  "verdict": "<one punchy sentence verdict>",
  "dimensions": [
    {
      "name": "Market Opportunity",
      "score": <1-10>,
      "rationale": "<2 sentences max>"
    },
    {
      "name": "Competitive Landscape", 
      "score": <1-10>,
      "rationale": "<2 sentences max>"
    },
    {
      "name": "Technical Feasibility",
      "score": <1-10>,
      "rationale": "<2 sentences max>"
    },
    {
      "name": "Risk Profile",
      "score": <1-10>,
      "rationale": "<2 sentences max>"
    },
    {
      "name": "Monetisation Potential",
      "score": <1-10>,
      "rationale": "<2 sentences max>"
    }
  ],
  "pivot": "<if overall < 6, suggest a specific pivot in 2 sentences. Otherwise return empty string>"
}`;

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function showScreen(screen) {
  [introScreen, chatScreen, scoreScreen].forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  screen.classList.add('active');
  screen.style.display = 'flex';
}

function addMessage(role, text) {
  const msg = document.createElement('div');
  msg.className = `message ${role}`;
  const avatar = role === 'ai' ? 'ðŸ’¡' : 'ðŸ‘¤';
  msg.innerHTML = `
    <div class="avatar">${avatar}</div>
    <div class="bubble">${text.replace(/\n/g, '<br>')}</div>
  `;
  messagesEl.appendChild(msg);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function showTyping() {
  const typing = document.createElement('div');
  typing.className = 'message ai';
  typing.id = 'typing-indicator';
  typing.innerHTML = `
    <div class="avatar">ðŸ’¡</div>
    <div class="bubble typing">
      <div class="dot"></div><div class="dot"></div><div class="dot"></div>
    </div>
  `;
  messagesEl.appendChild(typing);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById('typing-indicator');
  if (t) t.remove();
}

function setLoading(loading) {
  sendBtn.disabled = loading;
  userInput.disabled = loading;
  sendBtn.textContent = loading ? '...' : 'Send';
}

// â”€â”€â”€ API call â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function callOpenAI(systemPrompt, messages, jsonMode = false) {
  const body = {
    model: 'gpt-4o',
    max_tokens: 1000,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ]
  };

  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'API error');
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

// â”€â”€â”€ Score rendering â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getScoreColor(score) {
  if (score >= 7) return 'high';
  if (score >= 5) return 'mid';
  return 'low';
}

function getScoreHex(score) {
  if (score >= 7) return '#4ade80';
  if (score >= 5) return '#facc15';
  return '#f87171';
}

function renderScorecard(data) {
  // Overall
  const overallEl = document.getElementById('overall-score');
  const color = getScoreHex(data.overall);
  overallEl.innerHTML = `
    <div class="score-circle" style="border-color: ${color}">
      <span class="score-number score-${getScoreColor(data.overall)}">${data.overall}/10</span>
    </div>
    <div class="verdict">${data.verdict}</div>
  `;

  // Dimensions
  const dimsEl = document.getElementById('dimensions');
  dimsEl.innerHTML = data.dimensions.map(dim => `
    <div class="dim-card">
      <div class="dim-header">
        <span class="dim-name">${dim.name}</span>
        <span class="dim-score score-${getScoreColor(dim.score)}">${dim.score}/10</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${dim.score * 10}%; background: ${getScoreHex(dim.score)}"></div>
      </div>
      <div class="dim-rationale">${dim.rationale}</div>
    </div>
  `).join('');

  // Pivot
  const pivotEl = document.getElementById('pivot-section');
  if (data.pivot) {
    pivotEl.style.display = 'block';
    pivotEl.innerHTML = `
      <h3>ðŸ’¡ Suggested Pivot</h3>
      <p>${data.pivot}</p>
    `;
  }

  showScreen(scoreScreen);
}

// â”€â”€â”€ Generate scorecard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function generateScorecard() {
  showTyping();
  setLoading(true);

  try {
    const raw = await callOpenAI(SCORING_SYSTEM, conversationHistory, true);
    removeTyping();
    const data = JSON.parse(raw);
    renderScorecard(data);
  } catch (e) {
    removeTyping();
    addMessage('ai', `Sorry, something went wrong generating your scorecard: ${e.message}. Please check your API key and try again.`);
  } finally {
    setLoading(false);
  }
}

// â”€â”€â”€ Send message â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage('user', text);
  conversationHistory.push({ role: 'user', content: text });
  userInput.value = '';
  setLoading(true);
  showTyping();

  try {
    const reply = await callOpenAI(INTAKE_SYSTEM, conversationHistory);
    removeTyping();

    if (reply.includes('READY_TO_SCORE')) {
      addMessage('ai', "Perfect â€” I have everything I need. Generating your scorecard now...");
      conversationHistory.push({ role: 'assistant', content: reply });
      await generateScorecard();
    } else {
      addMessage('ai', reply);
      conversationHistory.push({ role: 'assistant', content: reply });
      questionCount++;
    }
  } catch (e) {
    removeTyping();
    addMessage('ai', `Error: ${e.message}. Please check your API key in config.js.`);
  } finally {
    setLoading(false);
  }
}

// â”€â”€â”€ Start chat â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function startChat() {
  showScreen(chatScreen);
  conversationHistory = [];
  questionCount = 0;
  phase = 'intake';
  messagesEl.innerHTML = '';

  const opening = "Hey! Tell me about your startup idea â€” what problem does it solve and for who? Don't worry about perfection, just describe it naturally.";
  addMessage('ai', opening);
  conversationHistory.push({ role: 'assistant', content: opening });
}

// â”€â”€â”€ Copy report â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function copyReport() {
  const dims = document.querySelectorAll('.dim-card');
  let report = '=== IdeaCheck Startup Scorecard ===\n\n';
  report += document.querySelector('.verdict').textContent + '\n\n';
  dims.forEach(d => {
    const name = d.querySelector('.dim-name').textContent;
    const score = d.querySelector('.dim-score').textContent;
    const rationale = d.querySelector('.dim-rationale').textContent;
    report += `${name}: ${score}\n${rationale}\n\n`;
  });
  const pivot = document.querySelector('.pivot-section p');
  if (pivot) report += `Suggested Pivot:\n${pivot.textContent}`;

  navigator.clipboard.writeText(report).then(() => {
    const btn = document.getElementById('copy-btn');
    btn.textContent = 'âœ“ Copied!';
    setTimeout(() => btn.textContent = 'Copy Report', 2000);
  });
}

// â”€â”€â”€ Event listeners â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
document.getElementById('start-btn').addEventListener('click', startChat);
document.getElementById('restart-btn').addEventListener('click', () => showScreen(introScreen));
document.getElementById('copy-btn').addEventListener('click', copyReport);

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Init
showScreen(introScreen);


