# Escalation Advisor

> Should you handle it yourself, escalate to your manager, or go higher? Get a clear recommendation in under 60 seconds.

A lightweight AI-powered tool that helps team members make better escalation decisions — and helps managers codify what "escalation-worthy" actually means for their team.

**[Try the live demo →](https://escalation-advisor-public.vercel.app)**

---

## Two versions

This repo has two branches:

| Branch | For | API key |
|--------|-----|---------|
| `main` | Fork this to deploy your own private copy | Set as environment variable in Vercel |
| `byok` | The live demo — try it before you deploy | Users paste their own key at runtime |

---

## Deploy your own copy in 5 minutes

### 1. Fork this repo

Click **Fork** in the top right on GitHub.

### 2. Get an Anthropic API key

Sign up at [console.anthropic.com](https://console.anthropic.com) and create an API key.

### 3. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → import your forked repo
2. Add environment variable: `ANTHROPIC_API_KEY` = your key
3. Click Deploy

You'll get a URL like `your-app.vercel.app` in about 2 minutes.

---

## How it works

You describe a situation in plain text, optionally tag four factors, and the tool returns one of three verdicts:

- **Handle yourself** — you have the authority and the stakes are manageable
- **Escalate to your manager** — the situation crosses a risk or authority threshold your manager needs to know about
- **Escalate higher** — cross-org impact, political sensitivity, irreversible consequences, or your manager is part of the issue

When escalation is recommended, it also generates a ready-to-send escalation brief.

---

## Example output

**Situation:** My vendor hasn't responded in 3 days and the deadline is Friday. I've emailed twice and called once. The contract is worth $40K.

**Verdict: Escalate to your manager**
> Deadline risk with external dependency exceeds your authority to resolve alone.

**Reasoning:** The combination of a hard external deadline, significant contract value, and an unresponsive vendor means this has moved beyond what you can resolve independently. Your manager needs visibility now — both to potentially apply pressure through their own network and to be aware if Friday slips.

**Key factors:** Hard deadline Friday · $40K contract · Unresponsive vendor · 3 days no response

**Escalation brief:**
> Hi [manager] — flagging a vendor situation that needs your awareness. [Vendor] hasn't responded to two emails and a call over three days, and their deliverable is blocking us from hitting Friday's deadline. The contract is $40K. I've exhausted my direct options. Would appreciate either a nudge from your end or guidance on how to proceed if they don't respond by EOD tomorrow.

---

## Customising the framework

The decision logic lives in one place: `src/app/api/analyze/route.ts`.

### Change the verdict criteria

Find the `Rules for verdict` section in the prompt and edit it to reflect your team's actual thresholds:

```
Rules for verdict:
- handle_yourself: person has authority, stakes are manageable...
- escalate_to_manager: situation crosses authority or risk threshold...
- escalate_higher: involves political sensitivity, cross-org impact...
```

### Add your team's specific context

Prepend a context block to the prompt so the model understands your org:

```ts
const TEAM_CONTEXT = `
This team is a 12-person product org. The manager wants to be looped in on:
- Anything involving external partners or clients
- Budget decisions over $5K
- Anything that will miss a committed deadline
- Any HR-adjacent issues

The manager does NOT need to know about: internal process decisions,
minor timeline slips under 2 days, routine vendor check-ins.
`
```

### Change or add factors

The four default factors (urgency, impact, reversibility, stakeholder visibility) are defined in `src/app/page.tsx` in the `FACTORS` array:

```ts
const FACTORS = [
  { key: 'urgency', label: 'Urgency', options: [
    { val: 'low', label: 'Low' },
    { val: 'medium', label: 'Medium' },
    { val: 'high', label: 'High' },
  ]},
  // Add your own here
]
```

---

## Running locally

```bash
git clone https://github.com/kaitwaite/escalation-advisor
cd escalation-advisor
npm install
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Stack

- **Next.js 15** (App Router)
- **Anthropic API** (`claude-sonnet-4`)
- No database, no auth, no external dependencies beyond the API

---

## Background

Most teams have no shared mental model for what "escalation-worthy" actually means. This creates either over-escalation (people checking in on things they should own) or under-escalation (things blowing up because someone didn't want to bother anyone). This tool codifies the decision framework, removes the ambiguity, and removes the anxiety.

Done feels like: a team member uses this before pinging their manager and either realises they can handle it themselves, or shows up to the escalation with a fully formed brief.

---

## License

MIT — fork it, adapt it, make it yours.
