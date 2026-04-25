import { fetchAllGenes } from "./fetchAllGenes.js";

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {string} type - Type of the identifier to use as the key of the map, e.g., `"ensembl"`.
 * @param {object} config - Configuration object, see {@linkcode newConfig}.
 * @param {object} [options={}] - Optional parameters.
 * @param {boolean} [options.lowerCase=false] - Whether to use lower-case keys in the map.
 *
 * @return {Map} Map where each key is a string containing a (possibly lower-cased) identifier of the specified `type` and each value is an array.
 * Each array contains the **gesel** gene IDs associated with the `type` identifier, see {@linkcode fetchAllGenes} for ore details.
 *
 * @async
 */
export async function mapGenesByIdentifier(species, type, config, { lowerCase = false } = {}) {
    let cache;
    if ("mapGenesByIdentifier" in config.cache) {
        cache = config.cache.mapGenesByIdentifier;
    } else {
        cache = new Map;
        config.cache.mapGenesByIdentifier = cache;
    }

    let spfound = cache.get(species);
    if (typeof spfound == "undefined") {
        spfound = {
            normal: new Map,
            lower: new Map
        };
        cache.set(species, spfound);
    }

    let host = (lowerCase ? spfound.lower : spfound.normal);
    let tfound = host.get(type);
    if (typeof tfound === "undefined") {
        tfound = new Map;
        host.set(type, tfound);

        let _genes = (await fetchAllGenes(species, config, { types: [ type ] })).get(type);
        for (var i = 0; i < _genes.length; i++) {
            for (let y of _genes[i]) {
                if (lowerCase) {
                    y = y.toLowerCase();
                }

                let current = tfound.get(y);
                if (typeof current !== "undefined") {
                    current.add(i);
                } else {
                    tfound.set(y, new Set([i]));
                }
            }
        }

        for (const [key, val] of tfound) {
            tfound.set(key, Array.from(val));
        }
    }

    return tfound;
}
