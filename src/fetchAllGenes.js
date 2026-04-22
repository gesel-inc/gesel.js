import { gene_download, decompressLines } from "./utils.js";

var _genes = new Map;

/**
 * @param {string} species - The taxonomy ID of the species of interest, e.g., `"9606"` for human.
 * @param {object} [options={}] - Optional parameters.
 * @param {?Array} [options.types=null] - Array of strings specifying the identifier types to be retrieved.
 * The exact choice of strings depends on how the references were constructed.
 * If `null`, it defaults to an array containing `"symbol"`, `"entrez"` and `"ensembl"`.
 *
 * @return {Map} Object where each key is named after an identifier type in `types`.
 * Each value is an array where each element corresponds to a gene and is itself an array of strings containing all identifiers of the current type for that gene.
 *
 * The arrays for different identifier types are all of the same length, and corresponding elements across these arrays describe the same gene.
 * **gesel**'s identifier for each gene (i.e., the "gene ID") is defined as the index of that gene in any of these arrays.
 *
 * @async
 */
export async function fetchAllGenes(species, { types = null } = {}) {
    if (types == null) {
        types = [ "symbol", "entrez", "ensembl" ];
    }

    let target = _genes.get(species);
    if (typeof target == "undefined") {
        target = new Map;
        _genes.set(species, target);
    }

    let output = new Map;
    let promises = [];
    let processing = [];

    for (const t of types) {
        let found = target.get(t);
        if (typeof found == "undefined") {
            promises.push(gene_download(species + "_" + t + ".tsv.gz"));
            processing.push(t);
        } else {
            output.set(t, found);
        }
    }

    if (promises.length > 0) {
        let resolved = await Promise.all(promises);
        for (var i = 0; i < resolved.length; i++) {
            let res = resolved[i];
            if (!res.ok) {
                throw "failed to fetch symbol information for genes";
            }
            var buffer = await res.arrayBuffer();

            let gene_data = await decompressLines(buffer);
            let processed = [];
            for (const x of gene_data) {
                if (x == "") {
                    processed.push([]);
                } else {
                    processed.push(x.split("\t"));
                }
            }

            let t = processing[i];
            target.set(t, processed);
            output.set(t, processed);
        }
    }

    return output;
}
