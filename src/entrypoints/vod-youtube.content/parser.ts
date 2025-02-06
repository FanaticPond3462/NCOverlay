import { episode, season } from "./extractor";
import { REGEXP_NUMBER } from "@midra/nco-parser/extract/lib/core";

const SEPARATORS = /^["『』【】\(\)「」｢｣《》/〈〉＜＞\[\]〔〕\s|｜／│・（）~”-]+/;
const BRACKET_MAP: { [key: string]: string } = {
    "「": "」", "｢": "｣", "『": "』", "【": "】", "(": ")", "（": "）", "《": "》", "〈": "〉", "'": "'", '"': '"', "〔": "〕", "[": "]", "”": "”",
};

const REGEXPS = [new RegExp(`(${REGEXP_NUMBER})(?:st|nd|rd|th)`, 'di'), new RegExp(`season`, 'dgi')];
const SECOND_REGEXPS = [new RegExp(`season`, 'dgi'), new RegExp(`(${REGEXP_NUMBER})(?=\\s|$)`, 'dgi')];

export type ASTElement = {
    content: string;
    type: "Constant" | "Episode" | "Season" | "Hashtag" | "Unknown" | "Promo" | "Date" | "Separator" | "Adjunct";
    prefix: string | null;
    suffix: string | null;
}

export type ASTBlock = {
    content: ASTResult[];
    type: "Block";
    prefix: string | null;
    suffix: string | null;
}

export type ASTResult = ASTElement | ASTBlock;

const isBlock = (x: any): x is ASTBlock => x.type === "Block";

/**
 * @param str 分割する対象文字列
 * @param ranges startで文字列の開始、endで文字列の終了、typeで囲んだ文字列のタイプを指定
 * @returns ASTElementの配列 (未指定の領域のタイプはUnknown)
 */
function splitStringByRanges(str: string, ranges: { start: number, end: number, type: ASTElement["type"] }[]): ASTElement[] {
    const result: ASTElement[] = [];
    let lastIndex = 0;

    for (const { start, end, type } of ranges) {
        if (start > lastIndex) {
            result.push({
                content: str.substring(lastIndex, start),
                type: "Unknown",
                prefix: null,
                suffix: null
            });
        }
        result.push({
            content: str.substring(start, end + 1),
            type,
            prefix: null,
            suffix: null
        });
        lastIndex = end + 1;
    }

    if (lastIndex < str.length) {
        result.push({
            content: str.substring(lastIndex),
            type: "Unknown",
            prefix: null,
            suffix: null
        });
    }

    return result;
}

function formatUnknown(elements: ASTElement[]) {
    const result: ASTElement[] = [];

    const separators = []
    while (true) {
        let isSep: ASTElement | null = elements.pop()!;
        if (!SEPARATORS.test(isSep.content)) {
            elements.push(isSep);
            isSep = null;
        } else {
            separators.push(isSep)
        }
        if (!elements.length || isSep === null) {
            break;
        }
    }
    while (true) {
        if (elements.length && SEPARATORS.test(elements[0].content)) {
            const sep_element = elements.shift()!;
            sep_element.type = "Separator";
            result.push(sep_element);
        } else {
            break;
        }
    }
    if (elements.length) {
        result.push({
            content: elements.map(e => e.content).join(""),
            type: "Unknown",
            prefix: null,
            suffix: null
        });
    }
    if (separators.length) {
        separators.forEach(e => {
            e.type = "Separator";
            result.push(e);
        })
    }

    return result
}

/**
 * トークン化された文字列の配列からAbstract Syntax Treeを生成
 * @returns Abstract Syntax Tree 
 */
export const genAST = (tokens: string[]): ASTResult[] => {
    const result: ASTResult[] = [];

    const tokensLength = tokens.length;
    for (let i = 0; i < tokensLength; i++) {
        const token = tokens[i];
        if (BRACKET_MAP[token]) {
            const prefix = token;
            const suffix = BRACKET_MAP[token];
            const contents: string[] = [];

            while (tokens[++i] !== suffix && i < tokens.length) {
                contents.push(tokens[i]);
            }

            result.push({
                content: ["「", "『", "｢"].includes(prefix) ? [{
                    content: contents.join(""),
                    type: "Constant",
                    prefix: null,
                    suffix: null
                }] : genAST(contents),
                type: "Block",
                prefix,
                suffix
            });
            continue;
        }

        let combinedToken = token;

        REGEXPS.forEach((re, ind) => {
            if (re.test(token)) {
                let n = 0;
                while (tokens[i + ++n] && tokens[i + n] === " ") {
                    combinedToken += tokens[i + n];
                }
                if (SECOND_REGEXPS[ind].test(tokens[i + n])) {
                    combinedToken += tokens[i + n];
                    i += n;
                }
            }
        });

        const episodeExtracted = episode(combinedToken.trim(), true);
        const seasonExtracted = season(combinedToken.trim());

        const ranges = [
            ...episodeExtracted.map(e => ({ start: e.range[0], end: e.range[1], type: "Episode" as const })),
            ...seasonExtracted.map(e => ({ start: e.range[0], end: e.range[1], type: "Season" as const }))
        ];

        const tempResult = ranges.length > 0 ? splitStringByRanges(combinedToken, ranges) : [{
            content: token,
            type: "Unknown",
            prefix: null,
            suffix: null
        } as ASTElement];

        tempResult.forEach(element => {
            if (element.type === "Unknown") {
                if (element.content.startsWith("#")) {
                    result.push({
                        content: element.content.slice(1),
                        type: "Hashtag",
                        prefix: element.content[0],
                        suffix: null
                    });
                    return;
                }
                if (["期間限定", "見逃し", "公式", "アニメ", "全話", "イッキ見", "更新", "無料", "映画", "特別公開", "周年", "フル", "full"].some(v => element.content.includes(v))) {
                    result.push({
                        content: element.content,
                        type: "Promo",
                        prefix: element.prefix,
                        suffix: element.suffix
                    });
                    return;
                }
                if (/(\d+年|\/)?\d+月|\/\d+日?/.test(element.content)) {
                    let suffix = "";
                    for (let o = 1; tokens[i + o]; o++) {
                        if (tokens[i + o] === " ") {
                            suffix += tokens[i + o];
                        } else if ("(日月火水木金土".includes(tokens[i + o])) {
                            suffix += tokens[i + o];
                        } else if (tokens[i + o] === ")") {
                            suffix += tokens[i + o];
                            i += o;
                            break;
                        }
                    }
                    result.push({
                        content: element.content + suffix,
                        type: "Date",
                        prefix: element.prefix,
                        suffix: element.suffix
                    });
                    return;
                }
                if (/\d+[:(時間?)]\d+分?まで?/.test(element.content)) {
                    result.push({
                        content: element.content,
                        type: "Date",
                        prefix: element.prefix,
                        suffix: element.suffix
                    });
                    return;
                }
            }
            result.push(element);
        });
    }

    const mergedResult: ASTResult[] = [];
    let tempUnknowns: ASTElement[] = [];

    // 不明な単語同士を連結する
    for (const element of result) {
        if (element.type === "Unknown") {
            tempUnknowns.push(element);
            continue;
        }

        // 要素の前後がセパレータか判定して、セパレータとして設定する
        if (tempUnknowns.length) {
            mergedResult.push(...formatUnknown(tempUnknowns))
            tempUnknowns = []
        }
        mergedResult.push(element);
    }

    // 要素の前後がセパレータか判定して、セパレータとして設定する
    if (tempUnknowns.length) {
        mergedResult.push(...formatUnknown(tempUnknowns))
        tempUnknowns = []
    }

    // エピソード宣言の前後を付属語に設定する
    mergedResult.forEach((e, i) => {
        if (mergedResult[i - 1] && mergedResult[i - 1].type == "Episode" && e.type === "Unknown") {
            e.type = "Adjunct"
        }
        if (mergedResult[i + 1] && mergedResult[i + 1].type == "Episode" && e.type === "Unknown") {
            e.type = "Adjunct"
        }
    })

    return mergedResult;
};

/**
 * @param target 
 * @returns トークン化された文字列配列
 */
export const tokenize = (target: string): string[] => {
    const tokens: string[] = [];
    let currentPart = "";
    for (const char of target) {
        if (SEPARATORS.test(char)) {
            if (currentPart) {
                tokens.push(currentPart);
                currentPart = "";
            }
            tokens.push(char);
        } else {
            currentPart += char;
        }
    }

    if (currentPart) {
        tokens.push(currentPart.trim());
    }

    return tokens;
}

export const dump = (x: ASTResult): string => {
    if (isBlock(x)) {
        return (x.prefix ?? "") + x.content.map(y => dump(y)).join("") + (x.suffix ?? "");
    }
    return (x.prefix ?? "") + x.content + (x.suffix ?? "");
}
