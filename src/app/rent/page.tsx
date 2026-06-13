'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCZK, formatDate } from '@/lib/utils'
import type { RentPayment, Tenant, Property } from '@/lib/database.types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CreditCard, Plus, CheckCircle } from 'lucide-react'

const statusLabel: Record<string, string> = { paid: 'Zaplaceno', pending: 'Čeká', overdue: 'Po splatnosti' }
const statusColor: Record<string, string> = {
  paid: 'bg-green-500/10 text-green-400 border-green-500/20',
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
}

type PaymentRow = RentPayment & { tenant: Tenant | null; property: Property | null }

export default function RentPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [form, setForm] = useState({ tenant_id: '', property_id: '', amount: '', due_date: '', note: '' })

  async function load() {
    const [{ data: ps }, { data: ts }, { data: pays }] = await Promise.all([
      (supabase as any).from('properties').select('*').order('name'),
      (supabase as any).from('tenants').select('*').eq('active', true).order('name'),
      (supabase as any).from('rent_payments').select('*, tenant:tenants(*), property:properties(*)').order('due_date', { ascending: false }),
    ])
    setProperties(ps || [])
    setTenants(ts || [])
    setPayments(pays || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function save() {
    await (supabase as any).from('rent_payments').insert([{ ...form, amount: Number(form.amount), status: 'pending' }])
    setForm({ tenant_id: '', property_id: '', amount: '', due_date: '', note: '' })
    setShowForm(false)
    load()
  }

  async function markPaid(id: string) {
    await (supabase as any).from('rent_payments').update({ status: 'paid', paid_date: new Date().toISOString().split('T')[0] }).eq('id', id)
    load()
  }

  const filtered = filterStatus === 'all' ? payments : payments.filter(p => p.status === filterStatus)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Platby nájmu</h1>
          <p className="text-zinc-400 text-sm mt-1">{payments.length} záznamů</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700">
          <Plus size={16} className="mr-2" /> Přidat platbu
        </Button>
      </div>

      <div className="flex gap-2 mb-4">
        {['all', 'pending', 'overdue', 'paid'].map(s => (
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
            <div>
              <Label className="text-zinc-300 text-xs">Nájemník</Label>
              <select
                value={form.tenant_id}
                onChange={e => {
                  const t = tenants.find(t => t.id === e.target.value)
                  setForm({ ...form, tenant_id: e.target.value, property_id: t?.property_id || '', amount: String(t?.rent_amount || '') })
                }}
                className="w-full mt-1 rounded-md bg-zinc-800 border border-zinc-700 text-white px-3 py-2 text-sm"
              >
                <option value="">Vyberte nájemníka</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-zinc-300 text-xs">Částka (Kč)</Label>
              <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="15000" className="bg-zinc-800 border-zinc-700 text-white mt-1" />
            </div>
            <div>
              <Label className="text-zinc-300 text-xs">Datum splatnosti</Label>
              <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white mt-1" />
            </div>
            <div>
              <Label className="text-zinc-300 text-xs">Poznámka</Label>
              <Input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Leden 2026..." className="bg-zinc-800 border-zinc-700 text-white mt-1" />
            </div>
            <div className="col-span-2 flex gap-3 justify-end">
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
          <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
          <p>Žádné platby</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(p => (
            <Card key={p.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{p.tenant?.name || '—'}</span>
                    <Badge className={`text-xs border ${statusColor[p.status]}`}>{statusLabel[p.status]}</Badge>
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {p.property?.name} · Splatnost: {formatDate(p.due_date)}
                    {p.note && ` · ${p.note}`}
                  </div>
                  {p.paid_date && <div className="text-xs text-green-400 mt-0.5">Zaplaceno: {formatDate(p.paid_date)}</div>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-bold text-white">{formatCZK(p.amount)}</span>
                  {p.status !== 'paid' && (
                    <Button size="sm" onClick={() => markPaid(p.id)} className="bg-green-600 hover:bg-green-700 h-8 px-3">
                      <CheckCircle size={14} className="mr-1" /> Zaplaceno
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
