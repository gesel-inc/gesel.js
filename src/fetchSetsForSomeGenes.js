import { rangesToBlocks, consolidateRanges } from "./consolidateRanges.js";
import { extractRanges } from "./extractRanges.js";
import { fetchSetsForAllGenes } from "./fetchSetsForAllGenes.js";
import * as utils from "./utils.js";

async function initialize(species, config) {
    let cache;
    if ("fetchSetsForSomeGenes" in config.cache) {
        cache = config.cache.fetchSetsForSomeGenes;
    } else {
        cache = new Map;
        config.cache.fetchSetsForSomeGenes = cache;
    }

    const fname = species + "_gene2set.tsv";
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

    return { fname, spfound };
}

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {object} config - Configuration object, see {@linkcode newConfig}.
 *
 * @return {number} Number of genes that belong to at least one set for `species`.
 * This can be used as a more appropriate universe size in {@linkcode testEnrichment}.
 */
export async function effectiveNumberOfGenes(species, config) {
    if ("fetchSetsForAllGenes" in config.cache) {
        const everything = await fetchSetsForAllGenes(species, config);
        let output = 0;
        for (const s of sets) {
            output += (s.length > 0);
        }
        return output;
    }

    const { spfound } = await initialize(species, config);
    let okay = 0;
    for (var i = 1; i < spfound.intervals.length; i++) {
        if (spfound.intervals[i] > spfound.intervals[i-1] + 1) { // skip the newline.
            okay++;
        }
    }

    return okay;
}

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {Array} genes - Array of gene IDs.
 * Each ID is a row index in any of the arrays returned by {@linkcode fetchAllGenes}.
 * @param {object} config - Configuration object, see {@linkcode newConfig}.
 *
 * @return {Array} Array of length equal to `genes`.
 * Each entry is a Uint32Array containing the IDs for all sets containing to the corresponding gene in `genes`.
 * Set IDs refer to indices in {@linkcode fetchAllSets}.
 * 
 * @async
 */
export async function fetchSetsForSomeGenes(species, genes, config) {
    if ("fetchSetsForAllGenes" in config.cache) {
        const everything = await fetchSetsForAllGenes(species, config);
        let output = [];
        for (const g of genes) {
            output.push(everything[g]);
        }
        return output;
    }

    const { fname, spfound } = await initialize(species, config);

    let needed = utils.setdiff(genes, spfound.prior); 
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
    for (const g of genes) {
        output.push(spfound.prior.get(g));
    }
    return output;
}
