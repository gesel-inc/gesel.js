import { decompressLines } from "./utils.js";
import { fetchAllCollections } from "./fetchAllCollections.js";

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {object} config - Configuration object, see {@linkcode newConfig}.
 *
 * @return {Array} Array of objects where each entry corresponds to a set and contains the details about that set.
 * Each object can be expected to contain:
 * 
 * - `name`, the name of the set.
 * - `description`, the description of the set.
 * - `size`, the number of genes in the set.
 * - `collection`, the index of the collection containing the set.
 * - `number`, the number of the set within the collection.
 *
 * In a **gesel** context, the identifier for a set (i.e., the "set ID") is defined as the index of the set in this array.
 *
 * @async
 */
export async function fetchAllSets(species, config) {
    let cache;
    if ("fetchAllSets" in config.cache) {
        cache = config.cache.fetchAllSets;
    } else {
        cache = new Map;
        config.cache.fetchAllSets = cache;
    }

    let found = cache.get(species);
    if (typeof found !== "undefined") {
        return found;
    }

    found = [];
    cache.set(species, found);

    var [ sres, collections ] = await Promise.all([config.fetchFile(species + "_sets.tsv.gz"), fetchAllCollections(species, config)]);
    var set_data = await decompressLines(sres);

    for (var i = 0; i < set_data.length; i++) {
        let x = set_data[i];
        var details = x.split("\t");
        found.push({
            "name": details[0],
            "description": details[1],
            "size": Number(details[2])
        });
    }

    let start = 0;
    for (var i = 0; i < collections.length; i++) {
        let len = collections[i].size;

        // For easier access going the other way.
        for (var j = 0; j < len; j++) {
            found[j + start].collection = i;
            found[j + start].number = j;
        }

        start += len;
    }

    return found;
}
