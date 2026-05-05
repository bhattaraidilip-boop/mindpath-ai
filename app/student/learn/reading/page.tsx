'use client'
import { useState } from 'react'

const Q = [
  {q:'Which word rhymes with cat?', o:['dog','hat','sun','big'], a:'hat'},
  {q:'Opposite of hot?', o:['warm','cold','big','fast'], a:'cold'},
  {q:'Word meaning happy?', o:['sad','angry','glad','tired'], a:'glad'},
  {q:'The cat sat ___ the mat.', o:['under','on','behind','near'], a:'on'},
  {q:'Correct sentence?', o:['Dog run.','The dog runs fast.','Dog running.','Run dog.'], a:'The dog runs fast.'},
]

export default function Page() {
  const [i, setI] = useState(0)
  const [s, setS] = useState('')
  const [a, setA] = useState(false)
  const [sc, setSc] = useState(0)
  const [done, setDone] = useState(false)
  const [xp, setXp] = useState(0)
  const q = Q[i]

  function pick(o: string) {
    if (a) return
    setS(o)
    setA(true)
    if (o === q.a) { setSc(x => x + 1); setXp(x => x + 10) }
  }

  function next() {
    if (i >= Q.length - 1) { setDone(true); return }
    setI(x => x + 1)
    setS('')
    setA(false)
  }

  if (done) return (
    <div style={{padding:32, textAlign:'center', fontFamily:'system-ui'}}>
      <div style={{fontSize:64}}>{sc >= 4 ? '🏆' : '💪'}</div>
      <h1>{sc}/{Q.length} correct! +{xp} XP</h1>
      <button onClick={() => window.location.href='/student/dashboard'}
        style={{background:'#4CAF50',color:'white',border:'none',borderRadius:12,padding:'14px 32px',fontSize:16,fontWeight:700,cursor:'pointer',width:'100%',marginTop:16}}>
        Back to Home 🏠
      </button>
    </div>
  )

  return (
    <div style={{padding:24, fontFamily:'system-ui', maxWidth:480, margin:'0 auto'}}>
      <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:20}}>
        <button onClick={() => window.location.href='/student/dashboard'}
          style={{background:'none',border:'none',fontSize:20,cursor:'pointer'}}>←</button>
        <div style={{flex:1, background:'#f3f4f6', borderRadius:8, height:10, overflow:'hidden'}}>
          <div style={{width:`${((i+1)/Q.length)*100}%`, background:'#4CAF50', height:10, borderRadius:8}}/>
        </div>
        <span style={{fontSize:13, color:'#888'}}>{i+1}/{Q.length}</span>
      </div>

      <h2 style={{fontSize:22, fontWeight:900, marginBottom:20}}>{q.q}</h2>

      <div style={{display:'flex', flexDirection:'column', gap:10, marginBottom:16}}>
        {q.o.map(o => {
          let bg = '#f9fafb', border = '2px solid #e5e7eb', color = '#374151'
          if (a) {
            if (o === q.a) { bg='#f0fdf4'; border='2px solid #4ade80'; color='#166534' }
            else if (o === s) { bg='#fef2f2'; border='2px solid #f87171'; color='#991b1b' }
          }
          return (
            <button key={o} onClick={() => pick(o)}
              style={{background:bg, border, borderRadius:12, padding:'14px 16px', fontSize:16, fontWeight:600, color, cursor:'pointer', textAlign:'left'}}>
              {o}
            </button>
          )
        })}
      </div>

      {a && (
        <div style={{background: s===q.a ? '#f0fdf4' : '#fef2f2', border:`2px solid ${s===q.a ? '#4ade80' : '#f87171'}`, borderRadius:14, padding:16}}>
          <p style={{fontWeight:800, color: s===q.a ? '#166534' : '#991b1b', margin:'0 0 8px'}}>
            {s === q.a ? '🎉 Correct! +10 XP' : `😮 Answer: ${q.a}`}
          </p>
          <button onClick={next}
            style={{background:'#4CAF50',color:'white',border:'none',borderRadius:10,padding:'12px 24px',fontSize:15,fontWeight:700,cursor:'pointer',width:'100%'}}>
            {i >= Q.length - 1 ? 'Finish! 🏁' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  )
}
