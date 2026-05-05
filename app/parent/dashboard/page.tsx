'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ParentDashboard() {
  const supabase = createClient()
  const [children, setChildren] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [parentName, setParentName] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      const { data: userData } = await supabase.from('users').select('full_name').eq('id', user.id).single()
      setParentName(userData?.full_name ?? 'Parent')
      const { data: kids } = await supabase.from('student_profiles').select('*').eq('parent_id', 'ae3766b4-38a3-406d-b8fb-a37fbc8835c6')
      setChildren(kids ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}><p>Loading...</p></div>

  return (
    <div style={{padding:24,fontFamily:'system-ui',maxWidth:600,margin:'0 auto'}}>
      <h1 style={{fontSize:28,fontWeight:900,marginBottom:4}}>Good evening, {parentName.split(' ')[0]} 👋</h1>
      <p style={{color:'#888',marginBottom:24}}>{children.length} children</p>
      {children.map(child => (
        <div key={child.id} onClick={() => window.location.href='/student/dashboard'} style={{background:'white',borderRadius:16,padding:20,marginBottom:16,boxShadow:'0 2px 8px rgba(0,0,0,0.08)',cursor:'pointer',border:'2px solid transparent',transition:'all 0.2s'}}
          onMouseOver={e => (e.currentTarget.style.border='2px solid #6366f1')}
          onMouseOut={e => (e.currentTarget.style.border='2px solid transparent')}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
            <div style={{width:48,height:48,background:'#E8F4FD',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>🐻</div>
            <div style={{flex:1}}>
              <h2 style={{fontWeight:900,fontSize:18,margin:0}}>{child.display_name}</h2>
              <p style={{color:'#888',fontSize:13,margin:0}}>Grade {child.grade_level} · Streak: {child.current_streak} days 🔥</p>
            </div>
            <div style={{background:'#6366f1',color:'white',borderRadius:20,padding:'4px 12px',fontSize:13,fontWeight:700}}>Lv {child.xp_level}</div>
          </div>
          <div style={{background:'#f3f4f6',borderRadius:8,height:8,overflow:'hidden'}}>
            <div style={{width:`${Math.min(100,(child.xp_total/500)*100)}%`,background:'#6366f1',height:8,borderRadius:8}}/>
          </div>
          <p style={{fontSize:12,color:'#888',marginTop:4}}>{child.xp_total} XP total · Tap to view →</p>
        </div>
      ))}
    </div>
  )
}
