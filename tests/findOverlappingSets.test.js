import * as gesel from "../src/index.js";
import * as utils from "./utils.js";

test("finding overlapping sets works as expected", async () => {
    const tconf = utils.createTestConfig();
    var found = await gesel.findOverlappingSets("9606", [0, 1, 2, 3, 4, 100, 101, 102, 103], tconf);
    expect(found.length > 0).toBe(true);

    let okay = 0;
    for (const x of found) {
        okay += x.count >= 1 && x.count <= x.size && x.pvalue > 0 && x.pvalue < 1;
    }
    expect(okay).toEqual(found.length);

    // Works without the extras.
    var found = await gesel.findOverlappingSets("9606", [0, 1, 2, 3, 4, 100, 101, 102, 103], tconf, { includeSize: false, testEnrichment: false });
    expect("size" in found[0]).toBe(false);
    expect("pvalue" in found[0]).toBe(false);
})
