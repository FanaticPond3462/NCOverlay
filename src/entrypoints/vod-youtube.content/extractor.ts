import { NUMBER, KANSUJI, REGEXP_KANSUJI, REGEXP_NUMBER } from "@midra/nco-parser/extract/lib/core";
import { REGEXPS as libseasonREGEXPS } from "@midra/nco-parser/extract/lib/season";
import { number2kanji, kanji2number } from '@geolonia/japanese-numeral'

const DAIJI_KANSUJI = '零壱弐参肆伍陸漆捌玖拾佰仟萬'
const REGEXP_DAIJI_KANSUJI = `[${DAIJI_KANSUJI}]+`

const seasonREGEXPS = libseasonREGEXPS.concat([
  `(?<prefix>第?)(?<kansuji>${REGEXP_DAIJI_KANSUJI})(?<suffix>期)`,
  `(?<prefix>第)(?<kansuji>${REGEXP_DAIJI_KANSUJI})(?<suffix>シリーズ|シーズン)`,
].map((v) => new RegExp(v, 'dgi')))

const notNumber = `[^\\s${NUMBER}${KANSUJI}${DAIJI_KANSUJI}]`

const episodeExcludePrefixes = ['season', 'episode', 'ep', 'chapter', 'part'].map(
  (v) => new RegExp(`^${v}(?=\\s|$)`, 'i')
);

const episodeExcludeSuffixes = ['期', 'シリーズ', 'シーズン', 'st', 'nd', 'rd', 'th',].map(
  (v) => new RegExp(`\\s?${v}$`, 'i')
);

export type ExtractResult = {
  text: string
  number: number
  kansuji: string | null
  prefix: string | null
  suffix: string | null
  from_number: number | null
  from_kansuji: string | null
  from_prefix: string | null
  from_suffix: string | null
  range: [start: number, end: number]
}

/**
 * @deprecated このcoreはYouTube専用です。意図しない動作を防ぐため、nco-parser内のcoreを使用してください。
 * @description 第1~3話などの表現に対応し、RegExpを実行出来ます。
 */
const core = (str: string, regexps: RegExp[]): ExtractResult[] => {
  const matches: ExtractResult[] = []

  for (const re of regexps) {
    for (const match of str.matchAll(re)) {
      if (!match.groups || !match.indices) {
        continue
      }

      const { groups, indices } = match

      let number: number | null = null
      let kansuji: string | null = null
      let from_number: number | null = null
      let from_kansuji: string | null = null

      try {
        if (groups.number) {
          number = Number(groups.number)

          if (Number.isInteger(number)) {
            kansuji = number2kanji(number)
          }
        } else if (groups.kansuji) {
          kansuji = groups.kansuji
          number = kanji2number(kansuji)
        }
        if (groups.from_number) {
          from_number = Number(groups.from_number)

          if (Number.isInteger(from_number)) {
            from_kansuji = number2kanji(from_number)
          }
        } else if (groups.from_kansuji) {
          from_kansuji = groups.from_kansuji
          from_number = kanji2number(from_kansuji)
        }
      } catch { }

      if (number !== null) {
        matches.push({
          text: match[0],
          number,
          kansuji,
          prefix: groups.prefix || null,
          suffix: groups.suffix || null,
          from_number,
          from_kansuji,
          from_prefix: groups.from_prefix || null,
          from_suffix: groups.from_suffix || null,
          range: [indices[0][0], indices[0][1] - 1],
        })
      }
    }
  }

  matches.sort(({ range: a }, { range: b }) => a[0] - b[0] || a[1] - b[1])

  return matches
}

const episodeREGEXPS = [

  // 第1話 第1~2話
  `((?<from_prefix>新?第?)(?<from_number>${REGEXP_NUMBER})(?<from_suffix>話?目?)(?<separator>[~&]))?(?<prefix>新?第?)(?<number>${REGEXP_NUMBER})(?<suffix>話目?)`,
  // 第一話 第一~二話
  `((?<from_prefix>新?第?)(?<from_kansuji>${REGEXP_KANSUJI})(?<from_suffix>話?目?)(?<separator>[~&]))?(?<prefix>新?第?)(?<kansuji>${REGEXP_KANSUJI})(?<suffix>話目?)`,
  // 第壱話 第壱~弐話
  `((?<from_prefix>新?第?)(?<from_kansuji>${REGEXP_DAIJI_KANSUJI})(?<from_suffix>話?目?)(?<separator>[~&]))?(?<prefix>新?第?)(?<kansuji>${REGEXP_DAIJI_KANSUJI})(?<suffix>話目?)`,

  // エピソード1
  `(?<prefix>エピソード)(?<number>${REGEXP_NUMBER})`,
  `(?<prefix>えぴそーど)(?<number>${REGEXP_NUMBER})`,

  // episode1, ep 1, episode.1, ep:01, episode|1
  `(?<=[^a-z])(?<prefix>(?:episode|ep)[\\s\\.:|]?)(?<number>${REGEXP_NUMBER})(?=\\s|$)`,

  // chapter1, chapter.1, chapter:1, chapter|1
  `(?<=[^a-z])(?<prefix>(?:chapter)[\\s\\.:|]?)(?<number>${REGEXP_NUMBER})(?=\\s|$)`,

  // #01
  `(?<prefix>#)(?<number>${REGEXP_NUMBER})`,
].map((v) => new RegExp(v, 'dgi'))

const episodeREGEXPS_VAGUE = [
  // <タイトル> (一占 | 第一羽 | 第1憑目 | 喪1) <サブタイトル>
  ...[
    `(?<prefix>${notNumber}{1,10})(?<number>${REGEXP_NUMBER})(?<suffix>${notNumber}{0,3})`,
    `(?<prefix>${notNumber}{1,10})(?<kansuji>${REGEXP_KANSUJI})(?<suffix>${notNumber}{0,3})`,
    `(?<prefix>${notNumber}{0,10})(?<number>${REGEXP_NUMBER})(?<suffix>${notNumber}{1,3})`,
    `(?<prefix>${notNumber}{0,10})(?<kansuji>${REGEXP_KANSUJI})(?<suffix>${notNumber}{1,3})`,
  ].map((v) => `(?<=\\S+\\s)${v}(?=\\s\\S+)`),

  // <タイトル> Log 01 <サブタイトル>
  `(?<=\\S+\\s)(?<prefix>[a-z]{2,6}\\s)(?<number>${REGEXP_NUMBER})(?=\\s\\S+)`,

  // <タイトル> 01 <サブタイトル>
  `(?<=\\S+\\s)(?<number>0?[0-9]{2}|[1-9][0-9]{2})(?=\\s\\S+)`,
].map((v) => new RegExp(v, 'dgi'))

export const season = (str: string) => core(str, seasonREGEXPS)

export const episode = (str: string, strict?: boolean) => {
  const results = core(str, episodeREGEXPS)

  if (!strict) {
    results.push(
      ...core(str, episodeREGEXPS_VAGUE).filter(({ prefix, suffix }) => {
        return (
          (!prefix || episodeExcludePrefixes.every((v) => !v.test(prefix))) &&
          (!suffix || episodeExcludeSuffixes.every((v) => !v.test(suffix)))
        )
      })
    )
  }

  results.sort(({ range: a }, { range: b }) => a[0] - b[0] || a[1] - b[1])

  return results
}
