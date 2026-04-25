import { rangesToBlocks, consolidateRanges } from "./consolidateRanges.js";
import { extractRanges } from "./extractRanges.js";
import { fetchGenesForAllSets } from "./fetchGenesForAllSets.js";
import * as utils from "./utils.js";

/**
 * Fetch the gene membership of some sets in the Gesel database.
 * This can be more efficient than {@linkcode fetchGenesForAllSets} if only a few sets are of interest.
 *
 * Every time this function is called, information from the requested `sets` will be added to an in-memory cache.
 * Subsequent calls to this function will re-use as many of the cached sets as possible before making new requests to the Gesel database.
 * 
 * If {@linkcode fetchGenesForAllSets} was previously called, its cached data will be directly used by `fetchGenesForSomeSets` to avoid performing extra requests to the database.
 * If `sets` is large, it may be more efficient to call {@linkcode fetchGenesForAllSets} to prepare the cache before calling this function.
 * 
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {Array} sets - Array of set IDs.
 * Each ID is a row index in the array returned by {@linkcode fetchAllSets}. 
 * @param {object} config - Configuration object, see {@linkcode newConfig}.
 *
 * @return {Array} Array of length equal to `sets`.
 * Each entry is a Uint32Array containing the IDs for all genes belonging to the corresponding set in `sets`.
 * Gene IDs refer to indices in {@linkcode fetchAllGenes}.
 *
 * @async
 */
export async function fetchGenesForSomeSets(species, sets, config) {
    if ("fetchGenesForAllSets" in config.cache) {
        const everything = await fetchGenesForAllSets(species, config);
        let output = [];
        for (const s of sets) {
            output.push(everything[s]);
        }
        return output;
    }

    let cache;
    if ("fetchGenesForSomeSets" in config.cache) {
        cache = config.cache.fetchGenesForSomeSets;
    } else {
        cache = new Map;
        config.cache.fetchGenesForSomeSets = cache;
    }
    let modified = false;

    const fname = species + "_set2gene.tsv";
    let spfound = cache.get(species);
    if (typeof spfound == "undefined") {
        const intervals = await utils.retrieveRanges(config, fname);
        spfound = {
            intervals: intervals,
            blocked: rangesToBlocks(intervals, config.consolidateBlockSize),
            prior: new Map
        };
        cache.set(species, spfound);
    }

    let needed = utils.setdiff(sets, spfound.prior); 
    if (needed.length > 0) {
        const consolidated = consolidateRanges(spfound.intervals, spfound.blocked, needed);
        const consolidated_parts = await config.fetchRanges(fname, consolidated.start, consolidated.end);

        extractRanges(
            consolidated_parts,
            consolidated.start,
            consolidated.end,
            spfound.intervals,
            consolidated.requested,
            (ii, sliced) => { spfound.prior.set(ii, utils.decodeIndicesFromBuffer(sliced)); }
        );
    }

    let output = [];
    for (const s of sets) {
        output.push(spfound.prior.get(s));
    }
    return output;
}
