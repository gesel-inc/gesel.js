import * as utils from "./utils.js";
import * as gesel from "../src/index.js";

test("fetchAllGenes works as expected", async () => {
    const tconf = utils.createTestConfig();
    let info = await gesel.fetchAllGenes("10090", tconf);

    let ens = info.get("ensembl");
    expect(ens.length).toBeGreaterThan(30000);
    let ent = info.get("entrez");
    expect(ent.length).toEqual(ens.length);
    let sym = info.get("symbol");
    expect(sym.length).toEqual(ens.length);

    let okay_ens = 0;
    let okay_ent = 0;
    let okay_sym = 0;
    let count_ens = 0;
    let count_ent = 0;
    let count_sym = 0;

    for (var i = 0; i < ens.length; i++) {
        okay_ens += ens[i].length >= 0 && ens[i].every(x => x.match(/^ENSMUSG/) || x.match(/^LRG/));
        okay_ent += ent[i].length >= 0 && ent[i].every(x => x.match(/^[0-9]+$/))
        okay_sym += sym[i].length >= 0;
        count_ens += ens[i].length;
        count_ent += ent[i].length;
        count_sym += sym[i].length;
    }

    expect(okay_ens).toEqual(ens.length);
    expect(okay_ent).toEqual(ent.length);
    expect(okay_sym).toEqual(sym.length);

    expect(count_ens).toBeGreaterThan(30000);
    expect(count_ent).toBeGreaterThan(30000);
    expect(count_sym).toBeGreaterThan(30000);

    // Works with reloading from the cache.
    let reloaded = await gesel.fetchAllGenes("10090", tconf);
    expect(info).toEqual(reloaded);
})

test("fetchAllGenes works as expected with a subset of types", async () => {
    const tconf = utils.createTestConfig();
    let info = await gesel.fetchAllGenes("9606", tconf, { types: [ "symbol" ] });
    let sym = info.get("symbol");
    expect(sym.length).toBeGreaterThan(0);
    expect(info.has("entrez")).toBe(false);
    expect(info.has("ensembl")).toBe(false);
})
