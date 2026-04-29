import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { situation, factors, apiKey } = await req.json()

  if (!situation?.trim()) {
    return NextResponse.json({ error: 'Situation is required' }, { status: 400 })
  }

  if (!apiKey?.trim()) {
    return NextResponse.json({ error: 'An Anthropic API key is required.' }, { status: 401 })
  }

  const factorLines = Object.entries(factors as Record<string, string>)
    .filter(([, v]) => v)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n')

  const prompt = `You are an expert at workplace escalation decisions. A team member has described a situation and you must make a clear, direct recommendation.

SITUATION:
${situation}

${factorLines ? 'SELECTED FACTORS:\n' + factorLines : ''}

Return ONLY valid JSON with this exact structure (no markdown fences, no extra text):
{
  "verdict": "handle_yourself" | "escalate_to_manager" | "escalate_higher",
  "verdict_summary": "one punchy sentence, 10 words max",
  "reasoning": "2-4 sentences explaining the decision concisely",
  "key_factors": ["3-5 short factor strings, each under 6 words"],
  "needs_brief": true | false,
  "brief": "only if needs_brief is true: a ready-to-send escalation message in plain text, 3-5 sentences, from the team member to their manager or skip-level, specific to the situation"
}

Rules for verdict:
- handle_yourself: person has authority, stakes are manageable, no need for manager awareness yet
- escalate_to_manager: situation crosses authority or risk threshold, direct manager needs to know and may need to act
- escalate_higher: situation involves political sensitivity, cross-org impact, irreversible consequences, or the manager themselves are part of the issue`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey.trim(),
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    return NextResponse.json({ error: `Anthropic API error: ${err}` }, { status: 500 })
  }

  const data = await response.json()
  const text = data.content?.find((b: { type: string }) => b.type === 'text')?.text ?? ''
  const clean = text.replace(/```json|```/g, '').trim()
  const result = JSON.parse(clean)

  return NextResponse.json(result)
}
