# Multi-Agent Sports Betting System

## Overview
A Python-based Multi-Agent System following the **Blackboard Design Pattern**. It uses four specialized AI agents to analyze sports matches and provide a betting recommendation.

## Architecture
- **Blackboard**: Shared JSON state manager.
- **Orchestrator**: Coordinates the agent execution.
- **Agents**:
    1. **Vision Scraper**: Extracts data from images (Gemini).
    2. **Fact Checker**: Verifies objective data (Perplexity).
    3. **Insider Detective**: Finds subjective "soft" intel (Grok).
    4. **Strategist**: Synthesizes data for a final decision (OpenAI GPT-5.2).

## Blackboard JSON Structure
The shared state (`blackboard._state`) evolves as agents write to it. Here is the final schema:

```json
{
    "MATCH_DATA": {
        "team_1": "String",
        "team_2": "String",
        "tournament": "String",
        "date": "YYYY-MM-DD",
        "odds": {
            "Team1": Float,
            "Draw": Float,
            "Team2": Float
        }
    },
    "FACT_REPORT": {
        "injuries": { "Team": ["List of players"] },
        "form_last_5": { "Team": "W-L-D..." },
        "weather": "String",
        "head_to_head": "String"
    },
    "INSIDER_INTEL": {
        "psychological_flags": [
            { "player": "String", "issue": "String", "severity": "LOW|MEDIUM|HIGH" }
        ],
        "discipline": [],
        "locker_room": [],
        "eye_test": []
    },
    "STRATEGY_REPORT": {
        "recommendation": "String",
        "confidence_score": Integer (0-100),
        "ev_analysis": "String",
        "reasoning": "String"
    }
}
```

## Usage
Run the main orchestrator:
```bash
python orchestrator.py
```
