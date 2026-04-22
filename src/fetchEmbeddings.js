import * as utils from "./utils.js";

const _cache = new Map;

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {object} [options={}] - Optional parameters.
 * @param {boolean} [options.download=true] - Whether to download the embeddings if they are not already available.
 * If `false`, `null` is returned if the embeddings have not already been loaded into memory.
 *
 * @return {?Object} Object with the `x` and `y`-coordinates for the t-SNE embedding.
 * 
 * Each value is a Float64Array of length equal to the total number of sets for this `species`.
 * Each entry of the Float64Array corresponds to a gene set in {@linkcode fetchAllSets} and that set's x/y-coordinates on the embedding.
 * 
 * If the embedding mappings have not already been loaded and `download = false`, `null` is returned.
 * @async
 */
export async function fetchEmbeddings(species, { download = true } = {}) {
    let found = _cache.get(species);
    if (typeof found !== "undefined") {
        return found;
    } else if (!download) {
        return null;
    }

    let res = await utils.reference_download(species + "_tsne.tsv.gz");
    if (!res.ok) {
        throw new Error("failed to fetch embeddings for species '" + species + "'");
    }

    let embed_data = await utils.decompressLines(await res.arrayBuffer());
    let loaded = convertToCoordinates(embed_data);

    _cache.set(species, loaded);
    return loaded;
}

// Provided for back-compatibility.
export function fetchEmbeddingsForSpecies(species, { download = true } = {}) {
    return fetchEmbeddings(species, { download });
}

function convertToCoordinates(lines) {
    var x = [], y = [];

    for (let i = 0; i < lines.length; i++) {
        let split = lines[i].split("\t");
        x.push(Number(split[0]));
        y.push(Number(split[1]));
    }

    return {
        "x": new Float64Array(x), 
        "y": new Float64Array(y)
    }
};
