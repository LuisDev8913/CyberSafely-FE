import { Divider, Link, Stack, Typography } from '@mui/material'
import NextImage from 'next/image'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { z } from 'zod'
import { CoverLayout } from '../../../components/common/CoverLayout'
import { NextLink } from '../../../components/common/NextLink'
import { Form } from '../../../components/common/form/Form'
import { FormText } from '../../../components/common/form/FormText'
import { Config } from '../../../helpers/config'
import { useLogoUrl } from '../../../helpers/hooks'
import { useLoginWithEmailMutation, useSettingsQuery } from '../../../schema'
import { useAlert } from '../../../utils/context/alert'
import { StorageManager } from '../../../utils/storage'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
})

function RegisterButton() {
  const { data } = useSettingsQuery()

  if (!data?.settings.enableSignUps) {
    return null
  }

  return (
    <>
      <Divider />
      <Typography>
        Don’t have an account?{' '}
        <NextLink href="/auth/register">
          <Link>Register</Link>
        </NextLink>
      </Typography>
    </>
  )
}

const demoSchema = z.object({
  email: z.string().email(),
  phone: z.string(),
})

function DemoEmailModal({
  email,
  phone,
  onSubmit,
}: {
  email: string
  phone: string
  onSubmit: (value: z.infer<typeof demoSchema>) => void
}) {
  return (
    <Form schema={demoSchema} onSubmit={onSubmit} defaultValues={{ email, phone }}>
      <Typography>You are in demo mode, enter a temporary valid e-mail address to receive post e-mails:</Typography>
      <FormText name="email" label="E-mail" type="email" required />
      <FormText name="phone" label="Phone Number" type="phone" />
    </Form>
  )
}

export default function Login() {
  const logoUrl = useLogoUrl()
  const { pushAlert } = useAlert()
  const router = useRouter()

  const [login] = useLoginWithEmailMutation({
    onCompleted: async (data, options) => {
      async function login(demoEmail?: string, demoPhone?: string) {
        const { token, user } = data.loginWithEmail

        StorageManager.clear()

        if (!!demoEmail) StorageManager.set('demoEmail', demoEmail)
        if (!!demoPhone) StorageManager.set('demoPhone', demoPhone)

        StorageManager.set('token', token)
        StorageManager.set('userId', user.id)

        await options?.client?.clearStore()

        router.push('/dashboard')
      }

      if (Config.demo) {
        pushAlert({
          title: '',
          type: 'custom',
          content: DemoEmailModal,
          props: {
            email: data.loginWithEmail.user.email,
            phone: data.loginWithEmail.user.phoneNumber ?? '',
          },
          result: async ({ email, phone }) => {
            await login(email, phone)
          },
        })
      } else {
        await login()
      }
    },
  })

  useEffect(() => {
    if (!!StorageManager.get('token')) {
      router.push('/dashboard')
    }
  }, [])

  return (
    <CoverLayout>
      <Stack>
        <NextImage alt="Logo" src={logoUrl} height={75} width={162} />
        <Form
          schema={schema}
          onSubmit={async (input) => {
            await login({ variables: { input } })
          }}
        >
          <Typography variant="h5" fontWeight="bold">
            Login to CyberSafely.ai
          </Typography>
          <FormText name="email" label="E-mail" type="email" required />
          <FormText name="password" label="Password" type="password" required hidePasswordStrength />
        </Form>
        <NextLink href="/auth/reset">
          <Link textAlign="right">Forgot password?</Link>
        </NextLink>
        <RegisterButton />
      </Stack>
    </CoverLayout>
  )
}
