import * as gesel from "../src/index.js";
import * as utils from "./utils.js"; 

test("fetchGenesForSomeSets yields a sensible remote ref", async () => {
    // Deliberately create a separate test config so that we don't just pull the requested sets from cache.
    const everything = await gesel.fetchGenesForAllSets("9606", utils.createTestConfig());

    const tconf = utils.createTestConfig();
    const chosen_set = new Set(utils.sample(everything.length, 20));
    chosen_set.add(0);
    chosen_set.add(everything.length - 1);
    const chosen = Array.from(chosen_set);

    const test = await gesel.fetchGenesForSomeSets("9606", chosen, tconf)
    expect(test).toEqual(chosen.map(ii => everything[ii]));

    // Works with full caching.
    const reloaded = await gesel.fetchGenesForSomeSets("9606", chosen, tconf)
    expect(reloaded).toEqual(test);

    // Works with partial caching.
    const extras = utils.sample(everything.length, 10); // using a random sample to hopefully hit some different blocks.
    const chosen_plus = [...chosen, ...extras];
    const reloaded_plus = await gesel.fetchGenesForSomeSets("9606", chosen_plus, tconf);
    expect(reloaded_plus).toEqual(chosen_plus.map(ii => everything[ii]));

    // Works with pre-loading.
    await gesel.fetchGenesForAllSets("9606", tconf);
    const preloaded = await gesel.fetchGenesForSomeSets("9606", chosen, tconf)
    expect(preloaded).toEqual(test);
})
