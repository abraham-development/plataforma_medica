import { resolveDisplayName } from './session-identity'

describe('resolveDisplayName', () => {
  it('uses the registration name while the role profile is incomplete', () => {
    expect(
      resolveDisplayName({
        firstName: null,
        lastName: null,
        registrationName: ' Alicia ',
        accountName: 'Usuario',
      }),
    ).toBe('Alicia')
  })

  it('prefers the completed profile name', () => {
    expect(
      resolveDisplayName({
        firstName: 'Alicia María',
        lastName: 'Torres',
        registrationName: 'Alicia',
        accountName: 'Alicia',
      }),
    ).toBe('Alicia María Torres')
  })
})
