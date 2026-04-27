import { decompressLines } from "./utils.js";

/**
 * Fetch information about all gene set collections in the Gesel database.
 *
 * If this function is called once, the data frame will be cached in memory and re-used in subsequent calls to this function.
 * The cached data will also be used to speed up calls to {@linkcode fetchSomeCollections}.
 *
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {object} config - Configuration object, see {@linkcode newConfig}.
 *
 * @return {Array} Array of objects where each entry corresponds to a gene set collection and contains details about that collection.
 * Each object can be expected to contain:
 * 
 * - `title`, the title for the collection.
 * - `description`, the description for the collection.
 * - `species`, the species for all gene identifiers in the collection.
 *   This should contain the full scientific name, e.g., `"Homo sapiens"`, `"Mus musculus"`.
 * - `maintainer`, the maintainer of this collection.
 * - `source`, the source of this set, usually a link to some external resource.
 * - `start`, the index for the first set in the collection in the output of {@linkcode sets}.
 *   All sets from the same collection are stored contiguously.
 * - `size`, the number of sets in the collection.
 *
 * In a **gesel** context, the identifier for a collection (i.e., the "collection ID") is defined as the index of the collection in this array.
 *
 * @async
 */
export async function fetchAllCollections(species, config) {
    let cache;
    if ("fetchAllCollections" in config.cache) {
        cache = config.cache.fetchAllCollections;
    } else {
        cache = new Map;
        config.cache.fetchAllCollections = cache;
    }

    let target = cache.get(species);
    if (typeof target !== "undefined") {
        return target;
    }

    var cres = await config.fetchFile(species + "_collections.tsv.gz");
    var coll_data = await decompressLines(cres);

    var start = 0;
    target = [];

    for (var i = 0; i < coll_data.length; i++) {
        let x = coll_data[i];
        var details = x.split("\t");
        var len = Number(details[5]);
        target.push({
            "title": details[0],
            "description": details[1],
            "species": details[2],
            "maintainer": details[3],
            "source": details[4],
            "start": start,
            "size": len
        });
        start += len;
    }

    cache.set(species, target);
    return target;
}
