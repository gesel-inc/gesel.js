import * as utils from "./utils.js";

/**
 * Fetch the identities of the sets that contain each gene in the Gesel database.
 *
 * If this function is called once, the returned list will be cached in memory and re-used in subsequent calls to this function.
 * The cached data will also be used to speed up calls to {@linkcode fetchSetsForSomeGenes}.
 *
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {object} config - Configuration object, see {@linkcode newConfig}.
 *
 * @return {Array} Array of length equal to the total number of genes for this `species`.
 * Each element corresponds to an entry in {@linkcode fetchAllGenes} and is a Uint32Array containing the IDs for all sets containing that gene.
 * Set IDs refer to indices in {@linkcode fetchAllSets}.
 *
 * @async
 */
export async function fetchSetsForAllGenes(species, config) {
    let cache;
    if ("fetchSetsForAllGenes" in config.cache) {
        cache = config.cache.fetchSetsForAllGenes;
    } else {
        cache = new Map;
        config.cache.fetchSetsForAllGenes = cache;
    }

    let found = cache.get(species);
    if (typeof found !== "undefined") {
        return found;
    }

    let res = await config.fetchFile(species + "_gene2set.tsv.gz");
    var gene_data = await utils.decompressLines(res);
    let loaded = gene_data.map(utils.decodeIndices);
    cache.set(species, loaded);
    return loaded;
}
