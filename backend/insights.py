"""
Uses Claude to transform raw statistical findings into actionable
product insights that PMs and UX designers can immediately use.
"""

from __future__ import annotations

import json
import os
import httpx

CLAUDE_MODEL = "claude-sonnet-4-20250514"
CLAUDE_MODEL_FALLBACK = "claude-3-5-sonnet-20241022"
API_URL = "https://api.anthropic.com/v1/messages"


def generate_ai_insights(summary: dict, test_results: list, descriptives: dict, dataset_info: dict) -> dict | None:
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        print("AI insights skipped: ANTHROPIC_API_KEY not set")
        return None

    key_findings = summary.get("key_findings", [])
    recommendations = summary.get("recommendations", [])

    significant_tests = [r for r in test_results if r.get("significant") == "Yes"]
    not_significant_tests = [r for r in test_results if r.get("significant") == "No"]

    prompt = f"""You are a senior UX researcher translating statistical analysis results into clear, actionable insights for product managers and UX designers. They do not have a statistics background.

Here is the analysis of a UX research dataset:

**Dataset:** {dataset_info.get('rows', '?')} participants, {dataset_info.get('columns', '?')} variables measured
**Columns:** {', '.join(dataset_info.get('column_names', []))}

**{len(significant_tests)} Significant Findings:**
{json.dumps([{'test': r['test'], 'insight': r['insight'], 'effect_label': r.get('effect_label', ''), 'p_value': r.get('p_value')} for r in significant_tests], indent=2)}

**{len(not_significant_tests)} Non-Significant Results:**
{json.dumps([{'test': r['test'], 'insight': r['insight']} for r in not_significant_tests], indent=2)}

**Descriptive Statistics (summary):**
{json.dumps({k: {kk: vv for kk, vv in v.items() if kk != 'distribution'} for k, v in list(descriptives.items())[:10]}, indent=2)}

Based on this data, provide your analysis in EXACTLY this JSON format (no markdown, no code fences, just raw JSON):

{{
  "headline": "A single sentence summarizing the most important finding in plain language (e.g. 'Mobile users struggle significantly more than desktop users to complete tasks')",
  "executive_summary": "2-3 sentences a PM can paste into a stakeholder update. No jargon. Focus on the user impact and business implications.",
  "insights": [
    {{
      "title": "Short insight title (e.g. 'Mobile Experience Needs Urgent Attention')",
      "finding": "What the data shows in plain language — no p-values or test names",
      "impact": "Why this matters for the product and users",
      "recommendation": "A specific, actionable next step the team can take"
    }}
  ],
  "what_the_data_doesnt_tell_us": "1-2 sentences about limitations — what questions remain unanswered that might need qualitative research"
}}

Rules:
- Write for a product manager, not a statistician
- Never mention test names (Mann-Whitney, Kruskal-Wallis, etc.) — translate everything into plain language
- Focus on user behavior and product implications
- Keep each insight concise — 1-2 sentences per field
- Include 2-5 insights, prioritized by impact
- If there are no significant findings, say so clearly and suggest what to explore next
"""

    for model in [CLAUDE_MODEL, CLAUDE_MODEL_FALLBACK]:
        try:
            print(f"Requesting AI insights using {model}...")
            response = httpx.post(
                API_URL,
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": model,
                    "max_tokens": 1500,
                    "messages": [{"role": "user", "content": prompt}],
                },
                timeout=30.0,
            )

            if response.status_code != 200:
                print(f"Claude API error with {model}: {response.status_code} {response.text[:300]}")
                continue

            data = response.json()
            text = data["content"][0]["text"].strip()

            if text.startswith("```"):
                text = text.split("\n", 1)[1]
                text = text.rsplit("```", 1)[0]

            result = json.loads(text)
            print(f"AI insights generated successfully using {model}")
            return result

        except Exception as e:
            print(f"AI insights generation failed with {model}: {e}")
            continue

    return None
