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

const isBlock = (x: ASTResult): x is ASTBlock => x.type === "Block";

export const evalAST = (ast: ASTResult[]): EvaluatedMeta => {
    const evaluatedMeta: EvaluatedMeta = {
        title: null,
        season: null,
        episodes: []
    };

    let title: ASTElement | null = null;
    let force_title = false;
    let subtitleParts: ASTResult[] = [];
    let episodeRanges: { from: number, to: number } | null = null;
    let previous: ASTElement | null = null;

    ast.forEach(element => {
        if (element.type === "Season") {
            if (!evaluatedMeta.season) {
                evaluatedMeta.season = element.content;
            }
        } else if (element.type === "Episode") {
            const episodeParsed = episode(element.content)[0]
            const episodeNumber = episodeParsed.number;
            if (episodeNumber !== null) {
                if (episodeRanges) {
                    if (episodeNumber < episodeRanges.to) {
                        return
                    }
                }
                if (episodeParsed.from_number !== null && episodeParsed.from_number !== undefined) {
                    episodeRanges = { from: episodeParsed.from_number, to: episodeNumber };
                } else {
                    episodeRanges = { from: episodeNumber, to: episodeNumber };
                }
            }
        } else if (isBlock(element)) {
            element.content.forEach((e) => {
                if (e.type === "Season") {
                    if (!evaluatedMeta.season) {
                        evaluatedMeta.season = e.content;
                    }
                } else if (e.type === "Episode") {
                    const episodeParsed = episode(e.content)[0]
                    const episodeNumber = episodeParsed.number;
                    if (episodeNumber !== null) {
                        if (episodeRanges) {
                            if (episodeNumber < episodeRanges.to) {
                                return
                            }
                        }
                        if (episodeParsed.from_number !== null && episodeParsed.from_number !== undefined) {
                            episodeRanges = { from: episodeParsed.from_number, to: episodeNumber };
                        } else {
                            episodeRanges = { from: episodeNumber, to: episodeNumber };
                        }
                    }
                } else if (["(", "〔"].includes(element.prefix ?? "")) {
                    return
                } else if (e.type === "Constant" || e.type === "Unknown") {
                    if (previous?.type === "Episode") {
                        subtitleParts.push(e);
                    } else if (!title || force_title) {
                        title = e;
                        force_title = false;
                    } else {
                        subtitleParts.push(e);
                    }
                }
                if (!isBlock(e))
                    previous = e
            })
        } else if (["(", "〔"].includes(element.prefix ?? "")) {
            return
        } else if (element.type === "Constant" || element.type === "Unknown") {
            if (previous?.type === "Episode") {
                subtitleParts.push(element);
            } else if (!title || force_title) {
                title = element;
                force_title = false;
            } else {
                subtitleParts.push(element);
            }
        } else if (element.type == "Promo") {
            if (["アニメ", "公式"].some(v => element.content.includes(v))) {
                force_title = true
            }
        }
        if (!isBlock(element) && element.type !== "Separator")
            previous = element
    });
    if (title) evaluatedMeta.title = dump(title) || null;
    const subtitle = subtitleParts.map((e) => {
        if (e.prefix == "「", isBlock(e)) {
            return dump(e.content[0])
        } else {
            return dump(e)
        }
    }) || null;
    if (!evaluatedMeta.title) {
        evaluatedMeta.title = subtitle.pop() || null
    }

    if (episodeRanges !== null) {
        if (episodeRanges.from !== undefined && episodeRanges.to !== undefined) {
            for (let i = episodeRanges.from; i <= episodeRanges.to; i++) {
                evaluatedMeta.episodes.push({
                    number: i,
                    title: subtitle[i - episodeRanges.from] || null
                });
            }
        } else if (episodeRanges.from) {
            evaluatedMeta.episodes.push({
                number: episodeRanges.from,
                title: subtitle[0] || null
            });
        }
    } else if (evaluatedMeta.episodes.length === 0 && (evaluatedMeta.title || subtitle)) {
        // if no episode declared but title or subtitle exists, consider it episode 0
        evaluatedMeta.episodes.push({
            number: 0,
            title: subtitle[0] || null
        })
    }


    return evaluatedMeta;
}