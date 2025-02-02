import type { VodKey } from '@/types/constants'

import { defineContentScript } from 'wxt/sandbox'
import { romanNum, symbol, numeric, charWidth } from "@midra/nco-parser/normalize/lib/adjust/index"
import { tokenize, genAST } from "./parser"
import { evalAST } from "./evaluate"

import { MATCHES } from '@/constants/matches'

import { logger } from '@/utils/logger'
import { checkVodEnable } from '@/utils/extension/checkVodEnable'


import { NCOPatcher } from '@/ncoverlay/patcher'

import './style.scss'
import type { ExtractResult } from '@midra/nco-parser/extract/lib/core'

export type ResolvedResult = {
  text: string
  type: "ProperNoun" | "Label" | "Episode" | "Season" | "Hashtag" | "Unknown"
  prefix: string | null
  suffix: string | null
}

const vod: VodKey = 'youtube'

export default defineContentScript({
  matches: MATCHES[vod],
  runAt: 'document_end',
  main: () => void main(),
})

const main = async () => {
  if (!(await checkVodEnable(vod))) return

  logger.log(`vod-${vod}.js`)

  const parseMicroFormatTimecode = (input: string) => {
    var hours = 0, minutes = 0, seconds = 0, totalseconds;
    var timecodes = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(input);

    if (timecodes) {
      if (timecodes[1]) hours = Number(timecodes[1]);
      if (timecodes[2]) minutes = Number(timecodes[2]);
      if (timecodes[3]) seconds = Number(timecodes[3]);
      totalseconds = hours * 3600 + minutes * 60 + seconds;
    }
    return totalseconds ?? null
  }

  interface microFormat_interface {
    "@context": string;
    "@type": string;
    description: string;
    duration: string;
    embedUrl: string;
    interactionCount: string;
    name: string;
    thumbnailUrl: string[];
    uploadDate: Date;
    genre: string;
    author: string;
  }

  const patcher = new NCOPatcher({
    vod,
    getInfo: async () => {
      const getMicroFormat = (): Promise<microFormat_interface | null> => {
        return new Promise((resolve) => {
          const getLoop = setInterval(() => {
            const microFormatElement = document.querySelector("#microformat script")
            if (!microFormatElement) return;
            const microFormatContent = microFormatElement.textContent
            if (!microFormatContent) return;

            let microFormat: microFormat_interface
            try {
              microFormat = JSON.parse(microFormatContent)
            } catch {
              return;
            }

            const video_id = new URLSearchParams(document.location.search).get("v")
            if (!video_id) return;
            microFormat.thumbnailUrl.forEach(thumbnailUrl => {
              if (thumbnailUrl.includes(video_id)) {
                clearInterval(getLoop)
                resolve(microFormat)
              }
            }, 1)
          });
        })
      }

      const microFormat: microFormat_interface | null = await getMicroFormat()
      if (!microFormat) return null;
      logger.log('microFormat:', microFormat);

      const videoTitle = microFormat.name;
      logger.log('videoTitle:', videoTitle);
      if (!videoTitle) return null;

      const normalized = charWidth(romanNum(symbol(numeric(videoTitle))))
      const tokens = tokenize(normalized)
      const AST = genAST(tokens)
      logger.log("AST:", AST)
      const evaled = evalAST(AST)
      logger.log("evaled:", evaled)
      let workTitle = evaled.title
      if (evaled.season) {
        workTitle += " " + evaled.season
      }
      let episodeTitle: string | null = null;
      if (evaled.episodes[0] && evaled.episodes[0].number !== 0) {
        episodeTitle = `第${evaled.episodes[0].number}話`
      } else {
        episodeTitle = evaled.episodes[0].title
      }


      // 動画時間を取得
      const duration = parseMicroFormatTimecode(microFormat.duration)

      logger.log('workTitle:', workTitle)
      logger.log('episodeTitle:', episodeTitle)
      logger.log('duration:', duration)

      if (!duration) return null

      return workTitle ? { workTitle, episodeTitle, duration } : null
    },
    appendCanvas: (video, canvas) => {
      video
        .closest<HTMLElement>('#movie_player')
        ?.appendChild(canvas)
    },
  })

  const obs_config: MutationObserverInit = {
    childList: true,
    subtree: true
  }
  const obs = new MutationObserver(() => {
    obs.disconnect()

    if (patcher.nco && !document.body.contains(patcher.nco.renderer.video)) {
      patcher.dispose()
    } else if (!patcher.nco) {
      if (location.pathname.startsWith('/watch')) {
        const video = document.body.querySelector<HTMLVideoElement>(
          '#movie_player > div.html5-video-container > video'
        )

        if (video) {
          patcher.setVideo(video)
        }
      }
    }

    obs.observe(document.body, obs_config)
  })

  obs.observe(document.body, obs_config)
}
