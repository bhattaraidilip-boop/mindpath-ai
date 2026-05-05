'use client'

// components/ui/index.tsx
// MindPath AI — Complete Base Design System

import { motion, AnimatePresence } from 'framer-motion'
import { forwardRef, type ReactNode, type ButtonHTMLAttributes } from 'react'
import { clsx } from 'clsx'

// ─── BUTTON ──────────────────────────────────────────────────────────────────
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary', size = 'md', loading, icon, fullWidth,
  children, className, disabled, ...props
}, ref) => {
  const base = 'inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed select-none'

  const variants = {
    primary:   'bg-brand-500 hover:bg-brand-600 text-white shadow-sm',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
    ghost:     'hover:bg-gray-100 text-gray-600',
    danger:    'bg-red-500 hover:bg-red-600 text-white',
    success:   'bg-green-500 hover:bg-green-600 text-white',
  }

  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-5 py-3 text-base min-h-[44px]',
    lg: 'px-6 py-4 text-lg min-h-[52px]',
  }

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      {...props}
    >
      {loading ? <Spinner size={size === 'sm' ? 14 : 18} /> : icon}
      {children}
    </button>
  )
})
Button.displayName = 'Button'

// ─── CARD ─────────────────────────────────────────────────────────────────────
interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ children, className, onClick, hover, padding = 'md' }: CardProps) {
  const paddings = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-6' }
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white rounded-2xl border border-gray-100 shadow-card',
        paddings[padding],
        hover && 'cursor-pointer hover:shadow-card-lg hover:-translate-y-0.5 transition-all duration-200',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

// ─── SUBJECT CARD ─────────────────────────────────────────────────────────────
interface SubjectCardProps {
  icon: string
  name: string
  color: string
  progress?: number
  mastery?: number
  onClick?: () => void
}

export function SubjectCard({ icon, name, color, progress = 0, mastery = 0, onClick }: SubjectCardProps) {
  return (
    <motion.div
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 cursor-pointer hover:shadow-card-lg transition-all duration-200"
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
          style={{ backgroundColor: color + '22' }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-gray-900 text-sm">{name}</p>
          <p className="text-xs text-gray-400">{mastery}% mastery</p>
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <motion.div
          className="h-2 rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  )
}

// ─── XP BAR ──────────────────────────────────────────────────────────────────
interface XPBarProps {
  currentXP: number
  nextLevelXP: number
  level: number
  className?: string
}

export function XPBar({ currentXP, nextLevelXP, level, className }: XPBarProps) {
  const pct = Math.min(100, Math.round((currentXP / nextLevelXP) * 100))
  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center">
        <span className="text-white text-xs font-black">{level}</span>
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-semibold text-gray-500">Level {level}</span>
          <span className="text-xs text-gray-400">{currentXP} / {nextLevelXP} XP</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <motion.div
            className="h-2.5 rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── STREAK BADGE ────────────────────────────────────────────────────────────
export function StreakBadge({ streak, size = 'md' }: { streak: number; size?: 'sm' | 'md' | 'lg' }) {
  if (streak === 0) return null
  const sizes = { sm: 'px-2 py-1 text-xs', md: 'px-3 py-1.5 text-sm', lg: 'px-4 py-2 text-base' }
  return (
    <div className={clsx('inline-flex items-center gap-1.5 bg-orange-500 text-white font-bold rounded-full', sizes[size])}>
      <span className="animate-flame">🔥</span>
      <span>{streak} {streak === 1 ? 'day' : 'days'}</span>
    </div>
  )
}

// ─── XP FLASH ────────────────────────────────────────────────────────────────
export function XPFlash({ amount, visible }: { amount: number; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          initial={{ opacity: 0, y: 0, scale: 0.5 }}
          animate={{ opacity: 1, y: -60, scale: 1.2 }}
          exit={{ opacity: 0, y: -100, scale: 0.8 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="bg-yellow-400 text-yellow-900 font-black text-2xl px-5 py-2 rounded-full shadow-xp">
            +{amount} XP ⭐
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── BADGE CHIP ──────────────────────────────────────────────────────────────
const RARITY_STYLES = {
  common:    'bg-gray-100 border-gray-200 text-gray-700',
  rare:      'bg-blue-50 border-blue-200 text-blue-700',
  epic:      'bg-purple-50 border-purple-200 text-purple-700',
  legendary: 'bg-amber-50 border-amber-300 text-amber-700',
}

export function BadgeChip({
  name, icon, rarity = 'common', size = 'md'
}: { name: string; icon?: string; rarity?: string; size?: 'sm' | 'md' }) {
  const style = RARITY_STYLES[rarity as keyof typeof RARITY_STYLES] ?? RARITY_STYLES.common
  return (
    <div className={clsx(
      'inline-flex items-center gap-1.5 rounded-full border font-semibold',
      size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
      style
    )}>
      {icon && <span>{icon}</span>}
      {name}
    </div>
  )
}

// ─── NEW BADGE TOAST ─────────────────────────────────────────────────────────
export function BadgeToast({ badge, onClose }: {
  badge: { name: string; description: string; rarity: string } | null
  onClose: () => void
}) {
  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          className="fixed bottom-24 inset-x-4 max-w-sm mx-auto z-50"
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <div className="bg-gray-900 rounded-2xl p-4 shadow-2xl flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
              🏅
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-0.5">
                New Badge!
              </p>
              <p className="text-white font-display font-bold text-base leading-tight">{badge.name}</p>
              <p className="text-gray-400 text-xs mt-0.5 truncate">{badge.description}</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white p-1">✕</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── LEVEL UP MODAL ──────────────────────────────────────────────────────────
export function LevelUpModal({ level, onClose }: { level: number; onClose: () => void }) {
  return (
    <AnimatePresence>
      {level > 0 && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-3xl p-8 text-center max-w-xs w-full"
            initial={{ scale: 0.5, rotate: -10, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-display font-black text-gray-900 mb-1">
              Level {level}!
            </h2>
            <p className="text-gray-500 mb-6">You're on fire! Keep going!</p>
            <div className="w-20 h-20 bg-gradient-to-br from-brand-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-white font-black text-3xl">{level}</span>
            </div>
            <Button variant="primary" size="lg" fullWidth onClick={onClose}>
              Let's keep going! 🚀
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── MOOD PICKER ─────────────────────────────────────────────────────────────
const MOODS = [
  { score: 1, emoji: '😴', label: 'Tired' },
  { score: 2, emoji: '😕', label: 'Meh' },
  { score: 3, emoji: '😊', label: 'Good' },
  { score: 4, emoji: '😄', label: 'Great' },
  { score: 5, emoji: '🚀', label: 'Amazing' },
] as const

export function MoodPicker({ onSelect }: { onSelect: (mood: number) => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-end bg-black/40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="w-full bg-white rounded-t-3xl p-6 pb-10"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
        <h3 className="text-center text-xl font-display font-black text-gray-900 mb-2">
          How are you feeling today?
        </h3>
        <p className="text-center text-gray-500 text-sm mb-6">
          This helps us pick the right lessons for you!
        </p>
        <div className="flex justify-center gap-3">
          {MOODS.map(({ score, emoji, label }) => (
            <motion.button
              key={score}
              whileTap={{ scale: 0.85 }}
              onClick={() => onSelect(score)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-gray-50 transition-colors"
            >
              <span className="text-4xl">{emoji}</span>
              <span className="text-xs text-gray-500 font-medium">{label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── PROGRESS RING ────────────────────────────────────────────────────────────
export function ProgressRing({
  pct, size = 64, color = '#6366f1', children
}: { pct: number; size?: number; color?: string; children?: ReactNode }) {
  const r  = (size - 8) / 2
  const c  = 2 * Math.PI * r
  const offset = c - (pct / 100) * c

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={6} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}

// ─── DAILY MISSION CARD ──────────────────────────────────────────────────────
interface MissionItem {
  id: string
  emoji: string
  description: string
  progress: number
  target: number
  xp_reward: number
}

export function DailyMissionCard({ missions, bonusXP }: {
  missions: MissionItem[]
  bonusXP: number
}) {
  const completed = missions.filter(m => m.progress >= m.target).length
  const total = missions.length

  return (
    <Card className="border-l-4 border-l-brand-500">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-display font-bold text-gray-900 text-sm">Daily Missions</h3>
          <p className="text-xs text-gray-400">{completed}/{total} complete · +{bonusXP} XP bonus</p>
        </div>
        <div className="text-2xl">{completed === total ? '🏆' : '🎯'}</div>
      </div>
      <div className="space-y-2.5">
        {missions.map(m => {
          const done = m.progress >= m.target
          return (
            <div key={m.id} className="flex items-center gap-3">
              <span className="text-lg">{done ? '✅' : m.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <p className={clsx('text-xs font-semibold truncate', done ? 'text-green-600 line-through' : 'text-gray-700')}>
                    {m.description}
                  </p>
                  <span className="text-xs text-brand-500 font-bold ml-2 flex-shrink-0">+{m.xp_reward}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <motion.div
                    className={clsx('h-1.5 rounded-full', done ? 'bg-green-500' : 'bg-brand-500')}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (m.progress / m.target) * 100)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ─── AVATAR ───────────────────────────────────────────────────────────────────
const AVATAR_BASES: Record<string, string> = {
  bear: '🐻', cat: '🐱', robot: '🤖', fox: '🦊', owl: '🦉', dragon: '🐲'
}

export function Avatar({ config, size = 'md', name }: {
  config?: { base?: string; color?: string; background?: string }
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  name?: string
}) {
  const sizes = { xs: 'w-7 h-7 text-sm', sm: 'w-9 h-9 text-lg', md: 'w-12 h-12 text-2xl', lg: 'w-16 h-16 text-3xl', xl: 'w-24 h-24 text-5xl' }
  const emoji = AVATAR_BASES[config?.base ?? 'bear'] ?? '🐻'
  const bg    = config?.background ?? '#E8F4FD'

  return (
    <div
      className={clsx('rounded-2xl flex items-center justify-center flex-shrink-0', sizes[size])}
      style={{ backgroundColor: bg }}
      title={name}
    >
      {emoji}
    </div>
  )
}

// ─── SPINNER ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, white }: { size?: number; white?: boolean }) {
  return (
    <svg
      className={clsx('animate-spin', white ? 'text-white' : 'text-brand-500')}
      width={size} height={size}
      fill="none" viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────
export function EmptyState({ emoji, title, subtitle }: {
  emoji: string; title: string; subtitle?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-6">
      <div className="text-5xl mb-4">{emoji}</div>
      <h3 className="text-lg font-display font-bold text-gray-800 mb-1">{title}</h3>
      {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
    </div>
  )
}

// ─── NAV BOTTOM ──────────────────────────────────────────────────────────────
interface NavItem { href: string; icon: string; label: string; active?: boolean }

export function BottomNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 safe-bottom z-30">
      <div className="flex items-stretch max-w-lg mx-auto">
        {items.map(item => (
          <a
            key={item.href}
            href={item.href}
            className={clsx(
              'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-semibold transition-colors',
              item.active ? 'text-brand-600' : 'text-gray-400'
            )}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </a>
        ))}
      </div>
    </nav>
  )
}
