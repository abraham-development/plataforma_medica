export type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN'
export type AccountStatus = 'ACTIVE' | 'SUSPENDED'
export type DoctorVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED'
export type ConsultationMode = 'VIRTUAL' | 'HOME_VISIT'
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
export type PayoutMethodType = 'YAPE' | 'BANK_ACCOUNT'
export type BankAccountType = 'SAVINGS' | 'CHECKING'

export interface ApiErrorBody {
  statusCode: number
  code: string
  message: string
  requestId?: string
}

export interface Specialty {
  id: string
  name: string
  slug: string
  active: boolean
}

export interface District {
  id: string
  name: string
  province: 'LIMA' | 'CALLAO'
  active: boolean
}

export interface DoctorSummary {
  id: string
  firstName: string
  lastName: string
  displayName: string
  cmp: string
  bio: string | null
  avatarUrl: string | null
  verificationStatus: DoctorVerificationStatus
  consultationModes: ConsultationMode[]
  specialties: Specialty[]
  districts: District[]
}

export interface Appointment {
  id: string
  patientId: string
  doctorId: string
  consultationMode: ConsultationMode
  startsAt: string
  endsAt: string
  status: AppointmentStatus
  districtId: string | null
  address: string | null
  addressReference: string | null
  virtualMeetingUrl: string | null
  cancellationReason: string | null
  cancelledAt: string | null
  createdAt: string
}

interface PayoutMethodBase {
  id: string
  doctorId: string
  holderName: string
  currency: 'PEN'
  preferred: boolean
  createdAt: string
  updatedAt: string
}

export interface YapePayoutMethod extends PayoutMethodBase {
  type: 'YAPE'
  yapePhone: string
  bankName: null
  bankAccountType: null
  bankAccountNumber: null
  cci: null
}

export interface BankPayoutMethod extends PayoutMethodBase {
  type: 'BANK_ACCOUNT'
  yapePhone: null
  bankName: string
  bankAccountType: BankAccountType
  bankAccountNumber: string
  cci: string | null
}

export type DoctorPayoutMethod = YapePayoutMethod | BankPayoutMethod

export type PayoutMethodPayload =
  | {
      type: 'YAPE'
      holderName: string
      yapePhone: string
      preferred?: boolean
    }
  | {
      type: 'BANK_ACCOUNT'
      holderName: string
      bankName: string
      bankAccountType: BankAccountType
      bankAccountNumber: string
      cci?: string
      preferred?: boolean
    }

export interface AdminDoctorPayoutSummary {
  doctorId: string
  doctorName: string
  verificationStatus: DoctorVerificationStatus
  methodCount: number
  preferredType: PayoutMethodType | null
  preferredMaskedDestination: string | null
  methodsUpdatedAt: string | null
}

export class ApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly getAccessToken?: () => string | null | Promise<string | null>,
  ) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = await this.getAccessToken?.()
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    })
    if (!response.ok) throw (await response.json()) as ApiErrorBody
    return (await response.json()) as T
  }

  specialties() {
    return this.request<Specialty[]>('/specialties')
  }
  districts() {
    return this.request<District[]>('/districts')
  }
  doctors(query = '') {
    return this.request<DoctorSummary[]>(`/doctors${query ? `?${query}` : ''}`)
  }
  doctor(id: string) {
    return this.request<DoctorSummary>(`/doctors/${id}`)
  }
  appointments() {
    return this.request<Appointment[]>('/appointments/me')
  }
  book(payload: Record<string, unknown>) {
    return this.request<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }
  cancel(id: string, reason?: string) {
    return this.request<Appointment>(`/appointments/${id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    })
  }
  payoutMethods() {
    return this.request<DoctorPayoutMethod[]>('/doctors/me/payout-methods')
  }
  createPayoutMethod(payload: PayoutMethodPayload) {
    return this.request<DoctorPayoutMethod>('/doctors/me/payout-methods', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }
  updatePayoutMethod(id: string, payload: PayoutMethodPayload) {
    return this.request<DoctorPayoutMethod>(`/doctors/me/payout-methods/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  }
  deletePayoutMethod(id: string) {
    return this.request<{ deleted: true }>(`/doctors/me/payout-methods/${id}`, {
      method: 'DELETE',
    })
  }
  preferPayoutMethod(id: string) {
    return this.request<DoctorPayoutMethod>(`/doctors/me/payout-methods/${id}/preferred`, {
      method: 'POST',
    })
  }
  adminDoctorPayoutSummaries() {
    return this.request<AdminDoctorPayoutSummary[]>('/admin/doctor-payout-methods')
  }
  revealDoctorPayoutMethods(doctorId: string) {
    return this.request<DoctorPayoutMethod[]>(`/admin/doctors/${doctorId}/payout-methods/reveal`, {
      method: 'POST',
    })
  }
}
