import * as utils from "./utils.js";
import * as gesel from "../src/index.js"

test("fetchSetsForSomeGenes works correctly", async () => {
    // Deliberately create a separate test config so that we don't just pull the requested sets from cache.
    const everything = await gesel.fetchSetsForAllGenes("9606", utils.createTestConfig());

    const tconf = utils.createTestConfig();
    const chosen_genes = new Set(utils.sample(everything.length, 20));
    chosen_genes.add(0);
    chosen_genes.add(everything.length - 1);
    const chosen = Array.from(chosen_genes);

    const test = await gesel.fetchSetsForSomeGenes("9606", chosen, tconf)
    expect(test).toEqual(chosen.map(ii => everything[ii]));

    const expected_genes = everything.filter(x => x.length > 0).length;
    expect(await gesel.effectiveNumberOfGenes("9606", tconf)).toBe(expected_genes);

    // Works with full caching.
    const reloaded = await gesel.fetchSetsForSomeGenes("9606", chosen, tconf)
    expect(reloaded).toEqual(test);

    // Works with partial caching.
    const extras = utils.sample(everything.length, 10); // using a random sample to hopefully hit some different blocks.
    const chosen_plus = [...chosen, ...extras];
    const reloaded_plus = await gesel.fetchSetsForSomeGenes("9606", chosen_plus, tconf);
    expect(reloaded_plus).toEqual(chosen_plus.map(ii => everything[ii]));

    // Works with pre-loading.
    await gesel.fetchGenesForAllSets("9606", tconf);
    const preloaded = await gesel.fetchSetsForSomeGenes("9606", chosen, tconf)
    expect(preloaded).toEqual(test);
    expect(await gesel.effectiveNumberOfGenes("9606", tconf)).toBe(expected_genes);
})
