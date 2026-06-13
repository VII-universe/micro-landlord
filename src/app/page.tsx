'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatCZK } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Users, CreditCard, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const [properties, setProperties] = useState<any[]>([])
  const [tenants, setTenants] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: ps }, { data: ts }, { data: pays }, { data: rs }] = await Promise.all([
        (supabase as any).from('properties').select('*'),
        (supabase as any).from('tenants').select('*').eq('active', true),
        (supabase as any).from('rent_payments').select('*').eq('status', 'overdue'),
        (supabase as any).from('maintenance_requests').select('*').neq('status', 'resolved'),
      ])
      setProperties(ps || [])
      setTenants(ts || [])
      setPayments(pays || [])
      setRequests(rs || [])
      setLoading(false)
    }
    load()
  }, [])

  const occupied = properties.filter((p: any) => p.status === 'occupied').length
  const totalRent = tenants.reduce((sum: number, t: any) => sum + (t.rent_amount || 0), 0)
  const overdueCount = payments.length
  const openRequests = requests.length

  const stats = [
    { title: 'Nemovitosti', value: loading ? '…' : `${occupied} / ${properties.length}`, sub: 'obsazených', icon: Building2, href: '/properties', color: 'text-blue-400' },
    { title: 'Nájemníci', value: loading ? '…' : tenants.length, sub: 'aktivní', icon: Users, href: '/tenants', color: 'text-green-400' },
    { title: 'Měsíční nájem', value: loading ? '…' : formatCZK(totalRent), sub: 'celkem', icon: CreditCard, href: '/rent', color: 'text-purple-400' },
    { title: 'Po splatnosti', value: loading ? '…' : overdueCount, sub: 'plateb', icon: AlertTriangle, href: '/rent', color: overdueCount > 0 ? 'text-red-400' : 'text-zinc-500' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Přehled</h1>
        <p className="text-zinc-400 text-sm mt-1">Přehled vašich nemovitostí</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ title, value, sub, icon: Icon, href, color }) => (
          <Link key={title} href={href}>
            <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-colors cursor-pointer">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-zinc-400">{title}</CardTitle>
                  <Icon size={16} className={color} />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold text-white">{value}</div>
                <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm text-zinc-300">Údržba — otevřené požadavky ({openRequests})</CardTitle>
          </CardHeader>
          <CardContent>
            {(requests || []).length === 0 ? (
              <p className="text-zinc-500 text-sm">Žádné otevřené požadavky</p>
            ) : (
              <div className="flex flex-col gap-2">
                {(requests || []).slice(0, 5).map((r: any) => (
                  <Link key={r.id} href="/maintenance" className="flex items-center justify-between hover:bg-zinc-800 -mx-2 px-2 py-1.5 rounded">
                    <span className="text-sm text-zinc-200">{r.title}</span>
                    <Badge variant={r.status === 'open' ? 'destructive' : 'secondary'} className="text-xs">
                      {r.status === 'open' ? 'Nový' : 'Probíhá'}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm text-zinc-300">Platby po splatnosti ({overdueCount})</CardTitle>
          </CardHeader>
          <CardContent>
            {(payments || []).length === 0 ? (
              <p className="text-zinc-500 text-sm">Všechny platby jsou v pořádku</p>
            ) : (
              <div className="flex flex-col gap-2">
                {(payments || []).slice(0, 5).map((p: any) => (
                  <Link key={p.id} href="/rent" className="flex items-center justify-between hover:bg-zinc-800 -mx-2 px-2 py-1.5 rounded">
                    <span className="text-sm text-zinc-200">{p.note || `Platba ${p.id.slice(0, 8)}`}</span>
                    <span className="text-red-400 text-sm font-medium">{formatCZK(p.amount)}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
