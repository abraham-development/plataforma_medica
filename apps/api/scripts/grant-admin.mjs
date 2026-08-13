import { createAdminClient } from '@insforge/sdk'

const userId = process.argv[2]
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

if (!userId || !uuid.test(userId)) {
  console.error('Uso: pnpm --filter @medicerca/api admin:grant <user-id>')
  process.exit(1)
}
if (!process.env.INSFORGE_URL || !process.env.INSFORGE_API_KEY) {
  console.error('Define INSFORGE_URL e INSFORGE_API_KEY solo en el entorno del operador.')
  process.exit(1)
}

const admin = createAdminClient({
  baseUrl: process.env.INSFORGE_URL,
  apiKey: process.env.INSFORGE_API_KEY,
})
const { data: user, error: userError } = await admin.database
  .from('users')
  .select('id')
  .eq('id', userId)
  .maybeSingle()

if (userError) throw userError
if (!user) throw new Error('El usuario no existe. Primero debe registrarse y verificar su correo.')

const { data: existing, error: roleError } = await admin.database
  .from('user_roles')
  .select('role')
  .eq('user_id', userId)
  .eq('role', 'ADMIN')
  .maybeSingle()
if (roleError) throw roleError

if (!existing) {
  const { error } = await admin.database
    .from('user_roles')
    .insert([{ user_id: userId, role: 'ADMIN' }])
  if (error) throw error
}

console.log(`Rol ADMIN asignado a ${userId}.`)
