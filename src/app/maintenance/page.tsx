'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCZK, formatDate } from '@/lib/utils'
import type { MaintenanceRequest, Property } from '@/lib/database.types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Wrench, Plus, CheckCircle } from 'lucide-react'

const statusLabel: Record<string, string> = { open: 'Nový', in_progress: 'Probíhá', resolved: 'Vyřešeno' }
const statusColor: Record<string, string> = {
  open: 'bg-red-500/10 text-red-400 border-red-500/20',
  in_progress: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  resolved: 'bg-green-500/10 text-green-400 border-green-500/20',
}

type RequestRow = MaintenanceRequest & { property: Property | null }

export default function MaintenancePage() {
  const [requests, setRequests] = useState<RequestRow[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('open')
  const [form, setForm] = useState({ property_id: '', title: '', description: '', cost: '' })

  async function load() {
    const [{ data: rs }, { data: ps }] = await Promise.all([
      (supabase as any).from('maintenance_requests').select('*, property:properties(*)').order('reported_at', { ascending: false }),
      (supabase as any).from('properties').select('*').order('name'),
    ])
    setRequests(rs || [])
    setProperties(ps || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function save() {
    await (supabase as any).from('maintenance_requests').insert([{
      ...form,
      cost: form.cost ? Number(form.cost) : null,
      status: 'open',
      reported_at: new Date().toISOString(),
    }])
    setForm({ property_id: '', title: '', description: '', cost: '' })
    setShowForm(false)
    load()
  }

  async function updateStatus(id: string, status: string) {
    const update: any = { status }
    if (status === 'resolved') update.resolved_at = new Date().toISOString()
    await (supabase as any).from('maintenance_requests').update(update).eq('id', id)
    load()
  }

  const filtered = filterStatus === 'all' ? requests : requests.filter(r => r.status === filterStatus)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Údržba</h1>
          <p className="text-zinc-400 text-sm mt-1">{requests.filter(r => r.status !== 'resolved').length} otevřených požadavků</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700">
          <Plus size={16} className="mr-2" /> Přidat
        </Button>
      </div>

      <div className="flex gap-2 mb-4">
        {['open', 'in_progress', 'all', 'resolved'].map(s => (
          <Button
            key={s}
            variant={filterStatus === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus(s)}
            className={filterStatus === s ? 'bg-zinc-700' : 'border-zinc-700 text-zinc-400'}
          >
            {s === 'all' ? 'Vše' : statusLabel[s]}
          </Button>
        ))}
      </div>

      {showForm && (
        <Card className="bg-zinc-900 border-zinc-700 mb-6">
          <CardContent className="p-5 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="text-zinc-300 text-xs">Nemovitost</Label>
              <select
                value={form.property_id}
                onChange={e => setForm({ ...form, property_id: e.target.value })}
                className="w-full mt-1 rounded-md bg-zinc-800 border border-zinc-700 text-white px-3 py-2 text-sm"
              >
                <option value="">Vyberte nemovitost</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <Label className="text-zinc-300 text-xs">Název problému</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Nefungující topení..." className="bg-zinc-800 border-zinc-700 text-white mt-1" />
            </div>
            <div className="col-span-2">
              <Label className="text-zinc-300 text-xs">Popis</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Detailní popis..." className="bg-zinc-800 border-zinc-700 text-white mt-1 min-h-20" />
            </div>
            <div>
              <Label className="text-zinc-300 text-xs">Odhadované náklady (Kč)</Label>
              <Input type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} placeholder="5000" className="bg-zinc-800 border-zinc-700 text-white mt-1" />
            </div>
            <div className="flex items-end gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)} className="border-zinc-700 text-zinc-300">Zrušit</Button>
              <Button onClick={save} className="bg-blue-600 hover:bg-blue-700">Uložit</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-zinc-500 text-sm">Načítám...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <Wrench size={40} className="mx-auto mb-3 opacity-30" />
          <p>Žádné požadavky</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(r => (
            <Card key={r.id} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">{r.title}</span>
                      <Badge className={`text-xs border ${statusColor[r.status]}`}>{statusLabel[r.status]}</Badge>
                    </div>
                    <div className="text-xs text-zinc-500">{r.property?.name} · {formatDate(r.reported_at)}</div>
                    {r.description && <p className="text-sm text-zinc-400 mt-2">{r.description}</p>}
                    {r.cost && <div className="text-xs text-zinc-400 mt-1">Náklady: {formatCZK(r.cost)}</div>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {r.status === 'open' && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, 'in_progress')} className="border-zinc-700 text-zinc-300 h-8">Probíhá</Button>
                    )}
                    {r.status !== 'resolved' && (
                      <Button size="sm" onClick={() => updateStatus(r.id, 'resolved')} className="bg-green-600 hover:bg-green-700 h-8">
                        <CheckCircle size={14} className="mr-1" /> Vyřešeno
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
