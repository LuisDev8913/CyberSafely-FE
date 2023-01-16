import AccountIcon from '@mui/icons-material/AccountCircleOutlined'
import GroupIcon from '@mui/icons-material/GroupOutlined'
import HomeIcon from '@mui/icons-material/HomeOutlined'
import LogoutIcon from '@mui/icons-material/LogoutOutlined'
import PersonIcon from '@mui/icons-material/PersonOutlined'
import {
  Alert,
  AppBar,
  Box,
  CircularProgress,
  Container,
  Divider,
  List,
  Snackbar,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState } from 'react'
import { Config } from '../../helpers/config'
import { AnyUserRole, ParentRole, TeamRole, useProfileQuery } from '../../types/graphql'
import { useAlert } from '../../utils/context/alert'
import { AuthContextProvider, useTeam, useUser } from '../../utils/context/auth'
import { SidebarLink } from './SidebarLink'

function SidebarTeam() {
  const team = useTeam()

  if (!team) {
    return null
  }

  return <SidebarLink icon={<GroupIcon />} href="/dashboard/team" title={team.team.name} />
}

function useSessionStorage(key: string) {
  const [value, setValue] = useState<string | null>()

  useEffect(() => {
    setValue(sessionStorage.getItem(key))
  }, [key])

  const changeValue = useCallback(
    (value: string | null) => {
      setValue(value)

      if (typeof value === 'string') {
        sessionStorage.setItem(key, value)
      } else {
        sessionStorage.removeItem(key)
      }
    },
    [key]
  )

  return [value, changeValue] as const
}

function SidebarUser() {
  const router = useRouter()

  const { user } = useUser()
  const { pushAlert } = useAlert()

  const [hideConfirm, setHideConfirm] = useSessionStorage('hideConfirmAlert')

  return (
    <>
      <Snackbar
        sx={{ maxWidth: 350 }}
        open={!user.emailConfirmed && hideConfirm !== 'true'}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="warning" sx={{ width: '100%' }} onClose={() => setHideConfirm('true')}>
          Please confirm your e-mail address at <b>{user.email}</b>.
        </Alert>
      </Snackbar>
      <SidebarLink icon={<AccountIcon />} href="/dashboard/profile" title={user.name} />
      <SidebarLink
        title="Logout"
        color="error.main"
        icon={<LogoutIcon />}
        onClick={() => {
          pushAlert('Logout', 'Are you sure you want to logout?', () => {
            router.push('/auth/logout')
          })
        }}
      />
    </>
  )
}

export type DashboardLayoutProps = {
  children: JSX.Element | JSX.Element[]
  title: string
  sidebar: React.ReactNode
  search?: React.ReactNode
}

export function DashboardLayout(props: DashboardLayoutProps) {
  const router = useRouter()

  const { data, error } = useProfileQuery({
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
    initialFetchPolicy: 'network-only',
  })

  useEffect(() => {
    if (error) {
      router.push('/auth/login')
    }
  }, [error])

  if (!data) {
    return <CircularProgress />
  }

  return (
    <AuthContextProvider user={data.profile}>
      <Head>
        <title>{props.title}</title>
      </Head>
      <Box minHeight="100vh" display="flex" flexDirection="column">
        <AppBar>
          <Toolbar disableGutters sx={{ px: 2 }}>
            <Typography variant="h6" noWrap flexGrow={1}>
              {Config.appName}
            </Typography>
          </Toolbar>
        </AppBar>
        <Toolbar />
        <Stack direction="row" spacing={0} flexGrow={1}>
          <Stack spacing={0} top={0} left={0} bottom={0} position="fixed" zIndex={(e) => e.zIndex.drawer}>
            <Toolbar />
            <Stack
              width={280}
              spacing={0}
              flexGrow={1}
              overflow="auto"
              borderRight={1}
              borderColor="divider"
              flexDirection="column"
              bgcolor="background.paper"
            >
              {props.sidebar}
              <Box flexGrow={1} />
              <Divider />
              <List>
                <SidebarTeam />
                <SidebarUser />
              </List>
            </Stack>
          </Stack>
          <Box width={280} flexShrink={0} />
          <Container maxWidth="xl" sx={{ py: 2 }}>
            {props.children}
          </Container>
        </Stack>
      </Box>
    </AuthContextProvider>
  )
}

function Sidebar() {
  const { user } = useUser()

  const staff = user.roles.find((e) => e.role === 'STAFF') as AnyUserRole | undefined
  const coach = user.roles.find((e) => e.role === 'COACH') as TeamRole | undefined
  const athlete = user.roles.find((e) => e.role === 'ATHLETE') as TeamRole | undefined
  const parent = user.roles.find((e) => e.role === 'PARENT') as ParentRole | undefined

  if (staff) {
    return (
      <List>
        <SidebarLink href="/dashboard/staff/home" icon={<HomeIcon />} title="Home" />
        <SidebarLink href="/dashboard/staff/users" icon={<PersonIcon />} title="Users" />
        <SidebarLink href="/dashboard/staff/teams" icon={<GroupIcon />} title="Teams" />
      </List>
    )
  } else if (coach) {
    return (
      <List>
        <SidebarLink href="/dashboard/coach/home" icon={<HomeIcon />} title="Home" />
        <SidebarLink href="/dashboard/coach/members" icon={<PersonIcon />} title="Members" />
      </List>
    )
  } else if (athlete) {
    return (
      <List>
        <SidebarLink href="/dashboard/athlete/home" icon={<HomeIcon />} title="Home" />
        <SidebarLink href="/dashboard/athlete/members" icon={<PersonIcon />} title="Members" />
      </List>
    )
  } else if (parent) {
    return (
      <List>
        <SidebarLink href="/dashboard/parent/home" icon={<HomeIcon />} title="Home" />
        <SidebarLink href="/dashboard/parent/children" icon={<GroupIcon />} title="Children" />
      </List>
    )
  }

  return null
}

export function withDashboardLayout(
  Component: React.ComponentType<any>,
  layoutProps: Omit<DashboardLayoutProps, 'children' | 'sidebar'>
) {
  return function Wrapper(props: any) {
    return (
      <DashboardLayout {...layoutProps} sidebar={<Sidebar />} title={[layoutProps.title, 'Dashboard'].join(' | ')}>
        <Component {...props} />
      </DashboardLayout>
    )
  }
}