'use client'
import { useState } from 'react'
import styles from './page.module.css'

const EXAMPLES = [
  { text: "My vendor hasn't responded in 3 days and the deadline is this Friday. I've emailed twice and left a voicemail. The deliverable is worth $40K and other work is blocked on it.", urgency: 'high', impact: 'significant', reversibility: 'hard', visibility: 'internal' },
  { text: "A key client keeps adding new requirements after the scope was agreed. The project is now 30% over the original estimate. I've pushed back once but they're getting frustrated.", urgency: 'medium', impact: 'significant', reversibility: 'reversible', visibility: 'external' },
  { text: "Two team members aren't communicating and it's slowing down a shared workstream. I've tried facilitating but it hasn't improved over two weeks.", urgency: 'medium', impact: 'significant', reversibility: 'reversible', visibility: 'internal' },
  { text: "A production bug is causing checkout failures for roughly 5% of users. The on-call engineer is working on it but it's been 90 minutes with no fix yet.", urgency: 'high', impact: 'critical', reversibility: 'reversible', visibility: 'external' },
  { text: "I just found out our project is $15K over the approved budget. It happened because of three unexpected costs over the past month that I individually judged as minor.", urgency: 'high', impact: 'critical', reversibility: 'irreversible', visibility: 'leadership' },
]

const FACTORS: { key: string; label: string; options: { val: string; label: string }[] }[] = [
  { key: 'urgency', label: 'Urgency', options: [{ val: 'low', label: 'Low' }, { val: 'medium', label: 'Medium' }, { val: 'high', label: 'High' }] },
  { key: 'impact', label: 'Impact if wrong', options: [{ val: 'minor', label: 'Minor' }, { val: 'significant', label: 'Significant' }, { val: 'critical', label: 'Critical' }] },
  { key: 'reversibility', label: 'Reversibility', options: [{ val: 'reversible', label: 'Reversible' }, { val: 'hard', label: 'Hard to undo' }, { val: 'irreversible', label: 'Irreversible' }] },
  { key: 'visibility', label: 'Stakeholder visibility', options: [{ val: 'internal', label: 'Internal only' }, { val: 'leadership', label: 'Leadership' }, { val: 'external', label: 'External' }] },
]

type Verdict = 'handle_yourself' | 'escalate_to_manager' | 'escalate_higher'

interface Result {
  verdict: Verdict
  verdict_summary: string
  reasoning: string
  key_factors: string[]
  needs_brief: boolean
  brief?: string
}

const VERDICT_CONFIG: Record<Verdict, { label: string; className: string }> = {
  handle_yourself:     { label: 'Handle yourself',     className: styles.verdictHandle },
  escalate_to_manager: { label: 'Escalate to manager', className: styles.verdictDirect },
  escalate_higher:     { label: 'Escalate higher',     className: styles.verdictSkip },
}

function GateScreen({ onUnlock }: { onUnlock: (key: string) => void }) {
  const [keyInput, setKeyInput] = useState('')
  const [keyVisible, setKeyVisible] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!keyInput.trim()) { setError('Please enter your API key.'); return }
    if (!keyInput.trim().startsWith('sk-ant-')) {
      setError("That doesn't look like a valid Anthropic key — it should start with sk-ant-")
      return
    }
    setLoading(true)
    setError('')
    await new Promise(r => setTimeout(r, 400))
    setLoading(false)
    onUnlock(keyInput.trim())
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className={styles.gate}>
      <div className={styles.gateGlowTop} />
      <div className={styles.gateGlowBottom} />
      <div className={styles.gateInner}>
        <div className={styles.gateEyebrow}>
          <div className={styles.gateEyebrowRule} />
          <span className={styles.gateEyebrowText}>A Kate Haan Tool</span>
        </div>
        <h1 className={styles.gateTitle}>
          <span className={styles.gateTitlePlain}>Escalate smart.</span>
          <span className={styles.gateTitleItalic}>Decide with clarity.</span>
        </h1>
        <p className={styles.gateSubtitle}>
          Describe what&apos;s happening. Get a clear recommendation — handle it yourself,
          escalate to your manager, or go higher — with reasoning.
          <br /><br />
          Bring your own Anthropic API key. It&apos;s sent directly to the API and never stored.
        </p>

        <div className={styles.gateField}>
          <label className={styles.gateInputLabel} htmlFor="gate-key">
            Anthropic API Key
          </label>
          <div className={styles.gateInputRow}>
            <input
              id="gate-key"
              className={styles.gateInput}
              type={keyVisible ? 'text' : 'password'}
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="sk-ant-..."
              spellCheck={false}
              autoComplete="off"
              autoFocus
            />
            <button className={styles.gateToggle} onClick={() => setKeyVisible(v => !v)} type="button">
              {keyVisible ? 'Hide' : 'Show'}
            </button>
          </div>
          {error && <div className={styles.gateError}>{error}</div>}
        </div>

        <button
          className={styles.gateBtn}
          onClick={handleSubmit}
          disabled={!keyInput.trim() || loading}
        >
          {loading ? 'One moment…' : 'Continue →'}
        </button>

        <a
          href="https://console.anthropic.com/settings/keys"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.gateFootnote}
        >
          Get a key at console.anthropic.com →
        </a>
      </div>

      <div className={styles.gateFooter}>
        <span className={styles.gateFooterLeft}>A Kate Haan tool</span>
        <span className={styles.gateFooterRight}>Built with Claude · GitHub</span>
      </div>
    </div>
  )
}

export default function Home() {
  const [apiKey, setApiKey] = useState('')
  const [situation, setSituation] = useState('')
  const [factors, setFactors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  if (!apiKey) {
    return <GateScreen onUnlock={setApiKey} />
  }

  function selectFactor(key: string, val: string) {
    setFactors(f => ({ ...f, [key]: f[key] === val ? '' : val }))
  }

  function loadExample(i: number) {
    const ex = EXAMPLES[i]
    setSituation(ex.text)
    setFactors({ urgency: ex.urgency, impact: ex.impact, reversibility: ex.reversibility, visibility: ex.visibility })
    setResult(null)
    setError('')
  }

  function reset() {
    setSituation('')
    setFactors({})
    setResult(null)
    setError('')
  }

  async function analyze() {
    if (!situation.trim()) { setError('Please describe the situation first.'); return }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation, factors, apiKey }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'API error')
      }
      const data = await res.json()
      setResult(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function copyBrief() {
    if (result?.brief) {
      navigator.clipboard.writeText(result.brief)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>

        <div className={styles.header}>
          <div className={styles.eyebrow}>Escalation Advisor</div>
          <h1 className={styles.title}>Should you escalate, <em>or handle it?</em></h1>
          <p className={styles.subtitle}>
            Describe what&apos;s happening. Get a clear recommendation — handle it yourself,
            escalate to your manager, or go higher — with reasoning.
          </p>
        </div>

        <div className={styles.inputBlock}>
          <label className={styles.inputLabel} htmlFor="situation">
            What&apos;s the situation?
          </label>
          <textarea
            id="situation"
            className={styles.textarea}
            value={situation}
            onChange={e => setSituation(e.target.value)}
            placeholder="e.g. My vendor hasn't responded in 3 days and our deadline is Friday. I've emailed twice and called once. The contract is worth $40K."
            rows={5}
          />
        </div>

        <div className={styles.factorsGrid}>
          {FACTORS.map(f => (
            <div key={f.key} className={styles.factorCard}>
              <div className={styles.factorName}>{f.label}</div>
              <div className={styles.factorOptions}>
                {f.options.map(o => (
                  <button
                    key={o.val}
                    className={`${styles.chip} ${factors[f.key] === o.val ? styles.chipSelected : ''}`}
                    onClick={() => selectFactor(f.key, o.val)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.btnRow}>
          <button className={styles.btnPrimary} onClick={analyze} disabled={loading}>
            {loading ? 'Analyzing…' : 'Analyze situation →'}
          </button>
          <button className={styles.btnGhost} onClick={reset}>Clear</button>
          <button className={styles.btnGhost} onClick={() => setApiKey('')}>Change key</button>
        </div>

        {error && <div className={styles.errorMsg}>{error}</div>}

        {loading && (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <span>Analyzing your situation…</span>
          </div>
        )}

        {result && (() => {
          const vc = VERDICT_CONFIG[result.verdict]
          return (
            <div className={styles.resultPanel}>
              <div className={`${styles.verdictBar} ${vc.className}`}>
                <div className={styles.verdictDot} />
                <div>
                  <div className={styles.verdictLabel}>{vc.label}</div>
                  <div className={styles.verdictDesc}>{result.verdict_summary}</div>
                </div>
              </div>
              <div className={styles.resultBody}>
                <div className={styles.sectionTitle}>Reasoning</div>
                <p className={styles.resultText}>{result.reasoning}</p>

                {result.key_factors?.length > 0 && (
                  <>
                    <div className={styles.sectionTitle}>Key factors</div>
                    <div className={styles.factorPills}>
                      {result.key_factors.map((f, i) => (
                        <span key={i} className={styles.factorPill}>{f}</span>
                      ))}
                    </div>
                  </>
                )}

                {result.needs_brief && result.brief && (
                  <>
                    <div className={styles.sectionTitleRow}>
                      <div className={styles.sectionTitle}>Escalation brief</div>
                      <button className={styles.copyBtn} onClick={copyBrief}>
                        {copied ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className={styles.briefBox}>{result.brief}</div>
                  </>
                )}
              </div>
            </div>
          )
        })()}

        <div className={styles.examplesSection}>
          <div className={styles.examplesTitle}>Try an example</div>
          <div className={styles.exampleChips}>
            {EXAMPLES.map((ex, i) => (
              <button key={i} className={styles.exampleChip} onClick={() => loadExample(i)}>
                {ex.text.split('.')[0]}
              </button>
            ))}
          </div>
        </div>

        <footer className={styles.footer}>
          <span className={styles.footerSig}>A Kate Haan tool</span>
          <span>
            Built with Claude ·{' '}
            <a
              href="https://github.com/kaitwaite/escalation-advisor-public"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </span>
        </footer>

      </div>
    </main>
  )
}
