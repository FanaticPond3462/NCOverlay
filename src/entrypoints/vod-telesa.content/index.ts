import type { VodKey } from '@/types/constants'

import { defineContentScript } from 'wxt/sandbox'
import { episode as extractEpisode } from '@midra/nco-parser/extract/lib/episode'

import { MATCHES } from '@/constants/matches'

import { logger } from '@/utils/logger'
import { checkVodEnable } from '@/utils/extension/checkVodEnable'

import { NCOPatcher } from '@/ncoverlay/patcher'

import type { NextData } from './index.d'

import './style.scss'

const vod: VodKey = 'telesa'

export default defineContentScript({
  matches: MATCHES[vod],
  runAt: 'document_end',
  main: () => void main(),
})

const main = async () => {
  if (!(await checkVodEnable(vod))) return

  logger.log(`vod-${vod}.js`)

  const patcher = new NCOPatcher({
    vod,
    getInfo: async (nco) => {
      const getNextData = (): Promise<NextData | null> => {
        return new Promise((resolve) => {
          const getLoop = setInterval(() => {
            const nextDataElement = document.querySelector("#__NEXT_DATA__")
            if (!nextDataElement) return;
            const nextDataContent = nextDataElement.textContent
            if (!nextDataContent) return;

            let nextData: NextData
            try {
              nextData = JSON.parse(nextDataContent)
            } catch {
              return;
            }

            const splited_sep = document.location.pathname.split("/")
            const video_id = splited_sep[splited_sep.length - 1]
            if (!video_id) return;

            logger.log('video_id', nextData.props.initialState.videoDetail.video.id)
            logger.log('URL video id', Number(video_id))

            if (Number(video_id) == nextData.props.initialState.videoDetail.video.id) {
              clearInterval(getLoop)
              resolve(nextData)
            }
          }, 1);
        })
      }

      const nextData: NextData | null = await getNextData()
      if (!nextData) return null;

      const video = nextData.props.initialState.videoDetail.video

      logger.log('data.props.initialState.videoDetail.video:', video)

      if (!video) {
        return null
      }

      const workTitle = video.series_name
      const episodeTitle = video.subtitle

      const duration = nco.renderer.video.duration ?? 0

      logger.log('workTitle:', workTitle)
      logger.log('episodeTitle:', episodeTitle)
      logger.log('duration:', duration)

      return workTitle ? { workTitle, episodeTitle, duration } : null
    },
    appendCanvas: (video, canvas) => {
      video.insertAdjacentElement('afterend', canvas)
    },
  });

  const obs_config: MutationObserverInit = {
    childList: true,
    subtree: true,
  }
  const obs = new MutationObserver(() => {
    obs.disconnect()

    if (patcher.nco && !document.body.contains(patcher.nco.renderer.video)) {
      patcher.dispose()
    } else if (!patcher.nco) {
      if (location.pathname.startsWith('/play/')) {
        const video = document.querySelector<HTMLVideoElement>("#bitmovinplayer-video-null")

        if (video) {
          patcher.setVideo(video)
        }
      }
    }

    obs.observe(document.body, obs_config)
  })

  obs.observe(document.body, obs_config)
}