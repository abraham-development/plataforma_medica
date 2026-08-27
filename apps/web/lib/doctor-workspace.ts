export const doctorWorkspaceLinks = [
  { href: '/medico', label: 'Resumen' },
  { href: '/medico/perfil', label: 'Perfil profesional' },
  { href: '/medico/agenda', label: 'Agenda' },
  { href: '/medico/disponibilidad', label: 'Disponibilidad' },
  { href: '/medico/metodo-de-pago', label: 'Método de pago' },
] as const

export const patientWorkspaceLinks = [
  { href: '/paciente', label: 'Resumen' },
  { href: '/paciente/citas', label: 'Mis citas' },
  { href: '/paciente/perfil', label: 'Mi perfil' },
  { href: '/medicos', label: 'Buscar médicos' },
] as const

export type WorkspaceRole = 'DOCTOR' | 'PATIENT'

export type WorkspaceDefinition = {
  role: WorkspaceRole
  title: string
  areaLabel: string
  home: string
  profile: string
  navigationLabel: string
  mobileLabel: string
  links: readonly { href: string; label: string }[]
}

export const doctorWorkspace: WorkspaceDefinition = {
  role: 'DOCTOR',
  title: 'Panel médico',
  areaLabel: 'Área profesional',
  home: '/medico',
  profile: '/medico/perfil',
  navigationLabel: 'Navegación del espacio médico',
  mobileLabel: 'Menú médico',
  links: doctorWorkspaceLinks,
}

export const patientWorkspace: WorkspaceDefinition = {
  role: 'PATIENT',
  title: 'Panel del paciente',
  areaLabel: 'Área del paciente',
  home: '/paciente',
  profile: '/paciente/perfil',
  navigationLabel: 'Navegación del panel del paciente',
  mobileLabel: 'Menú del paciente',
  links: patientWorkspaceLinks,
}

export function isDoctorWorkspacePath(pathname: string) {
  return pathname === '/medico' || pathname.startsWith('/medico/')
}

export function isPatientWorkspacePath(pathname: string) {
  return pathname === '/paciente' || pathname.startsWith('/paciente/')
}

export function workspaceForPath(pathname: string) {
  if (isDoctorWorkspacePath(pathname)) return doctorWorkspace
  if (isPatientWorkspacePath(pathname)) return patientWorkspace
  return null
}
