import type { VodKey } from '@/types/constants'

import { defineContentScript } from 'wxt/sandbox'
import { normalizeAll } from '@midra/nco-parser/normalize'

import { MATCHES } from '@/constants/matches'

import { logger } from '@/utils/logger'
import { checkVodEnable } from '@/utils/extension/checkVodEnable'

import { NCOPatcher } from '@/ncoverlay/patcher'

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
      logger.log('microFormat:', microFormat)

      const videoTitle = microFormat.name;
      logger.log('videoTitle:', videoTitle);
      if (!videoTitle) return null

      // 作品タイトルを取得
      // 戦略: 「」や『』で囲まれた文字列を作品タイトルとする
      const TitleCandidates = Array.from(videoTitle.matchAll(/「.*」|『.*』/g)).map(val => val[0]);
      logger.log('TitleCandidates:', TitleCandidates);

      let workTitle = "";
      let subTitle = "";
      if (TitleCandidates) {
        const workTitleCandidates = TitleCandidates.filter(v => v.startsWith("『"))
        // "『"で始まるタイトルを優先的に作品タイトルにする。
        if (workTitleCandidates.length) {
          logger.log('workTitleCandidates:', workTitleCandidates);
          const title = workTitleCandidates[0]
          workTitle = title.substring(1, title.length - 1)
          const subTitleCandidates = TitleCandidates.filter(v => v.startsWith("「"))
          if (subTitleCandidates.length) {
            logger.log('subTitleCandidates:', subTitleCandidates);
            subTitle = subTitleCandidates[0]
            subTitle = subTitle.substring(1, subTitle.length - 1)
          }
        }
        if (!workTitle) {
          // 順番に
          workTitle = TitleCandidates[0]
          workTitle = workTitle.substring(1, workTitle.length - 1)

          if (TitleCandidates[1]) {
            subTitle = TitleCandidates[1]
            subTitle = subTitle.substring(1, subTitle.length - 1)
          }
        }
      }

      logger.log('workTitle:', workTitle)
      logger.log('subTitle:', subTitle)

      // エピソードタイトルを取得
      // 戦略: サブタイトルを取得するのは非現実的なので、第何話かを取得する
      let episodeTitle: string | undefined = ""

      const episodeTitleCandidates = /[最終|第]?[0-9|一|二|三|四|五|六|七|八|九|十]+[話|回]/.exec(normalizeAll(videoTitle));

      if (episodeTitleCandidates && episodeTitleCandidates.length == 1) {
        episodeTitle = episodeTitleCandidates[0]
      }
      if (subTitle) {
        episodeTitle += " " + subTitle
        episodeTitle = episodeTitle.trim()
      }
      if (episodeTitle === "") {
        episodeTitle = undefined
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
