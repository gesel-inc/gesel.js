import * as utils from "./utils.js";
import * as gesel from "../src/index.js";

test("mapGenesByIdentifier works as expected", async () => {
    const tconf = utils.createTestConfig();
    let info = await gesel.mapGenesByIdentifier("10090", "symbol", tconf, { lowerCase: false });
    expect(info.size).toBeGreaterThan(0);
    let nvals = (await gesel.fetchAllGenes("10090", tconf)).get("ensembl").length; // every type's array should have the same length.

    let is_upper = 0;
    let okay_ids = 0;
    for (const [k, v] of info) {
        is_upper += (k.toLowerCase() !== k);
        okay_ids += v.every(y => (y >= 0 && y < nvals));
    }

    expect(is_upper).toBeGreaterThan(0);
    expect(okay_ids).toEqual(info.size);

    // Check with a more concrete example.
    expect(info.has("SNAP25")).toBe(false);
    expect(info.has("Snap25")).toBe(true);
    expect(info.get("Snap25").length).toBeGreaterThan(0);
})

test("mapGenesByIdentifier works as expected with lowercasing", async () => {
    const tconf = utils.createTestConfig();
    let info = await gesel.mapGenesByIdentifier("10090", "symbol", tconf, { lowerCase: true });
    expect(info.size).toBeGreaterThan(0);
    let nvals = (await gesel.fetchAllGenes("10090", tconf)).get("ensembl").length;

    let is_upper = 0;
    let okay_ids = 0;
    for (const [k, v] of info) {
        is_upper += (k.toLowerCase() !== k);
        okay_ids += v.every(y => (y >= 0 && y < nvals));
    }

    expect(is_upper).toBe(0);
    expect(okay_ids).toEqual(info.size);

    // Check with a more concrete example.
    expect(info.has("snap25")).toBe(true);
})
