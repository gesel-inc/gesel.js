import * as utils from "./utils.js";
import { rangesToBlocks, consolidateRanges } from "./consolidateRanges.js";
import { extractRanges } from "./extractRanges.js";
import { fetchAllSets } from "./fetchAllSets.js";
import { fetchCollectionSizes } from "./fetchSomeCollections.js";

async function initialize(species, config) {
    let cache;
    if ("fetchSomeSets" in config.cache) {
        cache = config.cache.fetchSomeSets;
    } else {
        cache = new Map;
        config.cache.fetchSomeSets = cache;
    }

    const fname = species + "_sets.tsv";
    let spfound = cache.get(species);
    if (typeof spfound == "undefined") {
        const resolved = await Promise.all([
            utils.retrieveRangesWithExtras(config, fname),
            fetchCollectionSizes(species, config)
        ]);
        const { ranges, extra } = resolved[0];
        const csizes = resolved[1];

        spfound = {
            intervals: ranges,
            sizes: extra,
            blocked: rangesToBlocks(ranges, config.consolidateBlockSize),
            collections: null, 
            prior: new Map
        };

        let parents = [];
        let internal_number = [];
        var totals = 0;
        for (var i = 0; i < csizes.length; i++) {
            let colsize = csizes[i];
            for (var j = 0; j < colsize; j++) {
                parents.push(i);
                internal_number.push(j);
            }
            totals += colsize;
        }
        if (totals != extra.length) {
            throw new Error("discrepancy between number of sets and sum of collection sizes");
        }
        spfound.collections = { parent: parents, number: internal_number };

        cache.set(species, spfound);
    }

    return { fname, spfound };
}

/**
 * Get the size of each gene set.
 *
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {object} config - Configuration object, see {@linkcode newConfig}.
 * @return {Array} Number of genes in each set.
 * Each value corresponds to a set in {@linkcode fetchAllSets}.
 * @async
 */
export async function fetchSetSizes(species, config) {
    if ("fetchAllSets" in config.cache) {
        const everything = await fetchAllSets(species, config);
        let output = [];
        for (const x of everything) {
            output.push(x.length);
        }
        return output;
    }

    const { spfound } = await initialize(species, config);
    return spfound.sizes;
}

/**
 * Get the total number of gene sets.
 *
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {object} config - Configuration object, see {@linkcode newConfig}.
 * @return {number} Total number of sets for this species.
 * @async
 */
export async function numberOfSets(species, config) {
    if ("fetchAllSets" in config.cache) {
        const everything = await fetchAllSets(species, config);
        return everything.length;
    }

    const { spfound } = await initialize(species, config);
    return spfound.sizes.length;
}

/**
 * Fetch the details of some gene sets from the Gesel database.
 * This can be more efficient than calling {@linkcode fetchAllSets} when only a few sets are of interest.
 *
 * Every time this function is called, information from the requested `sets` will be added to an in-memory cache.
 * Subsequent calls to this function will re-use as many of the cached sets as possible before making new requests to the Gesel database.
 *
 * If {@linkcode fetchAllSets} was previously called, its cached data will be directly used by `fetchSomeSets` to avoid performing extra requests to the database.
 * If `sets` is large, it may be more efficient to call {@linkcode fetchAllSets} to prepare the cache before calling this function.
 *
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {Array} sets - Array of set IDs.
 * Each ID is a row index in the array returned by {@linkcode fetchAllSets}. 
 * @param {object} config - Configuration object, see {@linkcode newConfig}.
 *
 * @return {Array} Array of length equal to `sets`.
 * Each entry is an object containing the set information for the corresponding set in `sets`.
 *
 * @async
 */
export async function fetchSomeSets(species, sets, config) {
    if ("fetchAllSets" in config.cache) {
        const everything = await fetchAllSets(species, config);
        let output = [];
        for (const s of sets) {
            output.push(everything[s]);
        }
        return output;
    }

    const { fname, spfound } = await initialize(species, config);

    let needed = utils.setdiff(sets, spfound.prior); 
    if (needed.length > 0) {
        const consolidated = consolidateRanges(spfound.intervals, spfound.blocked, needed);
        const consolidated_parts = await config.fetchRanges(fname, consolidated.start, consolidated.end);

        const dec = new TextDecoder;
        extractRanges(
            consolidated_parts,
            consolidated.start,
            consolidated.end,
            spfound.intervals,
            consolidated.requested,
            (ii, sliced) => {
                const txt = dec.decode(sliced);
                let split = txt.split("\t");
                spfound.prior.set(ii, {
                    name: split[0],
                    description: split[1],
                    size: spfound.sizes[ii],
                    collection: spfound.collections.parent[ii],
                    number: spfound.collections.number[ii]
                });
            }
        );
    }

    let output = [];
    for (const s of sets) {
        output.push(spfound.prior.get(s));
    }
    return output;
}
