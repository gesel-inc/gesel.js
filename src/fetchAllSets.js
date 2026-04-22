import { reference_download, decompressLines } from "./utils.js";
import { fetchAllCollections } from "./fetchAllCollections.js";

var _sets = new Map;

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {object} [options={}] - Optional parameters.
 * @param {boolean} [options.download=true] - Whether to download the set details if they are not already available.
 * If `false`, `null` is returned if the set details have not already been loaded into memory.
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
 * If the set details have not already been loaded and `download = false`, `null` is returned.
 * @async
 */
export async function fetchAllSets(species, { download = true } = {}) {
    let found = _sets.get(species);
    if (typeof found !== "undefined") {
        return found;
    } else if (!download) {
        return null;
    }

    found = [];
    _sets.set(species, found);

    var [ sres, _collections ] = await Promise.all([reference_download(species + "_sets.tsv.gz"), fetchAllCollections(species)]);
    if (!sres.ok) {
        throw new Error("failed to fetch set information for species '" + species + "'");
    }
    var set_data = await decompressLines(await sres.arrayBuffer());

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
    for (var i = 0; i < _collections.length; i++) {
        let len = _collections[i].size;

        // For easier access going the other way.
        for (var j = 0; j < len; j++) {
            found[j + start].collection = i;
            found[j + start].number = j;
        }

        start += len;
    }

    return found;
}
