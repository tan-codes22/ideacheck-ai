# 💡 IdeaCheck — AI Startup Idea Validator

> Stress-test your startup idea like an investor would — built for the Building AI Application Challenge 2026

## What it does

IdeaCheck is a two-phase AI-powered web app:
1. **Intake phase** — GPT-4o asks 4 targeted clarifying questions to understand your idea deeply
2. **Scoring phase** — Delivers a structured scorecard across 5 dimensions, each scored out of 10

### Scorecard dimensions
- 📈 Market Opportunity
- ⚔️ Competitive Landscape
- 🔧 Technical Feasibility
- ⚠️ Risk Profile
- 💰 Monetisation Potential

## Tech stack

- **Frontend:** Plain HTML, CSS, JavaScript (no frameworks)
- **AI:** OpenAI API (GPT-4o)
- **Deployment:** GitHub Pages

## Setup

### 1. Clone the repo
```bash
git clone https://github.com/tan-codes22/ideacheck-ai.git
cd ideacheck-ai
```

### 2. Add your API key
Create a `config.js` file in the root folder:
```javascript
window.OPENAI_API_KEY = 'your-openai-api-key-here';
```
⚠️ This file is in `.gitignore` — it will never be pushed to GitHub.

### 3. Run locally
Just open `index.html` in your browser — no server needed!

Or use Live Server in VS Code for a better dev experience.

## Deployment (GitHub Pages)

1. Push code to GitHub (config.js is excluded automatically)
2. Go to repo Settings → Pages
3. Set source to `main` branch, `/ (root)`
4. Your app will be live at `https://tan-codes22.github.io/ideacheck-ai`

## Project structure

```
ideacheck-ai/
├── index.html       # Main app shell
├── style.css        # All styles
├── src/
│   └── app.js       # App logic + OpenAI API calls
├── config.js        # ⚠️ API key (gitignored, create manually)
├── .gitignore
└── README.md
```

## Built by
Tanisha Gotadke — Building AI Application Challenge 2026
