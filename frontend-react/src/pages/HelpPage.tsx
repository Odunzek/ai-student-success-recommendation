/**
 * HelpPage.tsx - Platform Help & Documentation
 *
 * Covers all major features with usage guides, tips, and FAQs.
 */

import { useState } from 'react'
import {
  HelpCircle,
  LayoutDashboard,
  BarChart3,
  Users,
  Lightbulb,
  MessageSquare,
  Database,
  Upload,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Zap,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../lib/utils'
import { cardEntrance } from '../lib/animations'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Section {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

interface FaqItem {
  question: string
  answer: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const sections: Section[] = [
  { id: 'getting-started', label: 'Getting Started',     icon: Zap,           color: 'text-yellow-400' },
  { id: 'dashboard',       label: 'Dashboard',           icon: LayoutDashboard, color: 'text-primary-400' },
  { id: 'risk-assessment', label: 'Risk Assessment',     icon: BarChart3,     color: 'text-blue-400' },
  { id: 'students',        label: 'Student Management',  icon: Users,         color: 'text-green-400' },
  { id: 'interventions',   label: 'Interventions',       icon: Lightbulb,     color: 'text-orange-400' },
  { id: 'chat',            label: 'AI Chat (EduAssist)', icon: MessageSquare, color: 'text-purple-400' },
  { id: 'data',            label: 'Data Upload',         icon: Database,      color: 'text-cyan-400' },
  { id: 'faq',             label: 'FAQ',                 icon: HelpCircle,    color: 'text-rose-400' },
]

const faqs: FaqItem[] = [
  {
    question: 'Why is my AI chat showing as offline?',
    answer:
      'The AI chat requires a valid OpenAI API key set in the backend .env file (OPENAI_API_KEY). If you see "offline", check that the key is correct and the backend server is running.',
  },
  {
    question: 'What CSV format does the data upload require?',
    answer:
      'The CSV must contain student feature columns matching the model\'s expected input: num_of_prev_attempts, studied_credits, avg_score, total_clicks, completion_rate, and module_* columns. Download the sample template from the Data Upload page.',
  },
  {
    question: 'What does the risk score mean?',
    answer:
      'The risk score (0–100%) represents the model\'s estimated probability that a student will not complete their module. Scores above 70% are High risk, 40–70% are Medium, and below 40% are Low.',
  },
  {
    question: 'How is the risk score calculated?',
    answer:
      'The platform uses a CatBoost machine learning model trained on the OULAD dataset. The top predictive features are completion rate, total VLE clicks, and average assessment score. SHAP values explain each individual prediction.',
  },
  {
    question: 'Can I generate interventions without uploading data?',
    answer:
      'Yes — you can manually enter a student\'s metrics on the Risk Assessment page and generate interventions from the result. Uploading a CSV unlocks bulk analysis across all students.',
  },
  {
    question: 'How do I view what\'s driving a student\'s risk score?',
    answer:
      'Open any student\'s profile (click their name or ID), then scroll to the SHAP explanation section. It shows which features are pushing the score up or down for that specific student.',
  },
  {
    question: 'Does the AI chat have access to student data?',
    answer:
      'Yes — if you select a student in the chat interface, EduAssist automatically loads that student\'s metrics and risk score as context. You can then ask specific questions about that student.',
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionAnchor({ id }: { id: string }) {
  return <div id={id} className="-mt-20 pt-20" />
}

function SectionHeader({
  icon: Icon,
  label,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  color: string
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl bg-surface-800 flex items-center justify-center">
        <Icon className={cn('h-5 w-5', color)} />
      </div>
      <h2 className="text-lg font-semibold text-white">{label}</h2>
    </div>
  )
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-surface-900 border border-surface-800 rounded-2xl p-6', className)}>
      {children}
    </div>
  )
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-2 mt-3">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3 text-sm text-surface-300">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-600/20 text-primary-400 text-xs flex items-center justify-center font-bold mt-0.5">
            {i + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  )
}

function TipBox({
  type = 'info',
  children,
}: {
  type?: 'info' | 'warning' | 'success'
  children: React.ReactNode
}) {
  const styles = {
    info:    { icon: Info,          bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-300' },
    warning: { icon: AlertTriangle, bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-300' },
    success: { icon: CheckCircle,   bg: 'bg-green-500/10',  border: 'border-green-500/30',  text: 'text-green-300' },
  }
  const { icon: Icon, bg, border, text } = styles[type]

  return (
    <div className={cn('flex gap-3 rounded-xl border p-3 mt-4', bg, border)}>
      <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', text)} />
      <p className={cn('text-sm', text)}>{children}</p>
    </div>
  )
}

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="border border-surface-800 rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-surface-800/40 transition-colors"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="text-sm font-medium text-white">{item.question}</span>
            {open === i ? (
              <ChevronDown className="h-4 w-4 text-surface-400 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-surface-400 flex-shrink-0" />
            )}
          </button>
          <AnimatePresence>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="px-5 pb-4 text-sm text-surface-400 leading-relaxed">{item.answer}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function HelpPage() {
  const [activeSection, setActiveSection] = useState('getting-started')

  const scrollTo = (id: string) => {
    setActiveSection(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <motion.div
      className="max-w-6xl mx-auto"
      variants={cardEntrance}
      initial="initial"
      animate="animate"
    >
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Help & Documentation</h1>
        </div>
        <p className="text-surface-400 text-sm ml-[52px]">
          Everything you need to get the most out of the Student Success Platform.
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sticky Sidebar Nav */}
        <aside className="hidden lg:block w-52 flex-shrink-0">
          <div className="sticky top-6 bg-surface-900 border border-surface-800 rounded-2xl p-3 space-y-0.5">
            {sections.map((s) => {
              const Icon = s.icon
              return (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors text-left',
                    activeSection === s.id
                      ? 'bg-primary-600/15 text-white'
                      : 'text-surface-400 hover:text-white hover:bg-surface-800/60'
                  )}
                >
                  <Icon className={cn('h-4 w-4 flex-shrink-0', s.color)} />
                  <span className="truncate">{s.label}</span>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 space-y-8">

          {/* ── Getting Started ── */}
          <Card>
            <SectionAnchor id="getting-started" />
            <SectionHeader icon={Zap} label="Getting Started" color="text-yellow-400" />
            <p className="text-sm text-surface-400 mb-4">
              Most features require student data to be uploaded first. Follow these steps to get up and running.
            </p>
            <StepList steps={[
              'Go to Data Upload in the sidebar and upload your student CSV file.',
              'Once uploaded, the Dashboard will populate with your cohort\'s risk overview.',
              'Use the Students page to browse, search, and filter individual students.',
              'Open any student\'s profile to see their risk score and SHAP explanation.',
              'Go to Interventions to generate a personalised action plan for a student.',
              'Use AI Chat to ask EduAssist questions about students or support strategies.',
            ]} />
            <TipBox type="success">
              The platform remembers your last uploaded file — you won't need to re-upload on every restart.
            </TipBox>
          </Card>

          {/* ── Dashboard ── */}
          <Card>
            <SectionAnchor id="dashboard" />
            <SectionHeader icon={LayoutDashboard} label="Dashboard" color="text-primary-400" />
            <p className="text-sm text-surface-400 mb-4">
              The Dashboard gives you a high-level overview of your student cohort's risk profile.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'At-Risk Students', desc: 'Count of students with risk score ≥ 70%.' },
                { label: 'Interventions Generated', desc: 'Total intervention plans created this session.' },
                { label: 'Average Score', desc: 'Mean assessment score across all loaded students.' },
                { label: 'Risk Distribution', desc: 'Doughnut chart breaking down Low / Medium / High risk.' },
                { label: 'Student Alerts', desc: 'Table of the highest-risk students with quick-action buttons.' },
              ].map((item) => (
                <div key={item.label} className="bg-surface-800/40 rounded-xl p-3">
                  <p className="text-sm font-medium text-white mb-1">{item.label}</p>
                  <p className="text-xs text-surface-400">{item.desc}</p>
                </div>
              ))}
            </div>
            <TipBox type="info">
              Click any student's name in the Alerts table to open their full profile and SHAP explanation.
            </TipBox>
          </Card>

          {/* ── Risk Assessment ── */}
          <Card>
            <SectionAnchor id="risk-assessment" />
            <SectionHeader icon={BarChart3} label="Risk Assessment" color="text-blue-400" />
            <p className="text-sm text-surface-400 mb-3">
              Run risk predictions on individual students by entering their academic metrics manually,
              or select a student from your uploaded dataset.
            </p>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-white mb-1">Manual Prediction</p>
                <p className="text-xs text-surface-400">Fill in the feature form (completion rate, avg score, VLE clicks, etc.) and click Predict to get an instant risk score with SHAP breakdown.</p>
              </div>
              <div>
                <p className="text-sm font-medium text-white mb-1">Risk Score Bands</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[
                    { label: 'Low', range: '< 40%', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
                    { label: 'Medium', range: '40–70%', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
                    { label: 'High', range: '≥ 70%', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
                  ].map((band) => (
                    <span key={band.label} className={cn('text-xs px-3 py-1 rounded-full border font-medium', band.color)}>
                      {band.label} — {band.range}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-white mb-1">SHAP Explanation</p>
                <p className="text-xs text-surface-400">
                  After prediction, a SHAP waterfall chart shows which features increased or decreased the risk score for that student. Blue bars reduce risk; red bars increase it.
                </p>
              </div>
            </div>
          </Card>

          {/* ── Student Management ── */}
          <Card>
            <SectionAnchor id="students" />
            <SectionHeader icon={Users} label="Student Management" color="text-green-400" />
            <p className="text-sm text-surface-400 mb-3">
              Browse, search, and filter all students from your uploaded dataset.
            </p>
            <StepList steps={[
              'Use the search bar to find a student by ID or name.',
              'Filter by risk level (All / High / Medium / Low) using the filter buttons.',
              'Click a student row to open their full profile modal.',
              'The profile shows their metrics, risk score, SHAP explanation, and a quick link to generate an intervention.',
            ]} />
            <TipBox type="info">
              The Students page only populates after a CSV has been uploaded via Data Upload.
            </TipBox>
          </Card>

          {/* ── Interventions ── */}
          <Card>
            <SectionAnchor id="interventions" />
            <SectionHeader icon={Lightbulb} label="Interventions" color="text-orange-400" />
            <p className="text-sm text-surface-400 mb-3">
              Generate personalised intervention plans for at-risk students using rule-based logic
              enhanced by the AI (when available).
            </p>
            <StepList steps={[
              'Enter a student ID or search for a student from your dataset.',
              'Click Generate Intervention Plan.',
              'The platform applies rule-based checks (completion rate, scores, engagement) to identify issues.',
              'If AI is enabled, the LLM personalises the plan with specific action steps, owners, and timelines.',
              'Review the plan — each intervention includes Why, Action, Owner, Timeline, and Success Metric.',
            ]} />
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-white">What triggers each intervention type</p>
              <div className="space-y-1.5">
                {[
                  { trigger: 'Completion Rate < 50%', action: 'Academic support / tutoring referral' },
                  { trigger: 'Avg Score < 40%', action: 'Academic skills workshop' },
                  { trigger: 'VLE Clicks < 100', action: 'Engagement outreach / check-in call' },
                  { trigger: 'Previous Attempts ≥ 2', action: 'One-to-one advisor meeting' },
                ].map((row) => (
                  <div key={row.trigger} className="flex items-start gap-2 text-xs">
                    <span className="text-surface-500 w-44 flex-shrink-0">{row.trigger}</span>
                    <span className="text-surface-300">→ {row.action}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* ── AI Chat ── */}
          <Card>
            <SectionAnchor id="chat" />
            <SectionHeader icon={MessageSquare} label="AI Chat (EduAssist)" color="text-purple-400" />
            <p className="text-sm text-surface-400 mb-3">
              EduAssist is your AI advisor assistant. Ask questions about students, risk scores, intervention
              strategies, and academic support approaches.
            </p>
            <StepList steps={[
              'Navigate to AI Chat Interface in the sidebar.',
              'Optionally select a student from the dropdown — EduAssist will load their data as context.',
              'Type your question and press Enter or click Send.',
              'EduAssist remembers the last 6 messages in your session for multi-turn conversations.',
              'Click New Session to clear the conversation history and start fresh.',
            ]} />
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-white">Example questions</p>
              {[
                'Why is this student flagged as high risk?',
                'What interventions would help a student with low VLE engagement?',
                'How should I approach a conversation with a student on their second attempt?',
                'What does a completion rate of 30% indicate?',
              ].map((q) => (
                <div key={q} className="flex items-center gap-2 text-xs text-surface-400 bg-surface-800/40 rounded-lg px-3 py-2">
                  <MessageSquare className="h-3 w-3 text-purple-400 flex-shrink-0" />
                  "{q}"
                </div>
              ))}
            </div>
            <TipBox type="warning">
              EduAssist requires a valid OpenAI API key. If it shows as offline, check OPENAI_API_KEY in the backend .env file.
            </TipBox>
          </Card>

          {/* ── Data Upload ── */}
          <Card>
            <SectionAnchor id="data" />
            <SectionHeader icon={Database} label="Data Upload" color="text-cyan-400" />
            <p className="text-sm text-surface-400 mb-3">
              Upload a CSV file of student data to power the Dashboard, Students, and bulk risk analysis.
            </p>
            <StepList steps={[
              'Navigate to Data Upload in the sidebar.',
              'Drag and drop a CSV file onto the upload area, or click to browse.',
              'The platform validates required columns and shows a preview.',
              'Click Upload to load the data — it persists across server restarts.',
              'To replace data, simply upload a new file.',
            ]} />
            <div className="mt-4">
              <p className="text-sm font-medium text-white mb-2">Required CSV columns</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'num_of_prev_attempts',
                  'studied_credits',
                  'avg_score',
                  'total_clicks',
                  'completion_rate',
                  'module_BBB … module_GGG',
                ].map((col) => (
                  <code key={col} className="text-xs bg-surface-800 text-cyan-300 px-2 py-1 rounded-lg font-mono">
                    {col}
                  </code>
                ))}
              </div>
            </div>
            <TipBox type="info">
              Uploaded data is saved to <code className="text-xs font-mono">data/uploads/uploaded_data.csv</code> on the server and automatically reloaded on backend restart.
            </TipBox>
          </Card>

          {/* ── FAQ ── */}
          <Card>
            <SectionAnchor id="faq" />
            <SectionHeader icon={HelpCircle} label="Frequently Asked Questions" color="text-rose-400" />
            <FaqAccordion items={faqs} />
          </Card>

        </div>
      </div>
    </motion.div>
  )
}
