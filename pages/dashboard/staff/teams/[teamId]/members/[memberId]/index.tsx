import AddIcon from '@mui/icons-material/AddOutlined'
import { Button } from '@mui/material'
import { GridColumns } from '@mui/x-data-grid'
import { GetServerSideProps } from 'next'
import { DataGridViewer, InferNodeType } from '../../../../../../../components/common/DataGridViewer'
import { SearchBar } from '../../../../../../../components/common/SearchBar'
import { UserEmail } from '../../../../../../../components/common/UserEmail'
import { withDashboardLayout } from '../../../../../../../components/dashboard/Layout'
import {
  namedOperations,
  ParentsQuery,
  useInviteParentMutation,
  useMemberQuery,
  useParentsQuery,
} from '../../../../../../../types/graphql'
import { useAlert } from '../../../../../../../utils/context/alert'

const columns: GridColumns<InferNodeType<ParentsQuery['parents']>> = [
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
    field: 'relation',
    sortable: false,
    headerName: 'Relation',
    valueGetter(params) {
      return params.row.parentRole?.relation
    },
  },
  {
    width: 200,
    field: 'createdAt',
    headerName: 'Joined',
    valueFormatter(params) {
      return new Date(params.value).toLocaleString()
    },
  },
]

type Props = {
  teamId: string
  memberId: string
}

function Member({ teamId, memberId }: Props) {
  const { pushAlert } = useAlert()

  const { data } = useMemberQuery({
    context: { teamId },
    variables: { id: memberId },
  })
  const query = useParentsQuery({
    context: { teamId },
    variables: { childId: memberId },
  })

  const [inviteParent] = useInviteParentMutation({
    context: { teamId },
    refetchQueries: [namedOperations.Query.parents],
  })

  return (
    <DataGridViewer
      query={query}
      columns={columns}
      data={query.data?.parents}
      back={`/dashboard/staff/teams/${teamId}`}
      title={data ? `Parents of "${data.member.name}"` : 'Parents'}
      actions={
        <>
          <Button
            startIcon={<AddIcon />}
            onClick={async () => {
              pushAlert(
                'Invite parent',
                'Enter the e-mail below:',
                (email) => {
                  inviteParent({ variables: { childId: memberId, email } })
                },
                true
              )
            }}
          >
            Invite Parent
          </Button>
          <SearchBar onSearch={(search) => query.refetch({ search })} />
        </>
      }
    />
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const teamId = ctx.params!.teamId as string
  const memberId = ctx.params!.memberId as string
  return { props: { teamId, memberId } }
}

export default withDashboardLayout(Member, {
  title: 'Members',
})
