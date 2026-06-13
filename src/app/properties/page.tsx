'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCZK } from '@/lib/utils'
import type { Property } from '@/lib/database.types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, Plus, MapPin } from 'lucide-react'

const statusLabel: Record<string, string> = { occupied: 'Obsazeno', vacant: 'Volné', maintenance: 'Údržba' }
const statusColor: Record<string, string> = { occupied: 'bg-green-500/10 text-green-400 border-green-500/20', vacant: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', maintenance: 'bg-red-500/10 text-red-400 border-red-500/20' }

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', city: '', type: 'byt', rent_amount: '', status: 'vacant' as Property['status'], notes: '' })

  async function load() {
    const { data } = await (supabase as any).from('properties').select('*').order('name')
    setProperties(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function save() {
    await (supabase as any).from('properties').insert([{ ...form, rent_amount: Number(form.rent_amount) }])
    setForm({ name: '', address: '', city: '', type: 'byt', rent_amount: '', status: 'vacant', notes: '' })
    setShowForm(false)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Nemovitosti</h1>
          <p className="text-zinc-400 text-sm mt-1">{properties.length} nemovitostí celkem</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700">
          <Plus size={16} className="mr-2" /> Přidat
        </Button>
      </div>

      {showForm && (
        <Card className="bg-zinc-900 border-zinc-700 mb-6">
          <CardContent className="p-5 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="text-zinc-300 text-xs">Název</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Např. Byt Praha 2" className="bg-zinc-800 border-zinc-700 text-white mt-1" />
            </div>
            <div>
              <Label className="text-zinc-300 text-xs">Adresa</Label>
              <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Ulice 123" className="bg-zinc-800 border-zinc-700 text-white mt-1" />
            </div>
            <div>
              <Label className="text-zinc-300 text-xs">Město</Label>
              <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Praha" className="bg-zinc-800 border-zinc-700 text-white mt-1" />
            </div>
            <div>
              <Label className="text-zinc-300 text-xs">Typ</Label>
              <Input value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} placeholder="byt / dům / kancelář" className="bg-zinc-800 border-zinc-700 text-white mt-1" />
            </div>
            <div>
              <Label className="text-zinc-300 text-xs">Nájem (Kč/měs)</Label>
              <Input type="number" value={form.rent_amount} onChange={e => setForm({ ...form, rent_amount: e.target.value })} placeholder="15000" className="bg-zinc-800 border-zinc-700 text-white mt-1" />
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
      ) : properties.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <Building2 size={40} className="mx-auto mb-3 opacity-30" />
          <p>Zatím žádné nemovitosti</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {properties.map(p => (
            <Card key={p.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-white">{p.name}</div>
                    <div className="flex items-center gap-1 text-zinc-400 text-xs mt-1">
                      <MapPin size={12} /> {p.address}, {p.city}
                    </div>
                  </div>
                  <Badge className={`text-xs border ${statusColor[p.status]}`}>{statusLabel[p.status]}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-xs">{p.type}</span>
                  <span className="text-white font-semibold">{formatCZK(p.rent_amount)}<span className="text-zinc-500 text-xs font-normal">/měs</span></span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
