import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MindPath AI — AI-Powered Learning for Children',
  description: 'Personalized learning that adapts to your child. Combines Kumon discipline with AI-powered tutoring for ages 4–18.',
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-white overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="flex items-center justify-between px-5 py-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center text-white font-black text-lg font-display">M</div>
          <span className="font-display font-black text-xl text-gray-900">MindPath AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-gray-600 font-semibold text-sm hidden sm:block">Sign in</Link>
          <Link
            href="/signup"
            className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            Start Free
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="px-5 pt-12 pb-16 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 font-bold text-xs px-4 py-2 rounded-full mb-6">
          ✨ AI-powered · COPPA compliant · Ages 4–18
        </div>

        <h1 className="font-display font-black text-4xl sm:text-5xl text-gray-900 leading-tight mb-4">
          Learning that{' '}
          <span className="text-gradient">adapts to your child</span>
        </h1>

        <p className="text-gray-500 text-lg max-w-lg mx-auto mb-8 leading-relaxed">
          MindPath AI combines Kumon's discipline with Duolingo's engagement and GPT-4 personalization — built for children ages 4–18.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
          <Link
            href="/signup"
            className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-8 py-4 rounded-xl text-base transition-all active:scale-[0.97] shadow-glow"
          >
            Start Free Today 🚀
          </Link>
          <Link
            href="#how-it-works"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-8 py-4 rounded-xl text-base transition-colors"
          >
            See how it works
          </Link>
        </div>
        <p className="text-xs text-gray-400">7-day free trial · No credit card required · Cancel anytime</p>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="bg-gray-50 py-8 px-5">
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { value: '4.9★', label: 'App rating' },
              { value: '50K+', label: 'Active learners' },
              { value: '2.1M', label: 'Lessons completed' },
            ].map(s => (
              <div key={s.label}>
                <p className="font-display font-black text-2xl text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-16 px-5 max-w-2xl mx-auto">
        <h2 className="font-display font-black text-3xl text-gray-900 text-center mb-3">
          Built different
        </h2>
        <p className="text-center text-gray-500 mb-10">
          Not just another quiz app.
        </p>

        <div className="space-y-5">
          {[
            { emoji: '🎯', title: 'Placement test first', desc: "Takes 5 minutes. Finds your child's exact level across Math and Reading so every lesson is perfectly calibrated." },
            { emoji: '🤖', title: 'AI tutor that never judges', desc: 'When stuck, kids ask the AI tutor. It never gives the answer — it guides them to discover it. Age-appropriate, always safe.' },
            { emoji: '🔥', title: 'Streaks and rewards that work', desc: "Daily missions, XP, badges, and level-ups create the same habit loop as Duolingo — but with real academic content." },
            { emoji: '📊', title: 'Parents see everything', desc: "Real-time progress, subject mastery, WALD score, and weekly AI-generated reports. You always know what's happening." },
          ].map(item => (
            <div key={item.title} className="flex gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-card">
              <div className="text-4xl flex-shrink-0">{item.emoji}</div>
              <div>
                <h3 className="font-display font-bold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING PREVIEW ── */}
      <section className="bg-brand-500 py-16 px-5 text-white text-center">
        <h2 className="font-display font-black text-3xl mb-3">Simple pricing</h2>
        <p className="text-white/80 mb-8">Less than one hour of tutoring per month.</p>
        <div className="flex flex-wrap justify-center gap-4 max-w-lg mx-auto mb-8">
          {[
            { plan: 'Free',        price: '$0',  note: '10 lessons/month' },
            { plan: 'Starter',     price: '$12', note: '1 child, all subjects' },
            { plan: 'Family',      price: '$25', note: '3 children + AI tutor' },
            { plan: 'Premium AI',  price: '$39', note: '5 children, unlimited' },
          ].map(p => (
            <div key={p.plan} className="bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-center min-w-[120px]">
              <p className="font-display font-black text-2xl">{p.price}</p>
              <p className="font-bold text-sm">{p.plan}</p>
              <p className="text-white/60 text-xs mt-0.5">{p.note}</p>
            </div>
          ))}
        </div>
        <Link
          href="/signup"
          className="inline-block bg-white text-brand-600 font-black px-8 py-4 rounded-xl text-base hover:bg-brand-50 transition-colors"
        >
          Start free — no card needed
        </Link>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 px-5 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center text-white font-black text-sm font-display">M</div>
          <span className="font-display font-black text-gray-900">MindPath AI</span>
        </div>
        <div className="flex justify-center gap-5 text-sm text-gray-400 mb-3">
          <Link href="/privacy" className="hover:text-gray-600">Privacy</Link>
          <Link href="/terms" className="hover:text-gray-600">Terms</Link>
          <Link href="/contact" className="hover:text-gray-600">Contact</Link>
        </div>
        <p className="text-xs text-gray-400">
          © 2025 MindPath AI · COPPA Compliant · Child-Safe Platform
        </p>
      </footer>

    </div>
  )
}
