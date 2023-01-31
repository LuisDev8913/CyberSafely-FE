import AddIcon from '@mui/icons-material/AddOutlined'
import { Button } from '@mui/material'
import { GridColumns } from '@mui/x-data-grid'
import { GetServerSideProps } from 'next'
import { useMemo } from 'react'
import { DataGridActions, DataGridViewer, InferNodeType } from '../../../../../components/common/DataGridViewer'
import { SearchBar } from '../../../../../components/common/SearchBar'
import { UserEmail } from '../../../../../components/common/UserEmail'
import { UserRoles } from '../../../../../components/common/UserRoles'
import { withDashboardLayout } from '../../../../../components/dashboard/Layout'
import { MemberActions } from '../../../../../components/data/MemberActions'
import { InviteMemberForm } from '../../../../../components/form/InviteMemberForm'
import {
  MembersQuery,
  namedOperations,
  useInviteMemberMutation,
  useMembersQuery,
  useTeamQuery,
} from '../../../../../types/graphql'
import { useAlert } from '../../../../../utils/context/alert'

const getColumns: (teamId: string) => GridColumns<InferNodeType<MembersQuery['members']>> = (teamId) => [
  {
    width: 250,
    field: 'name',
    headerName: 'Name',
  },
  {
    width: 300,
    field: 'email',
    headerName: 'E-mail',
    valueGetter(params) {
      return params.row
    },
    renderCell(params) {
      return <UserEmail {...params.value} />
    },
  },
  {
    width: 200,
    field: 'roles',
    sortable: false,
    headerName: 'Roles',
    valueGetter(params) {
      return params.row.roles
    },
    renderCell(params) {
      return <UserRoles roles={params.value} />
    },
  },
  {
    width: 150,
    field: 'parentCount',
    headerName: 'Parents',
  },
  {
    width: 200,
    field: 'createdAt',
    headerName: 'Joined',
    valueFormatter(params) {
      return new Date(params.value).toLocaleString()
    },
  },
  {
    width: 200,
    field: 'actions',
    type: 'actions',
    renderCell(params) {
      return <MemberActions memberId={params.row.id} teamId={teamId} />
    },
  },
]

type Props = {
  teamId: string
}

function Team({ teamId }: Props) {
  const { pushAlert } = useAlert()

  const { data } = useTeamQuery({
    variables: { id: teamId },
  })
  const query = useMembersQuery({
    context: { teamId },
  })

  const [inviteMember] = useInviteMemberMutation({
    context: { teamId },
    refetchQueries: [namedOperations.Query.members],
  })

  const columns = useMemo(() => getColumns(teamId), [teamId])

  return (
    <DataGridViewer
      query={query}
      columns={columns}
      data={query.data?.members}
      back="/dashboard/staff/teams"
      initialSortModel={{ field: 'createdAt', sort: 'desc' }}
      title={data ? `Members of "${data.team.name}"` : 'Members'}
      href={(e) => `/dashboard/staff/teams/${teamId}/members/${e.id}`}
      actions={
        <DataGridActions>
          <Button
            fullWidth
            startIcon={<AddIcon />}
            onClick={() => {
              pushAlert({
                type: 'custom',
                title: 'Invite Member',
                message: 'Enter the information below',
                content: InviteMemberForm,
                result: (variables) => {
                  inviteMember({ variables })
                },
              })
            }}
          >
            Invite Member
          </Button>
          <SearchBar onSearch={(search) => query.refetch({ search })} />
        </DataGridActions>
      }
    />
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const teamId = ctx.params!.teamId as string
  return { props: { teamId } }
}

export default withDashboardLayout(Team, {
  title: 'Members',
})
