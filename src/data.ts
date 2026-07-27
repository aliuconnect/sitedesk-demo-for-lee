export type Channel = 'whatsapp' | 'email' | 'website'

export type LeadStatus = 'new' | 'qualifying' | 'qualified' | 'sent' | 'done'

export type NextStep = 'none' | 'call' | 'visit' | 'quote' | 'done'

export interface Message {
  id: string
  from: 'customer' | 'ai' | 'owner'
  text: string
  time: string
}

export interface Enquiry {
  id: string
  name: string
  phone?: string
  channel: Channel
  preview: string
  time: string
  unread: boolean
  status: LeadStatus
  location?: string
  projectType?: string
  budget?: string
  timeline?: string
  planning?: string
  score?: number
  nextStep: NextStep
  snoozed?: boolean
  suggestedReply?: string
  messages: Message[]
}

export const enquiries: Enquiry[] = [
  {
    id: '1',
    name: 'Aoife Brennan',
    phone: '+353 87 123 4567',
    channel: 'whatsapp',
    preview: 'Hi, looking for a granny flat quote in Rathfarnham…',
    time: '2m',
    unread: true,
    status: 'qualifying',
    location: 'Rathfarnham, Dublin 14',
    projectType: 'Granny flat',
    budget: '€80–100k',
    timeline: 'Start within 3 months',
    planning: 'Not yet applied',
    score: 78,
    nextStep: 'none',
    suggestedReply:
      "Thanks Aoife — based on Rathfarnham and a ~40sqm granny flat, you're in a good range. I can do a quick site chat this week — what evenings work?",
    messages: [
      {
        id: 'm1',
        from: 'customer',
        text: 'Hi, looking for a granny flat quote in Rathfarnham. Roughly how much would a 40sqm one cost?',
        time: '14:02',
      },
      {
        id: 'm2',
        from: 'ai',
        text: "Thanks for getting in touch! For a ~40sqm granny flat in Dublin, most projects land between €75k–€110k depending on finish and site access.\n\nTo give you an accurate sense of fit, could I ask a few quick questions?",
        time: '14:02',
      },
      {
        id: 'm3',
        from: 'customer',
        text: 'Sure',
        time: '14:03',
      },
      {
        id: 'm4',
        from: 'ai',
        text: 'Great — what is your property location (area / Eircode if handy)?',
        time: '14:03',
      },
      {
        id: 'm5',
        from: 'customer',
        text: 'Rathfarnham, Dublin 14 — D14 HX92',
        time: '14:04',
      },
      {
        id: 'm6',
        from: 'ai',
        text: 'Got it. And is this a granny flat, home extension, or something else?',
        time: '14:04',
      },
      {
        id: 'm7',
        from: 'customer',
        text: 'Granny flat for my parents — about 40sqm',
        time: '14:05',
      },
    ],
  },
  {
    id: '2',
    name: 'James O’Connell',
    phone: '+353 86 555 0192',
    channel: 'website',
    preview: 'Rear extension, Clontarf — planning granted…',
    time: '18m',
    unread: true,
    status: 'qualified',
    location: 'Clontarf, Dublin 3',
    projectType: 'Rear extension',
    budget: '€120–150k',
    timeline: 'This year',
    planning: 'Permission granted',
    score: 92,
    nextStep: 'call',
    suggestedReply:
      "Hi James — planning already granted is ideal. Free for a 10-min call tomorrow to lock a site visit?",
    messages: [
      {
        id: 'm1',
        from: 'customer',
        text: 'Submitted via website: Looking for a rear extension quote in Clontarf. Planning permission already granted. Budget around €130k. Hoping to start this autumn.',
        time: '13:48',
      },
      {
        id: 'm2',
        from: 'ai',
        text: "Thanks James — a rear extension with planning already granted is a strong fit. I've noted Clontarf, €120–150k budget, and an autumn start.\n\nI've flagged this for the owner so they can arrange a site visit.",
        time: '13:48',
      },
    ],
  },
  {
    id: '3',
    name: 'Sarah Murphy',
    phone: '+353 85 441 2288',
    channel: 'email',
    preview: 'Do you need planning permission for a granny flat?',
    time: '1h',
    unread: false,
    status: 'new',
    score: 45,
    nextStep: 'none',
    suggestedReply:
      "Hi Sarah — happy to check Blackrock for you. Roughly what size granny flat are you thinking?",
    messages: [
      {
        id: 'm1',
        from: 'customer',
        text: 'Hello — do you need planning permission for a granny flat in Dublin? We have a side garden in Blackrock.',
        time: '12:55',
      },
      {
        id: 'm2',
        from: 'ai',
        text: "Hi Sarah — great question. Some granny flats can fall under exempted development, but many still need planning. Site factors in Blackrock often matter.\n\nWhat's the approximate size you're considering?",
        time: '12:55',
      },
    ],
  },
  {
    id: '4',
    name: 'Tom Walsh',
    phone: '+353 87 990 1144',
    channel: 'whatsapp',
    preview: 'Kitchen extension in Lucan…',
    time: '3h',
    unread: false,
    status: 'sent',
    location: 'Lucan, Co. Dublin',
    projectType: 'Kitchen extension',
    budget: '€60–80k',
    timeline: 'Flexible',
    planning: 'Unsure',
    score: 71,
    nextStep: 'visit',
    snoozed: false,
    messages: [
      {
        id: 'm1',
        from: 'customer',
        text: 'Can you build a kitchen extension in Lucan?',
        time: '11:10',
      },
      {
        id: 'm2',
        from: 'ai',
        text: 'Yes — we regularly work across Dublin including Lucan. Roughly what size, and do you have a budget range?',
        time: '11:10',
      },
      {
        id: 'm3',
        from: 'customer',
        text: 'About 20sqm, maybe €70k. Flexible on timing.',
        time: '11:22',
      },
      {
        id: 'm4',
        from: 'ai',
        text: "Perfect — I've passed this to the owner with your details. They'll follow up about a site visit.",
        time: '11:22',
      },
    ],
  },
]

export function qualificationProgress(e: Enquiry) {
  const fields = [e.location, e.projectType, e.budget, e.timeline, e.planning]
  const filled = fields.filter(Boolean).length
  return { filled, total: fields.length, pct: Math.round((filled / fields.length) * 100) }
}

export function needsOwner(e: Enquiry) {
  if (e.status === 'done' || e.snoozed) return false
  return (
    e.status === 'qualified' ||
    e.status === 'sent' ||
    e.nextStep === 'call' ||
    e.nextStep === 'visit' ||
    e.nextStep === 'quote' ||
    (typeof e.score === 'number' && e.score >= 85)
  )
}

export function aiHandling(e: Enquiry) {
  return !needsOwner(e) && e.status !== 'done' && (e.status === 'new' || e.status === 'qualifying')
}

export function leadSummary(e: Enquiry) {
  return [e.projectType, e.location, e.budget].filter(Boolean).join(' · ') || e.preview
}
