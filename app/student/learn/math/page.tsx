'use client'
import { useState } from 'react'

const questions = [
  { q: 'What is 2 × 3?', options: ['4', '6', '8', '5'], answer: '6', hint: 'Count by 2s three times!' },
  { q: 'What is 3 × 4?', options: ['10', '14', '12', '9'], answer: '12', hint: 'Count by 3s four times!' },
  { q: 'What is 5 × 3?', options: ['15', '12', '18', '10'], answer: '15', hint: 'Count by 5s three times!' },
  { q: 'What is 4 × 4?', options: ['12', '20', '14', '16'], answer: '16', hint: '4 groups of 4!' },
  { q: 'What is 6 × 2?', options: ['10', '14', '12', '8'], answer: '12', hint: 'Double 6!' },
]

export default function MathLesson() {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState('')
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [xp, setXp] = useState(0)

  const q = questions[index]

  function answer(opt: string) {
    if (answered) return
    setSelected(opt)
    setAnswered(true)
    if (opt === q.answer) { setScore(s => s + 1); setXp(x => x + 10) }
  }

  function next() {
    if (index >= questions.length - 1) { setDone(true); return }
    setIndex(i => i + 1)
    setSelected('')
    setAnswered(false)
    setShowHint(false)
  }

  if (done) return (
    <div style={{padding:32,fontFamily:'system-ui',textAlign:'center',maxWidth:500,margin:'0 auto'}}>
      <div style={{fontSize:72,marginBottom:16}}>{score >= 4 ? '🏆' : '💪'}</div>
      <h1 style={{fontSize:28,fontWeight:900,marginBottom:8}}>Lesson Complete!</h1>
      <p style={{color:'#888',marginBottom:24}}>{score} out of {questions.length} correct</p>
      <div style={{display:'flex',gap:12,justifyContent:'center',marginBottom:32}}>
        <div style={{background:'#f0fdf4',borderRadius:12,padding:'16px 24px'}}>
          <p style={{fontSize:24,fontWeight:900,color:'#16a34a',margin:0}}>{score}/{questions.length}</p>
          <p style={{fontSize:12,color:'#888',margin:0}}>Correct</p>
        </div>
        <div style={{background:'#fefce8',borderRadius:12,padding:'16px 24px'}}>
          <p style={{fontSize:24,fontWeight:900,color:'#ca8a04',margin:0}}>+{xp} XP</p>
          <p style={{fontSize:12,color:'#888',margin:0}}>Earned</p>
        </div>
      </div>
      <button onClick={() => window.location.href='/student/dashboard'} style={{background:'#6366f1',color:'white',border:'none',borderRadius:12,padding:'14px 32px',fontSize:16,fontWeight:700,cursor:'pointer',width:'100%'}}>
        Back to Home 🏠
      </button>
    </div>
  )

  return (
    <div style={{padding:24,fontFamily:'system-ui',maxWidth:500,margin:'0 auto'}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
        <button onClick={() => window.location.href='/student/dashboard'} style={{background:'none',border:'none',fontSize:20,cursor:'pointer'}}>←</button>
        <div style={{flex:1,background:'#f3f4f6',borderRadius:8,height:10,overflow:'hidden'}}>
          <div style={{width:`${((index+1)/questions.length)*100}%`,background:'#6366f1',height:10,borderRadius:8,transition:'width 0.3s'}}/>
        </div>
        <span style={{fontSize:13,color:'#888',fontWeight:700}}>{index+1}/{questions.length}</span>
      </div>

      {/* XP */}
      <div style={{textAlign:'right',marginBottom:16}}>
        <span style={{background:'#fef9c3',color:'#a16207',fontWeight:700,padding:'4px 12px',borderRadius:20,fontSize:13}}>⭐ {xp} XP</span>
      </div>

      {/* Question */}
      <h2 style={{fontSize:26,fontWeight:900,marginBottom:24,lineHeight:1.3}}>{q.q}</h2>

      {/* Options */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
        {q.options.map(opt => {
          let bg = '#f9fafb', border = '2px solid #e5e7eb', color = '#374151'
          if (answered) {
            if (opt === q.answer) { bg = '#f0fdf4'; border = '2px solid #4ade80'; color = '#166534' }
            else if (opt === selected) { bg = '#fef2f2'; border = '2px solid #f87171'; color = '#991b1b' }
          } else if (opt === selected) {
            bg = '#eef2ff'; border = '2px solid #6366f1'; color = '#3730a3'
          }
          return (
            <button key={opt} onClick={() => answer(opt)} style={{background:bg,border,borderRadius:14,padding:'18px 12px',fontSize:18,fontWeight:700,color,cursor:'pointer',transition:'all 0.15s'}}>
              {opt}
            </button>
          )
        })}
      </div>

      {/* Hint */}
      {!answered && (
        <button onClick={() => setShowHint(true)} style={{background:'none',border:'none',color:'#6366f1',fontSize:14,fontWeight:600,cursor:'pointer',width:'100%',marginBottom:8}}>
          💡 Need a hint?
        </button>
      )}
      {showHint && !answered && (
        <div style={{background:'#eff6ff',border:'2px solid #bfdbfe',borderRadius:12,padding:12,marginBottom:12,fontSize:14,color:'#1e40af'}}>
          💡 {q.hint}
        </div>
      )}

      {/* Feedback */}
      {answered && (
        <div style={{background: selected === q.answer ? '#f0fdf4' : '#fef2f2', border: `2px solid ${selected === q.answer ? '#4ade80' : '#f87171'}`, borderRadius:14,padding:16,marginBottom:16}}>
          <p style={{fontWeight:800,fontSize:16,margin:'0 0 8px',color: selected === q.answer ? '#166534' : '#991b1b'}}>
            {selected === q.answer ? '🎉 Correct! +10 XP' : `😮 The answer is ${q.answer}`}
          </p>
          <button onClick={next} style={{background: selected === q.answer ? '#22c55e' : '#6366f1',color:'white',border:'none',borderRadius:10,padding:'12px 24px',fontSize:15,fontWeight:700,cursor:'pointer',width:'100%'}}>
            {index >= questions.length - 1 ? 'Finish! 🏁' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  )
}
