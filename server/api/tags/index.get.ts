import { listActiveTags } from '../../db/queries/tags'

export default defineEventHandler(async () => {
  return listActiveTags()
})
