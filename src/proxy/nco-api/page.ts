import type { ncoApi } from '@midra/nco-api'

import { createProxy } from '@/utils/proxy-service/create'
import { sendMessage } from '@/utils/proxy-service/messaging/page'

export const ncoApiProxy = createProxy<typeof ncoApi>('ncoApi', sendMessage)
