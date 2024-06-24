import type { ContentScriptContext } from 'wxt/client'
import type { StorageOnChangeRemoveListener } from '@/utils/storage'
import type { SlotUpdate } from './state'

import { Logger } from '@/utils/logger'
import { uid } from '@/utils/uid'
import { settings } from '@/utils/settings/extension'

import { ncoMessenger } from './messaging'
import { NCOState } from './state'
import { NCOSearcher } from './searcher'
import { NCORenderer } from './renderer'

import './style.css'

export type NCOverlayEventMap = {
  playing: (this: NCOverlay, evt: Event) => void
  pause: (this: NCOverlay, evt: Event) => void
  seeked: (this: NCOverlay, evt: Event) => void
  timeupdate: (this: NCOverlay, evt: Event) => void
  loadedmetadata: (this: NCOverlay, evt: Event) => void
}

/**
 * NCOverlay
 */
export class NCOverlay {
  readonly id: string
  readonly state: NCOState
  readonly searcher: NCOSearcher
  readonly renderer: NCORenderer

  #storageOnChangeRemoveListeners: StorageOnChangeRemoveListener[] = []

  constructor(video: HTMLVideoElement, ctx: ContentScriptContext) {
    this.id = `${Date.now()}.${uid()}`
    this.state = new NCOState(this.id)
    this.searcher = new NCOSearcher(this.state)
    this.renderer = new NCORenderer(video)

    // 既にメタデータ読み込み済みの場合
    if (HTMLMediaElement.HAVE_METADATA <= this.renderer.video.readyState) {
      window.setTimeout(() => {
        this.#trigger('loadedmetadata', new Event('loadedmetadata'))
      })
    }

    ctx.onInvalidated(() => this.dispose(true))

    this.initialize()
  }

  /**
   * 初期化
   */
  initialize() {
    Logger.log('NCOverlay.initialize()')

    this.dispose()

    this.#registerEventListener()

    this.renderer.video.classList.add('NCOverlay-Video')
    this.renderer.canvas.classList.add('NCOverlay-Canvas')
  }

  /**
   * 解放
   */
  dispose(force?: boolean) {
    Logger.log(`NCOverlay.dispose(${force ?? ''})`)

    this.#unregisterEventListener()

    this.state.clear()
    this.renderer.clear()

    if (force) {
      this.removeAllEventListeners()

      this.renderer.video.classList.remove('NCOverlay-Video')
      this.renderer.canvas.classList.remove('NCOverlay-Canvas')
    }
  }

  updateSlot(data: SlotUpdate): boolean {
    const changed = this.state.slots.update(data)

    if (changed) {
      this.updateRendererThreads()
    }

    return changed
  }

  /**
   * 全体のオフセットをセット
   */
  setGlobalOffset(ms: number | null) {
    const changed = ms ? this.state.offset.set(ms) : this.state.offset.clear()

    if (changed) {
      this.updateRendererThreads()
    }

    return changed
  }

  /**
   * 指定したマーカーの位置にジャンプ
   */
  jumpMarker(markerIdx: number | null) {
    const slots = this.state.slots.getAll()

    if (!slots) return

    if (markerIdx === null) {
      slots.forEach((slot) => {
        this.state.slots.update({
          id: slot.id,
          offset: 0,
        })
      })
    } else {
      const currentTimeMs = this.renderer.video.currentTime * 1000

      slots.forEach((slot) => {
        const marker = slot.markers?.[markerIdx]

        if (marker) {
          this.state.slots.update({
            id: slot.id,
            offset: marker * -1 + currentTimeMs,
          })
        }
      })
    }

    this.updateRendererThreads()
  }

  /**
   * 描画するコメントデータを更新する
   */
  updateRendererThreads() {
    const threads = this.state.slots.getThreads()

    this.renderer.setThreads(threads)
    this.renderer.reload()
  }

  /**
   * イベントリスナー
   */
  #videoEventListeners: {
    [type in keyof HTMLVideoElementEventMap]?: (evt: Event) => void
  } = {
    playing: (evt) => {
      this.renderer.stop()
      this.renderer.start()

      this.#trigger('playing', evt)
    },

    pause: (evt) => {
      this.renderer.stop()

      this.#trigger('pause', evt)
    },

    seeked: (evt) => {
      this.renderer.render()

      this.#trigger('seeked', evt)
    },

    timeupdate: (evt) => {
      this.#trigger('timeupdate', evt)
    },

    loadedmetadata: (evt) => {
      this.#trigger('loadedmetadata', evt)
    },
  }

  /**
   * イベント登録
   */
  #registerEventListener() {
    // Video要素
    for (const key in this.#videoEventListeners) {
      const type = key as keyof HTMLVideoElementEventMap
      const listener = this.#videoEventListeners[type]!

      this.renderer.video.addEventListener(type, listener)
    }

    // 検索ステータス 変更時
    this.searcher.addEventListener('ready', () => {
      this.updateRendererThreads()

      if (!this.renderer.video.paused) {
        this.renderer.stop()
        this.renderer.start()
      }
    })

    // 設定 (コメント:表示サイズ)
    this.#storageOnChangeRemoveListeners.push(
      settings.loadAndWatch('settings:comment:scale', (scale) => {
        this.renderer.setOptions({
          scale: scale / 100,
          keepCA: scale !== 100,
        })

        this.renderer.reload()
      })
    )

    // 設定 (コメント:不透明度)
    this.#storageOnChangeRemoveListeners.push(
      settings.loadAndWatch('settings:comment:opacity', (opacity) => {
        this.renderer.setOpacity(opacity / 100)
      })
    )

    // 設定 (コメント:フレームレート)
    this.#storageOnChangeRemoveListeners.push(
      settings.loadAndWatch('settings:comment:fps', (fps) => {
        this.renderer.setFps(fps)
      })
    )

    // メッセージ (インスタンスのID取得)
    ncoMessenger.onMessage('p-c:getId', () => {
      return this.id
    })

    // メッセージ (スロット 更新)
    ncoMessenger.onMessage('p-c:updateSlot', ({ data }) => {
      return this.updateSlot(...data)
    })

    // メッセージ (オフセット 全体)
    ncoMessenger.onMessage('p-c:setGlobalOffset', ({ data }) => {
      return this.setGlobalOffset(...data)
    })

    // メッセージ (マーカー)
    ncoMessenger.onMessage('p-c:jumpMarker', ({ data }) => {
      return this.jumpMarker(...data)
    })

    // メッセージ (描画データ 更新)
    ncoMessenger.onMessage('p-c:updateRendererThreads', () => {
      return this.updateRendererThreads()
    })
  }

  /**
   * イベント登録解除
   */
  #unregisterEventListener() {
    for (const key in this.#videoEventListeners) {
      const type = key as keyof HTMLVideoElementEventMap
      const listener = this.#videoEventListeners[type]!

      this.renderer.video.removeEventListener(type, listener)
    }

    this.state.removeAllEventListeners()
    this.searcher.removeAllEventListeners()

    while (this.#storageOnChangeRemoveListeners.length) {
      this.#storageOnChangeRemoveListeners.pop()?.()
    }

    ncoMessenger.removeAllListeners()
  }

  #listeners: {
    [type in keyof NCOverlayEventMap]?: NCOverlayEventMap[type][]
  } = {}

  #trigger<Type extends keyof NCOverlayEventMap>(
    type: Type,
    ...args: Parameters<NCOverlayEventMap[Type]>
  ) {
    this.#listeners[type]?.forEach((listener) => {
      // @ts-ignore
      listener.call(this, ...args)
    })
  }

  addEventListener<Type extends keyof NCOverlayEventMap>(
    type: Type,
    callback: NCOverlayEventMap[Type]
  ) {
    this.#listeners[type] ??= []
    this.#listeners[type]!.push(callback)
  }

  removeAllEventListeners() {
    for (const key in this.#listeners) {
      delete this.#listeners[key as keyof NCOverlayEventMap]
    }
  }
}
