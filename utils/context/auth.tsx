import { useRouter } from 'next/router'
import { createContext, useCallback, useContext, useMemo } from 'react'
import { ProfileQuery, TeamRole } from '../../types/graphql'

type AuthContext = {
  user: ProfileQuery['profile']
}

const AuthContext = createContext<Partial<AuthContext>>({})

type AuthContextProviderProps = {
  children: JSX.Element | JSX.Element[]
} & AuthContext

export function AuthContextProvider(props: AuthContextProviderProps) {
  const { children, ...context } = props

  return <AuthContext.Provider value={context}>{children}</AuthContext.Provider>
}

export function useUser() {
  const router = useRouter()
  const { user } = useContext(AuthContext)

  const logout = useCallback(() => {
    localStorage.clear()
    sessionStorage.clear()
    router.push('/auth/login')
  }, [])

  if (!user) {
    throw new Error('User was not found')
  }

  return { user, logout }
}

export function useTeam() {
  const { user } = useContext(AuthContext)

  const role = useMemo(() => {
    if (user && localStorage) {
      const teamId = localStorage.getItem('teamId')

      if (teamId) {
        const role = user.roles.find((e) => e.role === 'COACH' || e.role === 'ATHLETE') as TeamRole | undefined

        if (role && role.team.id === teamId) {
          return role
        }
      }
    }
  }, [user])

  return role
}