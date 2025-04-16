import type { VodKey } from '@/types/constants'

import { defineContentScript } from 'wxt/sandbox'
import { romanNum, symbol, numeric, charWidth } from "@midra/nco-parser/normalize/lib/adjust/index"
import { tokenize, genAST } from "./parser"
import { evalAST } from "./evaluator"

import { MATCHES } from '@/constants/matches'

import { logger } from '@/utils/logger'
import { checkVodEnable } from '@/utils/extension/checkVodEnable'


import { NCOPatcher } from '@/ncoverlay/patcher'
import type { NCOverlay } from '@/ncoverlay'

import './style.scss'


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

  const getInfomation = async (nco: NCOverlay): Promise<{
    one_episode_duaration: number;
    workTitle: string | null;
    seasonContext: string | null;
    episodeIndex?: number
    episodeTitle?: string | null
    duration: number;
  } | null> => {
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
    if (document.querySelector("#movie_player.ad-showing")) {
      return null;
    }

    const microFormat: microFormat_interface | null = await getMicroFormat()
    if (!microFormat) return null;
    // logger.log('microFormat:', microFormat);

    const videoTitle = microFormat.name;
    // logger.log('videoTitle:', videoTitle);
    if (!videoTitle) return null;

    const normalized = charWidth(romanNum(symbol(numeric(videoTitle))))
    const tokens = tokenize(normalized)
    const AST = genAST(tokens)
    // logger.log("AST:", AST)
    const evaled = evalAST(AST)
    // logger.log("evaled:", evaled)

    // 動画時間を取得
    const duration = parseMicroFormatTimecode(microFormat.duration)
    if (!duration) return null

    const currentTime = nco.renderer.video.currentTime;
    const one_episode_duaration = duration / evaled.episodes.length
    const episodeIndex = Math.floor(currentTime / one_episode_duaration)
    const episode = evaled.episodes[episodeIndex]

    return {
      one_episode_duaration,
      workTitle: evaled.title,
      seasonContext: evaled.season,
      episodeIndex: episodeIndex,
      episodeTitle: episode.number !== 0 ? `第${episode.number}話` : episode.title,
      duration: one_episode_duaration
    }
  }
  const patcher = new NCOPatcher({
    vod,
    getInfo: async (nco) => {
      const info = await getInfomation(nco)
      if (!info) {
        return null;
      }
      let workTitle = info.workTitle
      if (info.seasonContext) {
        workTitle += " " + info.seasonContext;
      }
      const episodeTitle = info.episodeTitle;
      const duration = info.duration;

      logger.log('workTitle:', workTitle)
      logger.log('episodeTitle:', episodeTitle)
      logger.log('duration:', duration)

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
  const obs = new MutationObserver(async () => {
    obs.disconnect()

    let cache: number | undefined

    if (patcher.nco && !document.body.contains(patcher.nco.renderer.video)) {
      patcher.dispose()
    } else if (!patcher.nco) {
      if (location.pathname.startsWith('/watch')) {
        const video = document.body.querySelector<HTMLVideoElement>(
          '#movie_player:not(.ad-showing) > div.html5-video-container > video'
        )

        if (video) {
          const loadVideo = () => {
            return new Promise(resolve => {
              patcher.setVideo(video)
              const nco = patcher.nco! as NCOverlay

              getInfomation(nco).then(async value => {
                const offset = value?.one_episode_duaration! * value?.episodeIndex!
                await nco.keyboard.setOffset(offset ?? 0)
                cache = value?.episodeIndex
              });

              nco.addEventListener("loadedmetadata", () => {
                getInfomation(nco).then(value => {
                  cache = value?.episodeIndex
                });
              })

              nco.addEventListener("timeupdate", () => {
                getInfomation(nco).then(async value => {
                  const offset = value?.one_episode_duaration! * value?.episodeIndex!
                  if (offset !== await nco.keyboard.getOffset()) {
                    await nco.keyboard.setOffset(offset)
                  }
                  if (cache !== value?.episodeIndex) {
                    patcher.dispose()
                    resolve(0)
                  }
                })
              })
            })
          }
          while (document.body.contains(video)) {
            await loadVideo()
          }
        }
      }
    }

    obs.observe(document.body, obs_config)
  })

  obs.observe(document.body, obs_config)
}
