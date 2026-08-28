import { render, screen } from '@testing-library/react'
import { LoginForm, OAuthRoleForm, RegisterForm } from './auth-forms'

jest.mock('@/app/actions/auth', () => ({
  beginGoogleOAuth: jest.fn(),
  completeOAuthRegistration: jest.fn(),
  resendVerification: jest.fn(),
  resetPassword: jest.fn(),
  sendPasswordReset: jest.fn(),
  signIn: jest.fn(),
  signUp: jest.fn(),
  verifyRegistration: jest.fn(),
}))

describe('OAuth auth forms', () => {
  it('offers Google during registration after choosing a public role', () => {
    render(<RegisterForm />)

    expect(screen.getByLabelText('Paciente')).toBeChecked()
    expect(screen.getByLabelText('Médico')).not.toBeChecked()
    expect(screen.getByRole('button', { name: 'Continuar con Google' })).toHaveAttribute(
      'formnovalidate',
    )
    expect(screen.getByDisplayValue('register')).toHaveAttribute('name', 'oauth_intent')
  })

  it('offers Google during login and preserves a safe destination', () => {
    render(<LoginForm nextPath="/paciente/citas" />)

    expect(screen.getByRole('button', { name: 'Continuar con Google' })).toBeVisible()
    expect(screen.getByDisplayValue('/paciente/citas')).toHaveAttribute('name', 'next')
  })

  it('only offers patient and doctor when completing an OAuth account', () => {
    render(<OAuthRoleForm />)

    expect(screen.getAllByRole('radio')).toHaveLength(2)
    expect(screen.queryByText('Administrador')).not.toBeInTheDocument()
  })
})
