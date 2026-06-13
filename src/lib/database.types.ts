export type PropertyStatus = 'occupied' | 'vacant' | 'maintenance'
export type PaymentStatus = 'paid' | 'pending' | 'overdue'
export type RequestStatus = 'open' | 'in_progress' | 'resolved'

export interface Property {
  id: string
  name: string
  address: string
  city: string
  type: string
  rent_amount: number
  status: PropertyStatus
  notes: string | null
  created_at: string
}

export interface Tenant {
  id: string
  property_id: string
  name: string
  email: string
  phone: string | null
  lease_start: string
  lease_end: string
  rent_amount: number
  deposit: number
  notes: string | null
  active: boolean
  created_at: string
  property?: Property
}

export interface RentPayment {
  id: string
  tenant_id: string
  property_id: string
  amount: number
  due_date: string
  paid_date: string | null
  status: PaymentStatus
  note: string | null
  created_at: string
  tenant?: Tenant
  property?: Property
}

export interface MaintenanceRequest {
  id: string
  property_id: string
  title: string
  description: string
  status: RequestStatus
  cost: number | null
  reported_at: string
  resolved_at: string | null
  created_at: string
  property?: Property
}

export interface Database {
  public: {
    Tables: {
      properties: { Row: Property; Insert: Omit<Property, 'id' | 'created_at'>; Update: Partial<Property> }
      tenants: { Row: Tenant; Insert: Omit<Tenant, 'id' | 'created_at'>; Update: Partial<Tenant> }
      rent_payments: { Row: RentPayment; Insert: Omit<RentPayment, 'id' | 'created_at'>; Update: Partial<RentPayment> }
      maintenance_requests: { Row: MaintenanceRequest; Insert: Omit<MaintenanceRequest, 'id' | 'created_at'>; Update: Partial<MaintenanceRequest> }
    }
  }
}
