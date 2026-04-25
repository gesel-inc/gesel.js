import * as utils from "./utils.js";
import { rangesToBlocks, consolidateRanges } from "./consolidateRanges.js";
import { extractRanges } from "./extractRanges.js";

export function binarySearchRight(query, vector) {
    let left = 0;
    let right = vector.length;

    while (left < right) {
        let mid = Math.trunc((left + right) / 2);
        if (vector[mid] < query) {
            left = mid + 1;
        } else if (vector[mid] > query) {
            right = mid;
        } else {
            return mid;
        }
    }

    return left;
}

async function fetchSetsByToken(species, tokens, type, config) {
    let cache;
    if ("fetchSetsByToken" in config.cache) {
        cache = config.cache.fetchSetsByToken;
    } else {
        cache = new Map;
        config.cache.fetchSetsByToken = cache;
    }

    const fname = species + "_tokens-" + type + ".tsv";
    let spfound = cache.get(species);
    if (typeof cached === "undefined") {
        const { ranges, order } = await utils.retrieveNamedRanges(config, fname);
        spfound = {
            intervals: ranges,
            order: order,
            blocked: rangesToBlocks(ranges, config.consolidateBlockSize),
            prior: new Map
        };
        cache.set(species, spfound);
    }

    const partial_mapping = new Map;
    const to_request = new Set;

    for (const token of tokens) {
        if (spfound.prior.has(token)) {
            continue; 
        }

        if (token.includes("*") || token.includes("?")) {
            // Wildcard handling.
            let initstub = token.replace(/[*?].*/, "")
            let pos = (initstub == "" ? 0 : binarySearchRight(initstub, spfound.order));
            let regex = new RegExp("^" + token.replace(/[*]/g, ".*").replace(/[?]/g, ".") + "$");

            let partial_idx = [];
            while (pos < spfound.order.length) {
                let candidate = spfound.order[pos];
                if (initstub != "" && !candidate.startsWith(initstub)) {
                    break;
                }
                if (candidate.match(regex)) {
                    to_request.add(pos);
                    partial_idx.push(pos);
                }
                pos++;
            }

            partial_mapping.set(token, partial_idx);

        } else {
            // Direct handling.
            const pos = binarySearchRight(token, spfound.order);
            if (pos < spfound.order.length && spfound.order[pos] == token) {
                to_request.add(pos);
            } else {
                spfound.prior.set(token, []);
            }
        }
    }

    if (to_request.size > 0) {
        const requested_idx = Array.from(to_request);
        const consolidated = consolidateRanges(spfound.intervals, spfound.blocked, requested_idx);
        const consolidated_parts = await config.fetchRanges(fname, consolidated.start, consolidated.end);

        extractRanges(
            consolidated_parts,
            consolidated.start,
            consolidated.end,
            spfound.intervals,
            consolidated.requested,
            (ii, sliced) => { spfound.prior.set(spfound.order[ii], utils.decodeIndicesFromBuffer(sliced)); }
        );
    }

    // Populating the cache for the wildcard-containing tokens.
    for (const [partial, concretes] of partial_mapping.entries()) {
        let collected = new Set;
        for (const iv of concretes) {
            for (const m of spfound.prior.get(spfound.order[iv])) {
                collected.add(m);
            }
        }
        const collected_idx = Array.from(collected);
        collected_idx.sort((a, b) => a - b);
        spfound.prior.set(partial, collected_idx);
    }

    let output = [];
    for (const tok of tokens) {
        output.push(spfound.prior.get(tok));
    }
    return output;
}

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {string} query - Query string containing multiple words to search in the names and/or descriptions of each set.
 *
 * Each stretch of alphanumeric characters and dashes is treated as a single word.
 * All other characters are treated as punctuation between words, except for the following wildcards:
 *
 * - `*`: match zero or more alphanumeric or dash characters.
 * - `?`: match exactly one alphanumeric or dash character.
 *
 * A set's name and/or description must contain all words in `query` to be considered a match.
 * @param {object} config - Configuration object, see {@linkcode newConfig}.
 * @param {object} [options={}] - Optional parameters.
 * @param {boolean} [options.inName=true] - Whether to search the name of the set for matching words.
 * @param {boolean} [options.inDescription=true] - Whether to search the description of the set for matching words.
 *
 * @return {Array} Array of indices of the sets with names and/or descriptions that match `query`.
 * @async
 */
export async function searchSetText(species, query, config, { inName = true, inDescription = true } = {}) {
    // Tokenizing the query using the same logic as in the feedstock repository,
    // but preserving our wildcards for special handling later.
    let processed = query.toLowerCase().replace(/[^a-zA-Z0-9-?*]/g, " ");
    let tokens = processed.split(/\s+/);
    tokens = tokens.filter(x => x !== "" || x !== "-");
    tokens = Array.from(new Set(tokens));

    let gathered = [];
    if (inName && inDescription) {
        const resolved = await Promise.all([
            fetchSetsByToken(species, tokens, "names", config),
            fetchSetsByToken(species, tokens, "descriptions", config)
        ]);

        const gathered_names = resolved[0];
        const gathered_descriptions = resolved[1];
        for (var t = 0; t < tokens.length; t++) {
            const combined = [...gathered_names[t], ...gathered_descriptions[t]];
            gathered.push(Array.from(new Set(combined)));
        }

    } else if (inName) {
        gathered = await fetchSetsByToken(species, tokens, "names", config);

    } else if (inDescription) {
        gathered = await fetchSetsByToken(species, tokens, "descriptions", config);
    }

    return utils.intersect(gathered);
}
