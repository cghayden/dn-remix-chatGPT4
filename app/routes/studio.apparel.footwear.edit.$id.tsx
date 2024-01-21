import { requireUserId } from '~/session.server'
import { z } from 'zod'
import { conform, useForm } from '@conform-to/react'
import { parse } from '@conform-to/zod'
import { TextInput } from '~/components/forms/TextInput'
import { ContentContainer } from '~/components/styledComponents/ContentContainer'
import {
  json,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  redirect,
} from '@remix-run/node'
import { getFootwearItem, upsertStudioFootwear } from '~/models/studio.server'
import {
  Form,
  Link,
  Outlet,
  useActionData,
  useLoaderData,
} from '@remix-run/react'
import { useState } from 'react'

const footwearSchema = z.object({
  name: z.string({ required_error: 'Name is required' }).min(2),
  description: z.string().min(2).optional(),
  url: z.string().url().optional(),
  danceClassIds: z.string().array().optional().default([]),
  footwearId: z.string().default('new'),
})

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request)
  const formData = await request.formData()
  const submission = parse(formData, { schema: footwearSchema })

  if (submission.intent !== 'submit' || !submission.value) {
    return json(submission)
  }

  const { name, description, url, footwearId, danceClassIds } = submission.value

  const footwear = await upsertStudioFootwear({
    footwearId,
    studioId: userId,
    name,
    description,
    url,
    danceClassIds,
  })

  return redirect(`/studio/apparel/footwear/${footwear.id}`)
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const footwearId = params.id
  const userId = await requireUserId(request)

  if (!footwearId || !userId) {
    throw new Error('footwear could not be loaded, no Id provided')
  }

  const footwearItem = await getFootwearItem(footwearId)

  if (footwearItem?.studioId !== userId) {
    throw new Error('You do not have permission to edit this item')
  }

  return footwearItem
}

export default function AddFootwear() {
  const lastSubmission = useActionData<typeof action>()
  const footwearItem = useLoaderData<typeof loader>()
  const [editImage, toggleEditImage] = useState(false)
  const [form, { name, description, url }] = useForm({ lastSubmission })

  return (
    <ContentContainer>
      <h3 className='text-lg font-bold'>Edit Footwear</h3>
      <div className='min-w-48 min-h-48 w-52 h-52 mx-auto text-center'>
        {footwearItem.imageFilename && (
          <>
            <img
              src={`https://dancernotes.s3.us-east-2.amazonaws.com/${footwearItem.imageFilename}`}
              alt='footwear pic'
            />
          </>
        )}
        <Link
          reloadDocument
          to={`/studio/apparel/footwear/changeImage/${footwearItem.id}?footwearName=${footwearItem.name}`}
        >
          Change / Add Image
        </Link>
        <Outlet context={{ footwearItemName: footwearItem.name }} />
      </div>
      <Form
        method='post'
        id='editFootwear'
        {...form.props}
        className='form_default'
      >
        <fieldset>
          {/* <legend>Edit Footwear</legend> */}
          <div className='input_section_wrapper'>
            <div className='input_item'>
              <TextInput
                label={'Name'}
                name='name'
                defaultValue={footwearItem?.name ?? ''}
                error={name.error}
                required={true}
              />
            </div>
            <div className='input_item'>
              <TextInput
                name='description'
                label={'Description'}
                error={description.error}
                required={false}
              />
            </div>
            <div className='input_item'>
              <TextInput
                name='url'
                label={'Url'}
                error={url.error}
                required={false}
              />
            </div>
            <button
              type='submit'
              form='editFootwear'
              className=' rounded bg-blue-500 mt-4 ml-2 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400'
            >
              Save Footwear
            </button>
          </div>
        </fieldset>
      </Form>
    </ContentContainer>
  )
}
