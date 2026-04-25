import * as utils from "./utils.js";
import * as gesel from "../src/index.js";

var candidates = [
    "Adam8",
    "SNAP25",
    "ENSG00000000003",
    "ensg00000000005",
    "ENSG11111000003",
    "asdasd",
    ""
];

test("mapping multiple genes works as expected", async () => {
    const tconf = utils.createTestConfig();
    var output = await gesel.searchGenes("9606", candidates, tconf);
    expect(output.length).toBe(candidates.length);

    // Case-insensitive matches.
    expect(output[0].length).toBeGreaterThanOrEqual(1);
    expect(output[1].length).toBeGreaterThanOrEqual(1);

    // This one is okay.
    expect(output[2].length).toBe(1);
    expect(output[3].length).toBe(1);

    var ginfo = await gesel.fetchAllGenes("9606", tconf);
    expect(ginfo.get("ensembl")[output[2][0]][0]).toBe(candidates[2]);
    expect(ginfo.get("ensembl")[output[3][0]][0]).toBe(candidates[3].toUpperCase());

    // Bad!
    expect(output[4].length).toBe(0);
    expect(output[5].length).toBe(0);
    expect(output[6].length).toBe(0);
});

test("mapping multiple genes works in a case-sensitive manner", async () => {
    const tconf = utils.createTestConfig();
    var output = await gesel.searchGenes("9606", candidates, tconf, { ignoreCase: false });
    expect(output.length).toBe(candidates.length);

    // Symbols don't match anymore.
    expect(output[0].length).toEqual(0);
    expect(output[1].length).toBeGreaterThanOrEqual(1);

    // This one is okay.
    expect(output[2].length).toBe(1);

    // But now this one is not.
    expect(output[3].length).toBe(0);

    // These are still bad!
    expect(output[4].length).toBe(0);
    expect(output[5].length).toBe(0);
    expect(output[6].length).toBe(0);
});

test("mapping multiple genes works with other species", async () => {
    const tconf = utils.createTestConfig();
    var output = await gesel.searchGenes("10090", candidates, tconf);
    expect(output.length).toBe(candidates.length);

    // Case insensitive matches.
    expect(output[0].length).toBeGreaterThanOrEqual(1);
    expect(output[1].length).toBeGreaterThanOrEqual(1);

    // Everything else is bad now.
    expect(output[2].length).toBe(0);
    expect(output[3].length).toBe(0);
    expect(output[4].length).toBe(0);
    expect(output[5].length).toBe(0);
    expect(output[6].length).toBe(0);
});

