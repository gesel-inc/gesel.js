import * as utils from "./utils.js";
import * as gesel from "../src/index.js"

test("fetching sets for all genes works correctly", async () => {
    const tconf = utils.createTestConfig();
    const full = await gesel.fetchSetsForAllGenes("9606", tconf)
    expect(full.some(x => x.length > 0)).toBe(true);

    const num_sets = (await gesel.fetchAllSets("9606", tconf)).length;
    for (const gene of full) {
        if (gene.length == 0) {
            continue;
        }

        let not_okay = 0;
        for (var i = 1; i < gene.length; i++) {
            not_okay += gene[i] <= gene[i-1];
        }
        expect(not_okay).toEqual(0);
        expect(gene[0]).toBeGreaterThanOrEqual(0);
        expect(gene[gene.length - 1]).toBeLessThan(num_sets);
    }

    // Works with reloading after the cache.
    const reloaded = await gesel.fetchSetsForAllGenes("9606", tconf)
    expect(reloaded).toEqual(full);
})
