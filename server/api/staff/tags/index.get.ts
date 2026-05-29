import { requireAuth } from '../../../services/auth'
import { listAllTagsForStaff } from '../../../db/queries/tags'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  return listAllTagsForStaff()
})
