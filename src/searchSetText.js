import * as utils from "./utils.js";

var n_init = false;
const n_cache = new Map;
var n_ranges;

export async function fetchSetsByNameToken(token) {
    let cached = n_cache.get(token);
    if (typeof cached !== "undefined") {
        return cached;
    }

    if (!n_init) {
        n_ranges = await utils.retrieveNamedRanges("tokens-names.tsv")
        n_init = true;
    }

    let pos = n_ranges.get(token);
    if (typeof pos === "undefined") {
        return new Uint8Array;
    }

    let text = await utils.retrieveBytes("tokens-names.tsv", pos[0], pos[1]);
    let output = utils.convertToUint32Array(text);
    n_cache.set(token, output);
    return output;
}

var d_init = false;
const d_cache = new Map;
var d_ranges;

export async function fetchSetsByDescriptionToken(token) {
    let cached = d_cache.get(token);
    if (typeof cached !== "undefined") {
        return cached;
    }

    if (!d_init) {
        d_ranges = await utils.retrieveNamedRanges("tokens-descriptions.tsv")
        d_init = true;
    }

    let pos = d_ranges.get(token);
    if (typeof pos === "undefined") {
        return new Uint8Array;
    }

    let text = await utils.retrieveBytes("tokens-descriptions.tsv", pos[0], pos[1]);
    let output = utils.convertToUint32Array(text);
    d_cache.set(token, output);
    return output;
}

/**
 * @param {string} query - Query string.
 * Each stretch of alphanumeric characters and dashes is treated as a single word.
 * A set's name and/or description must contain all words to be considered a match.
 * @param {object} [options={}] - Optional parameters.
 * @param {boolean} [options.inName=true] - Whether to search the name of the set for matching words.
 * @param {boolean} [options.inDescription=true] - Whether to search the description of the set for matching words.
 *
 * @return {Array} Array of indices of the sets with names and/or descriptions that match `query`.
 * @async
 */
export async function searchSetText(query, { inName = true, inDescription = true } = {}) {
    // Tokenizing the query using the same logic as in build_assets.R.
    let processed = query.toLowerCase().replace(/[^a-zA-Z0-9-]/g, " ");
    let tokens = processed.split(/\s+/);
    tokens = tokens.filter(x => x !== "" || x !== "-");

    let gathered_names = [];
    if (inName) {
        for (const tok of tokens) {
            gathered_names.push(fetchSetsByNameToken(tok));
        }
    }

    let gathered_descriptions = [];
    if (inDescription) {
        for (const tok of tokens) {
            gathered_descriptions.push(fetchSetsByDescriptionToken(tok));
        }
    }

    let resolved_names = await Promise.all(gathered_names);
    let resolved_descriptions = await Promise.all(gathered_descriptions);

    let gathered = [];
    for (var i = 0; i < tokens.length; i++) {
        let n = (inName ? resolved_names[i] : []);
        let d = (inDescription ? resolved_descriptions[i] : []);

        let combined = new Uint32Array(n.length + d.length);
        combined.set(n);
        combined.set(d, n.length);
        gathered.push(combined);
    }

    return utils.intersect(gathered);
}