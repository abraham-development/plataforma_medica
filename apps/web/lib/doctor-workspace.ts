export const doctorWorkspaceLinks = [
  { href: '/medico', label: 'Resumen' },
  { href: '/medico/perfil', label: 'Perfil profesional' },
  { href: '/medico/agenda', label: 'Agenda' },
  { href: '/medico/disponibilidad', label: 'Disponibilidad' },
]

export function isDoctorWorkspacePath(pathname: string) {
  return pathname === '/medico' || pathname.startsWith('/medico/')
}
