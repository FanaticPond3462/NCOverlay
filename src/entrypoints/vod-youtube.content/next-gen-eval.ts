import type { ASTResult, ASTElement, ASTBlock } from "./parser";
import { dump } from "./parser";
import { episode } from "./extractor";

type EvaluatedEpisode = {
    title: string | null
    number: number
}

type EvaluatedMeta = {
    title: string | null
    season: string | null
    episodes: EvaluatedEpisode[]
}

type MetaContents = {
    element: ASTElement,
    reasons: MetaReasons[]
}

enum MetaReasons {
    DEFINITION,
    AFTER_EPISODE,
    AFTER_ANIME_WORD,
    AFTER_KEYWORD,
    IN_BRANKETS,
    IN_KEY_BRANKETS,
    IN_SUMI_BRANKETS,
    IN_NORMAL_BRANKETS
}

const isBlock = (x: ASTResult): x is ASTBlock => x.type === "Block";

const evalBlock = (ast: ASTResult[], block?: ASTBlock, previousElement?: ASTElement | null): [MetaContents[], ASTElement | null] => {
    let previous: ASTElement | null = previousElement ?? null;
    let meta_contents: MetaContents[] = [];

    ast.forEach((element) => {
        if (element.type === "Season") {
            meta_contents.push({
                element,
                reasons: [MetaReasons.DEFINITION]
            });
        } else if (element.type === "Episode") {
            meta_contents.push({
                element,
                reasons: [MetaReasons.DEFINITION]
            });
        } else if (isBlock(element)) {
            const result = evalBlock(element.content, element, previous);
            meta_contents.push(...result[0])
        } else if (element.type === "Constant" || element.type === "Unknown") {
            const reasons: MetaReasons[] = []
            if (previous?.type === "Episode")
                reasons.push(MetaReasons.AFTER_EPISODE)
            if (previous?.type === "Promo" && ["アニメ", "あにめ"].some(v => previous?.content.includes(v)))
                reasons.push(MetaReasons.AFTER_ANIME_WORD)
            if (previous?.type === "Promo" && ["公式"].some(v => previous?.content.includes(v)))
                reasons.push(MetaReasons.AFTER_KEYWORD)
            if (block?.prefix === "「")
                reasons.push(MetaReasons.IN_BRANKETS)
            if (block?.prefix === "(")
                reasons.push(MetaReasons.IN_NORMAL_BRANKETS)
            if (block?.prefix === "『")
                reasons.push(MetaReasons.IN_KEY_BRANKETS)
            if (block?.prefix === "【")
                reasons.push(MetaReasons.IN_SUMI_BRANKETS)
            meta_contents.push({
                element,
                reasons: reasons
            });
        }

        if (!isBlock(element) && element.type !== "Separator") {
            previous = element
        }
    });

    return [meta_contents, previous]
}

export const evalAST = (ast: ASTResult[]): EvaluatedMeta => {
    const evaluatedMeta: EvaluatedMeta = {
        title: null,
        season: null,
        episodes: []
    };
    let episodeRanges: { from: number, to: number } = {
        from: 0,
        to: 0
    };

    const MetaContents = evalBlock(ast)[0]
    const subtitles: ASTElement[] = []

    MetaContents.forEach((meta) => {
        if (meta.element.type === "Episode") {
            const episodeParsed = episode(meta.element.content)[0]

            const episodeNumber = episodeParsed.number;
            if (episodeNumber !== null) {
                if (episodeRanges && episodeNumber < episodeRanges.to) {
                    return;
                }
                if (episodeParsed.from_number !== null && episodeParsed.from_number !== undefined) {
                    episodeRanges = { from: episodeParsed.from_number, to: episodeNumber };
                } else {
                    episodeRanges = { from: episodeNumber, to: episodeNumber };
                }
            }

            return;
        }
        if (meta.element.type === "Season") {
            evaluatedMeta.season = meta.element.content;

            return;
        }

        if (meta.reasons.includes(MetaReasons.AFTER_ANIME_WORD)) {
            evaluatedMeta.title = dump(meta.element);

            return;
        }
        if (meta.reasons.includes(MetaReasons.AFTER_KEYWORD)) {
            evaluatedMeta.title = dump(meta.element);

            return;
        }
        if (meta.reasons.includes(MetaReasons.IN_KEY_BRANKETS) && !evaluatedMeta.title) {
            evaluatedMeta.title = dump(meta.element);

            return;
        }
        if (!meta.reasons.includes(MetaReasons.IN_BRANKETS) && !evaluatedMeta.title) {
            evaluatedMeta.title = dump(meta.element);
            return;
        }
        if (meta.reasons.includes(MetaReasons.IN_BRANKETS)) {
            subtitles.push(meta.element);

            return;
        }
        if (!meta.reasons.includes(MetaReasons.IN_SUMI_BRANKETS) && !meta.reasons.includes(MetaReasons.IN_NORMAL_BRANKETS)) {
            subtitles.push(meta.element);
        }
    });

    if (!evaluatedMeta.title && subtitles.length) {
        evaluatedMeta.title = dump(subtitles.shift()!)
    }

    if (episodeRanges.from !== undefined && episodeRanges.to !== undefined) {
        for (let i = episodeRanges.from; i <= episodeRanges.to; i++) {
            evaluatedMeta.episodes.push({
                number: i,
                title: subtitles[i - episodeRanges.from]?.content || null
            });
        }
    } else if (episodeRanges.from) {
        evaluatedMeta.episodes.push({
            number: episodeRanges.from,
            title: subtitles[0]?.content || null
        });
    }

    return evaluatedMeta;
}