import * as utils from "./utils.js";
import * as gesel from "../src/index.js";

test("fetchAllCollections works as expected", async () => {
    const tconf = utils.createTestConfig();
    let coll = await gesel.fetchAllCollections("9606", tconf);
    expect(coll.length).toBeGreaterThan(0);

    let is_okay = 0;
    for (const x of coll) {
        is_okay += (typeof x.title == "string" && x.title.length > 0) &&
            (typeof x.description == "string" && x.description.length > 0) && 
            (typeof x.species == "string" && x.species.length > 0 && x.species.match("^[0-9]+$") !== null) && 
            (typeof x.maintainer == "string" && x.maintainer.length > 0) &&
            (typeof x.source == "string" && x.source.length > 0) &&
            (typeof x.start == "number" && x.start >= 0) &&
            (typeof x.size == "number" && x.size > 0);
    }

    expect(is_okay).toEqual(coll.length);
    expect(coll[0].start).toEqual(0);

    // Works with reloading from the cache.
    let reloaded = await gesel.fetchAllCollections("9606", tconf);
    expect(coll).toEqual(reloaded);
})
