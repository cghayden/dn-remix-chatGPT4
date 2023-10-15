import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import DanceLevelsConfig from '~/components/studios/DanceLevelsConfig'
import { getDanceLevels } from '~/models/studio.server'
import { requireUserId } from '~/session.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request)
  const danceLevels = await getDanceLevels(userId)
  if (!danceLevels) {
    throw new Error('Oh no! dance levels could not be loaded')
  }
  return json(danceLevels)
}

export default function Configuration() {
  const danceLevels = useLoaderData<typeof loader>()

  return (
    <div className='flex min-h-screen flex-col'>
      <h1>Studio Settings and Configuration</h1>
      <DanceLevelsConfig danceLevels={danceLevels} />
    </div>
  )
}
