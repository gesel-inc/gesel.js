import { fetchAllGenes } from "./fetchAllGenes.js";
import { mapGenesByIdentifier } from "./mapGenesByIdentifier.js";

/**
 * @param {string} species - Taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {Array} queries - Array of strings containing gene identifiers of some kind (e.g., Ensembl, symbol, Entrez).
 * @param {object} config - Configuration object, see {@linkcode newConfig}.
 * @param {object} [options={}] - Optional parameters.
 * @param {?Array} [options.types=null] - Array of strings specifying the identifier types to use for searching.
 * The exact choice of strings depends on how the references were constructed.
 * If `null`, it defaults to an array containing `"entrez"`, `"ensembl"` and `"symbol"`.
 * @param {boolean} [options.ignoreCase=true] - Whether to perform case-insensitive matching.
 *
 * @return {Array} An array of length equal to `queries`.
 * Each element of the array is an array containing the **gesel** gene IDs with any identifiers that match the corresponding search string.
 * See {@linkcode fetchAllGenes} for more details on the interpretation of these IDs.
 *
 * @async
 */
export async function searchGenes(species, queries, config, { types = null, ignoreCase = true } ={}) {
    if (types === null) {
        types = [ "entrez", "ensembl", "symbol" ];
    }

    let promises = [];
    for (const t of types) {
        promises.push(mapGenesByIdentifier(species, t, config, { lowerCase: ignoreCase }));
    }
    let resolved = await Promise.all(promises);

    let mapping = [];
    for (var i = 0; i < queries.length; i++) {
        let current = queries[i];
        if (current.length == 0) {
            mapping.push([]);
            continue;
        }

        if (ignoreCase) {
            current = current.toLowerCase();
        }

        let findings = [];
        for (var j = 0; j < types.length; j++) {
            let val = resolved[j].get(current);
            if (typeof val !== "undefined") {
                for (const v of val) {
                    findings.push(v);
                }
            }
        }

        mapping.push(findings);
    }

    return mapping;
}

