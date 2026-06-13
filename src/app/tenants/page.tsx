'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCZK, formatDate, daysUntil } from '@/lib/utils'
import type { Tenant, Property } from '@/lib/database.types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users, Plus, Phone, Mail, AlertCircle } from 'lucide-react'

export default function TenantsPage() {
  const [tenants, setTenants] = useState<(Tenant & { property: Property | null })[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    property_id: '', name: '', email: '', phone: '',
    lease_start: '', lease_end: '', rent_amount: '', deposit: '', notes: '',
  })

  async function load() {
    const [{ data: ts }, { data: ps }] = await Promise.all([
      (supabase as any).from('tenants').select('*, property:properties(*)').eq('active', true).order('name'),
      (supabase as any).from('properties').select('*').order('name'),
    ])
    setTenants(ts || [])
    setProperties(ps || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function save() {
    await (supabase as any).from('tenants').insert([{
      ...form,
      rent_amount: Number(form.rent_amount),
      deposit: Number(form.deposit),
      active: true,
    }])
    setForm({ property_id: '', name: '', email: '', phone: '', lease_start: '', lease_end: '', rent_amount: '', deposit: '', notes: '' })
    setShowForm(false)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Nájemníci</h1>
          <p className="text-zinc-400 text-sm mt-1">{tenants.length} aktivních nájemníků</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700">
          <Plus size={16} className="mr-2" /> Přidat
        </Button>
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
            <div>
              <Label className="text-zinc-300 text-xs">Jméno</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jan Novák" className="bg-zinc-800 border-zinc-700 text-white mt-1" />
            </div>
            <div>
              <Label className="text-zinc-300 text-xs">Email</Label>
              <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jan@email.cz" className="bg-zinc-800 border-zinc-700 text-white mt-1" />
            </div>
            <div>
              <Label className="text-zinc-300 text-xs">Telefon</Label>
              <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+420 777 888 999" className="bg-zinc-800 border-zinc-700 text-white mt-1" />
            </div>
            <div>
              <Label className="text-zinc-300 text-xs">Nájem (Kč/měs)</Label>
              <Input type="number" value={form.rent_amount} onChange={e => setForm({ ...form, rent_amount: e.target.value })} placeholder="15000" className="bg-zinc-800 border-zinc-700 text-white mt-1" />
            </div>
            <div>
              <Label className="text-zinc-300 text-xs">Kauce (Kč)</Label>
              <Input type="number" value={form.deposit} onChange={e => setForm({ ...form, deposit: e.target.value })} placeholder="30000" className="bg-zinc-800 border-zinc-700 text-white mt-1" />
            </div>
            <div>
              <Label className="text-zinc-300 text-xs">Nájem od</Label>
              <Input type="date" value={form.lease_start} onChange={e => setForm({ ...form, lease_start: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white mt-1" />
            </div>
            <div>
              <Label className="text-zinc-300 text-xs">Nájem do</Label>
              <Input type="date" value={form.lease_end} onChange={e => setForm({ ...form, lease_end: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white mt-1" />
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
      ) : tenants.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p>Zatím žádní nájemníci</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tenants.map(t => {
            const daysLeft = daysUntil(t.lease_end)
            const expiringSoon = daysLeft >= 0 && daysLeft <= 60
            return (
              <Card key={t.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                    {t.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{t.name}</span>
                      {expiringSoon && <Badge variant="destructive" className="text-xs"><AlertCircle size={10} className="mr-1" />Končí za {daysLeft}d</Badge>}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">{t.property?.name}</div>
                    <div className="flex items-center gap-4 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-zinc-400"><Mail size={11} />{t.email}</span>
                      {t.phone && <span className="flex items-center gap-1 text-xs text-zinc-400"><Phone size={11} />{t.phone}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold text-white">{formatCZK(t.rent_amount)}<span className="text-zinc-500 text-xs font-normal">/měs</span></div>
                    <div className="text-xs text-zinc-500 mt-0.5">do {formatDate(t.lease_end)}</div>
                    <div className="text-xs text-zinc-600 mt-0.5">kauce {formatCZK(t.deposit)}</div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
