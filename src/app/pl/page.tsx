'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCZK } from '@/lib/utils'
import type { Property } from '@/lib/database.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react'

export default function PLPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [maintenance, setMaintenance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())

  async function load() {
    const [{ data: ps }, { data: pays }, { data: maint }] = await Promise.all([
      (supabase as any).from('properties').select('*'),
      (supabase as any).from('rent_payments').select('*').eq('status', 'paid'),
      (supabase as any).from('maintenance_requests').select('*').not('cost', 'is', null),
    ])
    setProperties(ps || [])
    setPayments(pays || [])
    setMaintenance(maint || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const monthNames = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čvn', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro']

  function incomeForMonth(month: number) {
    return payments
      .filter(p => {
        const d = new Date(p.paid_date || p.due_date)
        return d.getFullYear() === year && d.getMonth() + 1 === month
      })
      .reduce((sum, p) => sum + p.amount, 0)
  }

  function costsForMonth(month: number) {
    return maintenance
      .filter(m => {
        const d = new Date(m.resolved_at || m.reported_at)
        return d.getFullYear() === year && d.getMonth() + 1 === month
      })
      .reduce((sum, m) => sum + (m.cost || 0), 0)
  }

  const totalIncome = months.reduce((s, m) => s + incomeForMonth(m), 0)
  const totalCosts = months.reduce((s, m) => s + costsForMonth(m), 0)
  const totalProfit = totalIncome - totalCosts

  const maxBar = Math.max(...months.map(m => Math.max(incomeForMonth(m), costsForMonth(m))), 1)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Příjmy & Výdaje</h1>
          <p className="text-zinc-400 text-sm mt-1">Přehled za rok {year}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setYear(y => y - 1)} className="px-3 py-1.5 text-sm border border-zinc-700 rounded text-zinc-400 hover:text-white">← {year - 1}</button>
          <button onClick={() => setYear(y => y + 1)} className="px-3 py-1.5 text-sm border border-zinc-700 rounded text-zinc-400 hover:text-white">{year + 1} →</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-zinc-400 flex items-center gap-1"><TrendingUp size={13} className="text-green-400" /> Příjmy</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-green-400">{formatCZK(totalIncome)}</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-zinc-400 flex items-center gap-1"><TrendingDown size={13} className="text-red-400" /> Výdaje</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-red-400">{formatCZK(totalCosts)}</div>
          </CardContent>
        </Card>
        <Card className={`border-zinc-800 ${totalProfit >= 0 ? 'bg-green-950/30' : 'bg-red-950/30'}`}>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs text-zinc-400 flex items-center gap-1"><BarChart3 size={13} /> Zisk</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCZK(totalProfit)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 mb-6">
        <CardHeader>
          <CardTitle className="text-sm text-zinc-300">Měsíční přehled</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-5">
          {loading ? (
            <div className="text-zinc-500 text-sm">Načítám...</div>
          ) : (
            <div className="flex items-end gap-2 h-40">
              {months.map(m => {
                const inc = incomeForMonth(m)
                const cost = costsForMonth(m)
                const incH = maxBar > 0 ? (inc / maxBar) * 120 : 0
                const costH = maxBar > 0 ? (cost / maxBar) * 120 : 0
                return (
                  <div key={m} className="flex-1 flex flex-col items-center gap-1">
                    <div className="flex items-end gap-0.5 h-32">
                      <div
                        className="w-3 rounded-t bg-green-500/60 hover:bg-green-500 transition-colors"
                        style={{ height: `${incH}px` }}
                        title={`Příjmy: ${formatCZK(inc)}`}
                      />
                      <div
                        className="w-3 rounded-t bg-red-500/60 hover:bg-red-500 transition-colors"
                        style={{ height: `${costH}px` }}
                        title={`Výdaje: ${formatCZK(cost)}`}
                      />
                    </div>
                    <span className="text-xs text-zinc-500">{monthNames[m - 1]}</span>
                  </div>
                )
              })}
            </div>
          )}
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400"><div className="w-3 h-3 rounded-sm bg-green-500/60" /> Příjmy</div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400"><div className="w-3 h-3 rounded-sm bg-red-500/60" /> Výdaje</div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm text-zinc-300">Podle nemovitosti</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {properties.length === 0 ? (
            <p className="text-zinc-500 text-sm">Žádné nemovitosti</p>
          ) : (
            <div className="flex flex-col gap-3">
              {properties.map(p => {
                const inc = payments.filter(pay => pay.property_id === p.id).reduce((s, pay) => s + pay.amount, 0)
                const cost = maintenance.filter(m => m.property_id === p.id).reduce((s, m) => s + (m.cost || 0), 0)
                return (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-white">{p.name}</div>
                      <div className="text-xs text-zinc-500">{p.city}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-green-400">+{formatCZK(inc)}</div>
                      <div className="text-xs text-red-400">−{formatCZK(cost)}</div>
                      <div className={`text-xs font-semibold mt-0.5 ${inc - cost >= 0 ? 'text-white' : 'text-red-400'}`}>{formatCZK(inc - cost)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
