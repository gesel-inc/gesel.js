import * as utils from "./utils.js";
import * as gesel from "../src/index.js";

test("fetchSomeSets work correctly", async () => {
    // Use a dedicated config here so that all subsequent calls don't just pull from the cache.
    const everything = await gesel.fetchAllSets("10090", utils.createTestConfig())

    const chosen_set = new Set(utils.sample(everything.length, 5));
    chosen_set.add(0);
    chosen_set.add(everything.length - 1);
    const chosen = Array.from(chosen_set);

    const tconf = utils.createTestConfig();
    const test = await gesel.fetchSomeSets("10090", chosen, tconf)
    expect(test).toEqual(chosen.map(ii => everything[ii]));

    const all_sizes = everything.map(x => x.size);
    expect(await gesel.fetchSetSizes("10090", tconf)).toEqual(all_sizes);
    expect(await gesel.numberOfSets("10090", tconf)).toEqual(everything.length);

    // Works with full caching.
    const reloaded = await gesel.fetchSomeSets("10090", chosen, tconf);
    expect(reloaded).toEqual(test);

    // Works with partial caching.
    const extras = utils.sample(everything.length, 10); // using a random sample to hopefully hit some different blocks.
    const chosen_plus = [...chosen, ...extras];
    const reloaded_plus = await gesel.fetchSomeSets("10090", chosen_plus, tconf);
    expect(reloaded_plus).toEqual(chosen_plus.map(ii => everything[ii]));

    // Works with pre-loading.
    await gesel.fetchAllSets("10090", tconf);
    let preloaded = await gesel.fetchSomeSets("10090", chosen, tconf);
    expect(preloaded).toEqual(test);
})
