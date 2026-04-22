import * as utils from "./utils.js";

const _cache = new Map;

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {object} [options={}] - Optional parameters.
 * @param {boolean} [options.download=true] - Whether to download the gene-to-set mappings if they are not already available.
 * If `false`, `null` is returned if the gene-to-set mappings have not already been loaded into memory.
 *
 * @return {?Array} Array of length equal to the total number of genes for this `species`.
 * Each element corresponds to an entry in {@linkcode fetchAllGenes} and is an array of integers containing the IDs for all sets containing that gene.
 * Set IDs refer to indices in {@linkcode fetchAllSets}.
 *
 * If the gene-to-set mappings have not already been loaded and `download = false`, `null` is returned.
 * @async
 */
export async function fetchSetsForAllGenes(species, { download = true } = {}) {
    let found = _cache.get(species);
    if (typeof found !== "undefined") {
        return found;
    } else if (!download) {
        return null;
    }

    let res = await utils.reference_download(species + "_gene2set.tsv.gz");
    if (!res.ok) {
        throw new Error("failed to fetch full gene-to-set information for species '" + species + "'");
    }

    var gene_data = await utils.decompressLines(await res.arrayBuffer());
    let loaded = gene_data.map(utils.convertToUint32Array);
    _cache.set(species, loaded);
    return loaded;
}
