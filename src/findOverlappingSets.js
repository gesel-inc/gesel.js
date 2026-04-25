import { fetchSetSizes } from "./fetchSomeSets.js";
import { fetchSetsForSomeGenes, effectiveNumberOfGenes } from "./fetchSetsForSomeGenes.js";
import * as enrich from "./testEnrichment.js";

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {Array} genes - Array of unique integers containing user-supplied gene IDs, see {@linkcode fetchAllGenes} for details.
 * @param {object} config - Configuration object, see {@linkcode newConfig}.
 * @param {object} [options={}] - Optional parameters.
 * @param {boolean} [options.includeSize=true] - Whether to include the size of each set in the output.
 * @param {boolean} [options.testEnrichment=true] - Whether to compute the enrichment p-value for each set with {@linkcode testEnrichment}.
 * The list and universe sizes will only count genes that are involved in at least one set, by checking {@linkcode fetchSetsForGene} and {@linkcode effectiveNumberOfGenes} respectively.
 *
 * @return {Array} An array of objects, where each object corresponds to a set that has non-zero overlaps with `genes`.
 * Each object contains:
 *
 * - `id`: the ID of the set in {@linkcode fetchAllSets}.
 * - `count`: the number of genes in the set that overlap with genes in `genes`.
 * - `size`: the size of each set.
 *   Only included if `includeSize = true`.
 * - `pvalue`: the enrichment p-value.
 *   Only included if `testEnrichment = true`.
 *
 * @async
 */
export async function findOverlappingSets(species, genes, config, { includeSize = true, testEnrichment = true } = {}) {
    genes = Array.from(new Set(genes));
    let collected = await fetchSetsForSomeGenes(species, genes, config);
    let output = countSetOverlaps(collected);

    let sets_sizes = (includeSize || testEnrichment ? await fetchSetSizes(species, config) : null);
    if (includeSize) {
        for (const details of output) {
            details.size = sets_sizes[details.id];
        }
    }
    if (testEnrichment) {
        let effective_list = 0; // only considering genes involved in at least one set.
        for (const v of collected) {
            effective_list += (v.length > 0);
        }
        let universe = await effectiveNumberOfGenes(species, config);
        for (const details of output) {
            details.pvalue = enrich.testEnrichment(details.count, effective_list, sets_sizes[details.id], universe);
        }
    }

    return output;
}

/**
 * This is a utility function that is called internally by {@linkcode findOverlappingSets}.
 * However, it can be used directly to obtain overlap counts if the gene-to-set mappings are manually obtained.
 *
 * @param {Array} setsForSomeGenes - Array where each entry corresponds to a gene and contains an array of the set IDs containing that gene.
 * Each inner array is typically the result of calling {@linkcode fetchSetsForGene}.
 *
 * @return {Array} An array of objects, where each object corresponds to a set that is present in at least one entry of `setsForSomeGenes`.
 * Each object contains:
 *
 * - `id`: the ID of the set in {@linkcode fetchAllSets}.
 * - `count`: the number of genes in the set that overlap with genes in `genes`.
 */
export function countSetOverlaps(setsForSomeGenes) {
    var set_count = new Map;
    for (const found of setsForSomeGenes) {
        for (const set of found) {
            let current = set_count.get(set);
            if (typeof current == "undefined") {
                set_count.set(set, 1);
            } else {
                set_count.set(set, current + 1);
            }
        }
    }

    let output = [];
    for (const [id, count] of set_count) {
        let id0 = Number(id);
        let details = { 
            "id": id0,
            "count": count
        };
        output.push(details);
    }

    return output;
}

