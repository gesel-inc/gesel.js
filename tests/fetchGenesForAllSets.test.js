import * as utils from "./utils.js";
import * as gesel from "../src/index.js"

test("fetching genes for all sets works correctly", async () => {
    const tconf = utils.createTestConfig();
    let full = await gesel.fetchGenesForAllSets("9606", tconf);
    expect(full.some(x => x.length > 0)).toBe(true);

    const num_genes = (await gesel.fetchAllGenes("9606", tconf, { type: ["ensembl"] })).get("ensembl").length;
    for (const set of full) {
        if (set.length == 0) {
            continue;
        }

        let not_okay = 0;
        for (var i = 1; i < set.length; i++) {
            not_okay += set[i] <= set[i-1];
        }
        expect(not_okay).toEqual(0);
        expect(set[0]).toBeGreaterThanOrEqual(0);
        expect(set[set.length - 1]).toBeLessThan(num_genes);
    }

    // Works with reloading after the cache.
    const reloaded = await gesel.fetchGenesForAllSets("9606", tconf)
    expect(reloaded).toEqual(full);
})
