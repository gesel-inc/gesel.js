import * as utils from "./utils.js";

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {object} config - Configuration object, see {@linkcode newConfig}.
 *
 * @return {?Array} Array of length equal to the total number of sets for this `species`.
 * Each element corresponds to an entry in {@linkcode fetchAllSets} and is a Uint32Array containing the IDs for all genes belonging to that set.
 * Gene IDs refer to indices in {@linkcode fetchAllGenes}.
 *
 * @async
 */
export async function fetchGenesForAllSets(species, config) {
    let cache;
    if ("fetchGenesForAllSets" in config.cache) {
        cache = config.cache.fetchGenesForAllSets;
    } else {
        cache = new Map;
        config.cache.fetchGenesForAllSets = cache;
    }

    let found = cache.get(species);
    if (typeof found !== "undefined") {
        return found;
    }

    let res = await config.fetchFile(species + "_set2gene.tsv.gz");
    var set_data = await utils.decompressLines(res);
    let loaded = set_data.map(utils.decodeIndices);
    cache.set(species, loaded);
    return loaded;
}
