import { rangesToBlocks, consolidateRanges } from "./consolidateRanges.js";
import { extractRanges } from "./extractRanges.js";
import { fetchAllCollections } from "./fetchAllCollections.js";
import * as utils from "./utils.js";

async function initialize(species, config) {
    let cache;
    if ("fetchSomeCollections" in config.cache) {
        cache = config.cache.fetchSomeCollections;
    } else {
        cache = new Map;
        config.cache.fetchSomeCollections = cache;
    }

    const fname = species + "_collections.tsv";
    let spfound = cache.get(species);
    if (typeof spfound == "undefined") {
        const { ranges, extra } = await utils.retrieveRangesWithExtras(config, fname);
        spfound = {
            intervals: ranges,
            blocked: rangesToBlocks(ranges, config.consolidateBlockSize),
            sizes: extra,
            starts: [],
            prior: new Map
        };

        let first = 0;
        for (const s of extra) {
            spfound.starts.push(first);
            first += s;
        }

        cache.set(species, spfound);
    }

    return { fname, spfound };
}

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {object} config - Configuration object, see {@linkcode newConfig}.
 * @return {Array} Number of sets in each collection.
 * Each value corresponds to a collection in {@linkcode fetchAllCollections}.
 * @async
 */
export async function fetchCollectionSizes(species, config) {
    if ("fetchAllCollections" in config.cache) {
        const everything = await fetchAllCollections(species, config);
        let output = [];
        for (const x of everything) {
            output.push(x.size);
        }
        return output;
    }

    const { spfound } = await initialize(species, config);
    return spfound.sizes;
}

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {object} config - Configuration object, see {@linkcode newConfig}.
 * @return {number} Total number of collections for this species.
 * @async
 */
export async function numberOfCollections(species, config) {
    if ("fetchAllCollections" in config.cache) {
        const everything = await fetchAllCollections(species, config);
        return everything.length;
    }

    const { spfound } = await initialize(species, config);
    return spfound.sizes.length;
}

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {Array} collections - Array of collection IDs.
 * Each entry is a row index into the array returned by {@linkcode fetchAllCollections}. 
 * @param {object} config - Configuration object, see {@linkcode newConfig}.
 * 
 * @return {Array} Array of length equal to `collections`.
 * Each entry is an object containing details about the corresponding collection in `collections`.
 *
 * @async
 */
export async function fetchSomeCollections(species, collections, config) {
    if ("fetchAllCollections" in config.cache) {
        const everything = await fetchAllCollections(species, config);
        let output = [];
        for (const c of collections) {
            output.push(everything[c]);
        }
        return output;
    }

    const { fname, spfound } = await initialize(species, config);

    let needed = utils.setdiff(collections, spfound.prior); 
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
                const split = txt.split("\t");
                spfound.prior.set(ii, {
                    title: split[0],
                    description: split[1],
                    species: split[2],
                    maintainer: split[3],
                    source: split[4],
                    start: spfound.starts[ii],
                    size: spfound.sizes[ii]
                });
            }
        );
    }

    let output = [];
    for (const c of collections) {
        output.push(spfound.prior.get(c));
    }
    return output;
}
