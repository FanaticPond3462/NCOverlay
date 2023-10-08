import type { ChromeMessage, ChromeResponse } from '@/types/chrome/message'
import {
  isChromeMessageSearch,
  isChromeMessageVideo,
  isChromeMessageThreads,
  isChromeMessageAction,
  isChromeMessageActionBadge,
  isChromeMessageActionTitle,
} from '@/types/chrome/message'
import {
  ACTION_ICONS_ENABLE,
  ACTION_ICONS_DISABLE,
  GITHUB_URL,
} from '@/constants'
import { NiconicoApi } from './api/niconico'

console.log('[NCOverlay] background.js')

chrome.action.disable()
chrome.action.setIcon({ path: ACTION_ICONS_DISABLE })
chrome.action.setBadgeBackgroundColor({ color: '#2389FF' })
chrome.action.setBadgeTextColor({ color: '#FFF' })

chrome.runtime.onInstalled.addListener((details) => {
  const { version } = chrome.runtime.getManifest()

  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({ url: `${GITHUB_URL}/blob/v${version}/README.md` })
  }

  if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
    chrome.tabs.create({ url: `${GITHUB_URL}/releases/tag/v${version}` })
  }
})

chrome.runtime.onMessage.addListener(
  (
    message: ChromeMessage,
    sender,
    sendResponse: (response: ChromeResponse) => void
  ) => {
    let promise: Promise<any> | null = null

    // ニコニコ 検索
    if (isChromeMessageSearch(message)) {
      const minLength = message.body.duration ? message.body.duration - 30 : -1
      const maxLength = message.body.duration ? message.body.duration + 30 : -1

      promise = NiconicoApi.search({
        q: message.body.title,
        targets: ['title'],
        fields: ['contentId', 'title', 'channelId'],
        filters: {
          'genre.keyword': {
            '0': 'アニメ',
          },
          'lengthSeconds':
            0 <= minLength && 0 < maxLength
              ? {
                  gte: minLength,
                  lte: maxLength,
                }
              : undefined,
        },
        _limit: '5',
      })
    }

    // ニコニコ 動画情報
    if (isChromeMessageVideo(message)) {
      promise = NiconicoApi.video(message.body.videoId, message.body.guest)
    }

    // ニコニコ コメント
    if (isChromeMessageThreads(message)) {
      promise = NiconicoApi.threads(message.body.nvComment)
    }

    // 拡張機能 アクション 有効/無効
    if (isChromeMessageAction(message)) {
      if (message.body) {
        chrome.action.enable(sender.tab?.id)
      } else {
        chrome.action.disable(sender.tab?.id)
      }

      chrome.action.setIcon({
        tabId: sender.tab?.id,
        path: message.body ? ACTION_ICONS_ENABLE : ACTION_ICONS_DISABLE,
      })
    }

    // 拡張機能 アクション バッジ
    if (isChromeMessageActionBadge(message)) {
      chrome.action.setBadgeText({
        tabId: sender.tab?.id,
        text: message.body.toString(),
      })
    }

    // 拡張機能 アクション タイトル (ツールチップ)
    if (isChromeMessageActionTitle(message)) {
      chrome.action.setTitle({
        tabId: sender.tab?.id,
        title: message.body ? `${message.body} | NCOverlay` : '',
      })
    }

    if (promise) {
      promise
        .then((result) => {
          sendResponse({
            type: message.type,
            result: result,
          })
        })
        .catch((e) => {
          console.log('[NCOverlay] Error', e)

          sendResponse({
            type: message.type,
            result: null,
          })
        })

      return true
    }

    return false
  }
)
