import type { VodKey } from '@/types/constants'

import { defineContentScript } from 'wxt/sandbox'

import { logger } from '@/utils/logger'
import { execPlugins } from '@/utils/extension/execPlugins'

import { disablePopupPlayer } from './disablePopupPlayer'

const vod: VodKey = 'dAnime'

export default defineContentScript({
  matches: ['https://animestore.docomo.ne.jp/animestore/*'],
  world: 'MAIN',
  main: () => void main(),
})

const main = () => {
  logger.log(`plugin-${vod}.js`)

  execPlugins(vod, {
    disablePopupPlayer,
  })
}
