import type { SettingItems } from '@/types/storage'

import { VOD_KEYS } from '../vods'

/** 設定のデフォルト値 */
export const SETTINGS_DEFAULT: SettingItems = {
  // 全般
  'settings:theme': 'auto',
  'settings:showChangelog': true,

  // 動画配信サービス
  'settings:vods': [...VOD_KEYS],

  // キャプチャー
  'settings:capture:format': 'jpeg',
  'settings:capture:method': 'window',

  // コメント
  'settings:comment:autoLoad': true,
  'settings:comment:autoLoadChapter': true,
  'settings:comment:autoLoadSzbh': true,
  'settings:comment:autoLoadJikkyo': true,
  'settings:comment:useNglist': false,
  'settings:comment:amount': 1,
  'settings:comment:opacity': 100,
  'settings:comment:scale': 100,
  'settings:comment:fps': 60,

  // NG設定
  'settings:ng:largeComments': false,
  'settings:ng:fixedComments': false,
  'settings:ng:coloredComments': false,
  'settings:ng:words': [],
  'settings:ng:commands': [],
  'settings:ng:ids': [],

  // キーボード
  'settings:kbd:increaseGlobalOffset': '',
  'settings:kbd:decreaseGlobalOffset': '',
  'settings:kbd:resetGlobalOffset': '',
  'settings:kbd:jumpMarkerToOP': '',
  'settings:kbd:jumpMarkerToA': '',
  'settings:kbd:jumpMarkerToB': '',
  'settings:kbd:jumpMarkerToC': '',
  'settings:kbd:resetMarker': '',

  // プラグイン
  'settings:plugins': [],

  // 実験的な機能
  // 'settings:experimental:useAiParser': false,
}
