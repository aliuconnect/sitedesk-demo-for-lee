import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  Bot,
  Calendar,
  Check,
  Clock,
  Copy,
  FileText,
  MapPin,
  Phone,
  Search,
  Send,
  Sparkles,
  ArrowLeft,
  Moon,
  Wallet,
} from 'lucide-react'
import {
  aiHandling,
  enquiries as seedEnquiries,
  leadSummary,
  needsOwner,
  qualificationProgress,
} from './data'
import type { Channel, Enquiry, NextStep } from './data'

type Focus = 'needs' | 'ai' | 'all'
type AiSettings = { autoReply: boolean; qualify: boolean; alertHot: boolean }

function channelLabel(channel: Channel) {
  if (channel === 'whatsapp') return 'WhatsApp'
  if (channel === 'email') return 'Email'
  return 'Website'
}

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function sortEnquiries(list: Enquiry[]) {
  return [...list].sort((a, b) => {
    const aNeed = needsOwner(a) ? 0 : a.status === 'done' ? 2 : 1
    const bNeed = needsOwner(b) ? 0 : b.status === 'done' ? 2 : 1
    if (aNeed !== bNeed) return aNeed - bNeed
    return (b.score ?? 0) - (a.score ?? 0)
  })
}

export default function App() {
  const [items, setItems] = useState(seedEnquiries)
  const [activeId, setActiveId] = useState(
    () => sortEnquiries(seedEnquiries).find((e) => needsOwner(e))?.id ?? seedEnquiries[0].id,
  )
  const [showChat, setShowChat] = useState(false)
  const [draft, setDraft] = useState('')
  const [focus, setFocus] = useState<Focus>('needs')
  const [query, setQuery] = useState('')
  const [ai, setAi] = useState<AiSettings>({
    autoReply: true,
    qualify: true,
    alertHot: true,
  })
  const [toast, setToast] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const streamRef = useRef<HTMLDivElement>(null)

  const active = items.find((e) => e.id === activeId) ?? items[0]

  const counts = useMemo(
    () => ({
      needs: items.filter(needsOwner).length,
      ai: items.filter(aiHandling).length,
      all: items.filter((e) => e.status !== 'done').length,
    }),
    [items],
  )

  const visible = useMemo(() => {
    let list = items.filter((e) => {
      if (focus === 'needs') return needsOwner(e)
      if (focus === 'ai') return aiHandling(e)
      return e.status !== 'done'
    })
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.preview.toLowerCase().includes(q) ||
          e.location?.toLowerCase().includes(q) ||
          e.projectType?.toLowerCase().includes(q),
      )
    }
    return sortEnquiries(list)
  }, [items, focus, query])

  useEffect(() => {
    if (!visible.find((e) => e.id === activeId) && visible[0]) {
      setActiveId(visible[0].id)
    }
  }, [visible, activeId])

  useEffect(() => {
    streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight, behavior: 'smooth' })
  }, [active.id, active.messages.length])

  useEffect(() => {
    if (!ai.alertHot) return
    const hot = items.find((e) => e.status === 'qualified' && e.unread)
    if (!hot) return
    setToast(`${hot.name} is ready — ${leadSummary(hot)}`)
    const t = window.setTimeout(() => setToast(null), 4200)
    return () => window.clearTimeout(t)
  }, []) // show once on load for demo polish

  const flash = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2800)
  }

  const patch = (id: string, update: Partial<Enquiry>) => {
    setItems((prev) => prev.map((e) => (e.id === id ? { ...e, ...update } : e)))
  }

  const appendMessage = (id: string, from: 'owner' | 'ai', text: string) => {
    setItems((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              messages: [...e.messages, { id: `m-${Date.now()}`, from, text, time: nowTime() }],
              preview: text.slice(0, 60),
              time: 'now',
            }
          : e,
      ),
    )
  }

  const openThread = (id: string) => {
    setActiveId(id)
    setShowChat(true)
    patch(id, { unread: false })
  }

  const sendOwnerNote = (e: FormEvent) => {
    e.preventDefault()
    if (!draft.trim()) return
    appendMessage(active.id, 'owner', draft.trim())
    setDraft('')
  }

  const useSuggestion = () => {
    if (!active.suggestedReply) return
    appendMessage(active.id, 'owner', active.suggestedReply)
    patch(active.id, {
      suggestedReply: undefined,
      nextStep: active.nextStep === 'none' ? 'call' : active.nextStep,
      status: active.status === 'qualifying' || active.status === 'new' ? 'sent' : active.status,
    })
    flash('Reply sent — you’re in control of this chat')
  }

  const setNext = (step: NextStep) => {
    patch(active.id, {
      nextStep: step,
      status: step === 'done' ? 'done' : step === 'none' ? active.status : 'sent',
      snoozed: false,
    })
    if (step === 'done') flash('Marked done — cleared from Needs you')
    else if (step === 'call') flash('Next step: call them')
    else if (step === 'visit') flash('Next step: site visit')
    else if (step === 'quote') flash('Next step: send quote')
  }

  const snooze = () => {
    patch(active.id, { snoozed: true, nextStep: 'none' })
    flash('Snoozed until you’re off-site')
    if (focus === 'needs') {
      const next = visible.find((e) => e.id !== active.id)
      if (next) setActiveId(next.id)
    }
  }

  const copyBrief = async () => {
    const q = qualificationProgress(active)
    const brief = [
      `${active.name}${active.phone ? ` · ${active.phone}` : ''}`,
      leadSummary(active),
      `Planning: ${active.planning ?? '—'} · Timeline: ${active.timeline ?? '—'}`,
      `Fit ${active.score ?? '—'} · Qualified ${q.filled}/${q.total}`,
      `Via ${channelLabel(active.channel)}`,
    ].join('\n')
    try {
      await navigator.clipboard.writeText(brief)
      setCopied(true)
      flash('Brief copied — paste into WhatsApp or notes')
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      flash('Couldn’t copy — select the brief manually')
    }
  }

  const progress = qualificationProgress(active)
  const summary = leadSummary(active)

  return (
    <div className="inbox-app">
      <div className="inbox-ambient" aria-hidden />

      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            role="status"
          >
            <Bell size={14} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="inbox-bar">
        <div className="inbox-bar-brand">
          <span className="brand-mark" aria-hidden>
            <Sparkles size={15} />
          </span>
          <span className="brand-name">Enquiries</span>
        </div>

        <div className="focus-seg" role="tablist" aria-label="Focus">
          {(
            [
              ['needs', 'Needs you', counts.needs],
              ['ai', 'AI handling', counts.ai],
              ['all', 'All', counts.all],
            ] as const
          ).map(([key, label, count]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={focus === key}
              className={`focus-tab ${focus === key ? 'active' : ''} ${key === 'needs' && count > 0 ? 'urgent' : ''}`}
              onClick={() => setFocus(key)}
            >
              {label}
              <em>{count}</em>
            </button>
          ))}
        </div>

        <div className="ai-toggles" aria-label="AI settings">
          <Toggle
            on={ai.autoReply}
            onChange={(v) => setAi((a) => ({ ...a, autoReply: v }))}
            icon={<Bot size={14} />}
            label="Auto-reply"
          />
          <Toggle
            on={ai.qualify}
            onChange={(v) => setAi((a) => ({ ...a, qualify: v }))}
            icon={<Sparkles size={14} />}
            label="Qualify"
            hideOnMobile
          />
          <Toggle
            on={ai.alertHot}
            onChange={(v) => setAi((a) => ({ ...a, alertHot: v }))}
            icon={<Bell size={14} />}
            label="Alert"
            hideOnMobile
          />
        </div>
      </header>

      {!ai.autoReply && (
        <div className="ai-banner">Auto-reply off — you’re answering everything yourself.</div>
      )}

      <main className={`inbox-shell ${showChat ? 'show-chat' : ''}`}>
        <section className="thread-rail">
          <div className="rail-search">
            <Search size={15} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, area, project…"
              aria-label="Search enquiries"
            />
          </div>

          <div className="rail-scroll">
            {visible.length === 0 ? (
              <div className="empty-rail">
                <Check size={20} />
                <p>
                  {focus === 'needs'
                    ? 'Nothing needs you right now — AI has the rest.'
                    : 'No enquiries here.'}
                </p>
              </div>
            ) : (
              visible.map((item, i) => {
                const q = qualificationProgress(item)
                const owner = needsOwner(item)
                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    className={`thread-card ${item.id === active.id ? 'active' : ''} ${item.unread ? 'unread' : ''} ${owner ? 'needs' : ''}`}
                    onClick={() => openThread(item.id)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                  >
                    <div className="thread-card-top">
                      <div className="avatar" data-ch={item.channel}>
                        {item.name.charAt(0)}
                      </div>
                      <div className="thread-card-meta">
                        <div className="thread-card-row">
                          <strong>{item.name}</strong>
                          <time>{item.time}</time>
                        </div>
                        <p>{leadSummary(item)}</p>
                        <div className="thread-card-foot">
                          <span className={`channel-chip ${item.channel}`}>
                            {channelLabel(item.channel)}
                          </span>
                          {owner && <span className="hot">Needs you</span>}
                          {aiHandling(item) && <span className="ai-tag">AI</span>}
                          {item.snoozed && <span className="ai-tag">Snoozed</span>}
                          <span className="mini-prog" title={`${q.filled}/${q.total} details`}>
                            {Array.from({ length: q.total }).map((_, idx) => (
                              <i key={idx} className={idx < q.filled ? 'on' : ''} />
                            ))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                )
              })
            )}
          </div>
        </section>

        <section className="chat-stage">
          <div className="chat-top">
            <button type="button" className="back-mobile" onClick={() => setShowChat(false)}>
              <ArrowLeft size={16} />
            </button>
            <div className="chat-who">
              <div className="avatar lg" data-ch={active.channel}>
                {active.name.charAt(0)}
              </div>
              <div>
                <h2>{active.name}</h2>
                <span>
                  {channelLabel(active.channel)}
                  {active.phone ? ` · ${active.phone}` : ''}
                </span>
              </div>
            </div>
            {active.phone && (
              <a className="call-link" href={`tel:${active.phone.replace(/\s/g, '')}`}>
                <Phone size={15} />
                Call
              </a>
            )}
          </div>

          {summary && (
            <div className="fact-strip">
              <span>{summary}</span>
              <span className="fact-prog">
                {progress.filled}/{progress.total} details
              </span>
            </div>
          )}

          <div className="chat-stream" ref={streamRef}>
            {active.messages.map((msg) => {
              const kind =
                msg.from === 'customer' ? 'in' : msg.from === 'owner' ? 'you' : 'ai'
              return (
                <div key={msg.id} className={`msg ${kind}`}>
                  {msg.from === 'ai' && (
                    <span className="msg-ai-tag">
                      <Bot size={11} /> AI
                    </span>
                  )}
                  <p>{msg.text}</p>
                  <time>{msg.time}</time>
                </div>
              )
            })}

            {ai.autoReply && aiHandling(active) && (
              <div className="ai-hint">
                <Sparkles size={13} />
                AI is gathering the rest — you don’t need to jump in yet
              </div>
            )}

            {active.suggestedReply && needsOwner(active) && (
              <motion.div
                className="suggest-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="suggest-head">
                  <Sparkles size={14} />
                  Suggested reply
                </div>
                <p>{active.suggestedReply}</p>
                <button type="button" className="suggest-use" onClick={useSuggestion}>
                  Send this
                </button>
              </motion.div>
            )}
          </div>

          <div className="next-bar" aria-label="Next step">
            {(
              [
                ['call', 'Call'],
                ['visit', 'Site visit'],
                ['quote', 'Quote'],
                ['done', 'Done'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`next-chip ${active.nextStep === key ? 'on' : ''}`}
                onClick={() => setNext(key)}
              >
                {label}
              </button>
            ))}
            <button type="button" className="next-chip soft" onClick={snooze} title="Remind later">
              <Moon size={13} />
              Later
            </button>
          </div>

          <form className="chat-compose" onSubmit={sendOwnerNote}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type to take over…"
              aria-label="Reply"
            />
            <button type="submit" aria-label="Send" className="send-btn">
              <Send size={17} />
            </button>
          </form>
        </section>

        <aside className="lead-pane">
          <LeadSnapshot
            enquiry={active}
            ai={ai}
            copied={copied}
            onCopy={copyBrief}
            onSnooze={snooze}
          />
        </aside>
      </main>
    </div>
  )
}

function Toggle({
  on,
  onChange,
  icon,
  label,
  hideOnMobile,
}: {
  on: boolean
  onChange: (v: boolean) => void
  icon: ReactNode
  label: string
  hideOnMobile?: boolean
}) {
  return (
    <button
      type="button"
      className={`toggle ${on ? 'on' : ''} ${hideOnMobile ? 'hide-sm' : ''}`}
      onClick={() => onChange(!on)}
      aria-pressed={on}
    >
      <span className="toggle-track" aria-hidden>
        <span className="toggle-thumb" />
      </span>
      <span className="toggle-label">
        {icon}
        {label}
      </span>
    </button>
  )
}

function LeadSnapshot({
  enquiry,
  ai,
  copied,
  onCopy,
  onSnooze,
}: {
  enquiry: Enquiry
  ai: AiSettings
  copied: boolean
  onCopy: () => void
  onSnooze: () => void
}) {
  const progress = qualificationProgress(enquiry)
  const score = enquiry.score ?? 0
  const fields = [
    { label: 'Location', value: enquiry.location, icon: <MapPin size={14} /> },
    { label: 'Project', value: enquiry.projectType, icon: <FileText size={14} /> },
    { label: 'Budget', value: enquiry.budget, icon: <Wallet size={14} /> },
    { label: 'Timeline', value: enquiry.timeline, icon: <Calendar size={14} /> },
    { label: 'Planning', value: enquiry.planning, icon: <Check size={14} /> },
  ]

  const ringStyle = {
    background: `conic-gradient(var(--copper) ${score * 3.6}deg, rgba(26, 46, 36, 0.1) 0deg)`,
  }

  return (
    <div className="brief-card">
      {ai.alertHot && needsOwner(enquiry) ? (
        <div className="brief-status needs">
          <Bell size={13} />
          Needs you
        </div>
      ) : aiHandling(enquiry) ? (
        <div className="brief-status ai">
          <Bot size={13} />
          AI handling
        </div>
      ) : enquiry.status === 'done' ? (
        <div className="brief-status done">
          <Check size={13} />
          Closed
        </div>
      ) : null}

      <div className="brief-hero">
        <div>
          <p className="brief-kicker">Lead brief</p>
          <h3>{enquiry.projectType ?? enquiry.name}</h3>
          {enquiry.location && <p className="brief-place">{enquiry.location}</p>}
        </div>
        {typeof enquiry.score === 'number' && (
          <div className="score-ring" style={ringStyle} aria-label={`Fit score ${score}`}>
            <div className="score-ring-inner">
              <strong>{score}</strong>
              <span>fit</span>
            </div>
          </div>
        )}
      </div>

      <div className="qual-meter">
        <div className="qual-top">
          <span>Details captured</span>
          <strong>
            {progress.filled} of {progress.total}
          </strong>
        </div>
        <div className="qual-track">
          <div className="qual-fill" style={{ width: `${progress.pct}%` }} />
        </div>
        <div className="qual-dots">
          {fields.map((f) => (
            <span key={f.label} className={f.value ? 'on' : ''} title={f.label} />
          ))}
        </div>
      </div>

      <ul className="lead-fields">
        {fields.map((f) => (
          <li key={f.label} className={f.value ? 'filled' : 'empty'}>
            <span className="field-icon">{f.icon}</span>
            <div>
              <span className="field-label">{f.label}</span>
              <strong className={f.value ? '' : 'pending'}>
                {f.value ?? (ai.qualify ? 'Asking…' : '—')}
              </strong>
            </div>
            {f.value ? (
              <i className="field-check">
                <Check size={12} />
              </i>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="brief-actions">
        {enquiry.phone && (
          <a className="lead-phone" href={`tel:${enquiry.phone.replace(/\s/g, '')}`}>
            <Phone size={15} />
            <span>{enquiry.phone}</span>
          </a>
        )}
        <button type="button" className="lead-action" onClick={onCopy}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy brief'}
        </button>
        <button type="button" className="lead-action ghost" onClick={onSnooze}>
          <Clock size={14} />
          Remind me later
        </button>
      </div>
    </div>
  )
}
