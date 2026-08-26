type DisplayNameParts = {
  firstName?: string | null
  lastName?: string | null
  registrationName?: string | null
  accountName?: string | null
}

function clean(value?: string | null) {
  return value?.trim() || null
}

export function resolveDisplayName({
  firstName,
  lastName,
  registrationName,
  accountName,
}: DisplayNameParts) {
  const profileName = [clean(firstName), clean(lastName)].filter(Boolean).join(' ')
  return profileName || clean(registrationName) || clean(accountName) || null
}
