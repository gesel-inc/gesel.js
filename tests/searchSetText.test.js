import * as gesel from "../src/index.js";
import * as search from "../src/searchSetText.js";
import * as utils from "./utils.js";

test("binary search works as expected", async () => {
    let ref = [ "A", "B", "C", "D", "E" ];
    expect(search.binarySearchRight("A", ref)).toEqual(0);
    expect(search.binarySearchRight("0", ref)).toEqual(0);
    expect(search.binarySearchRight("AB", ref)).toEqual(1);
    expect(search.binarySearchRight("C", ref)).toEqual(2);
    expect(search.binarySearchRight("CD", ref)).toEqual(3);
    expect(search.binarySearchRight("E", ref)).toEqual(4);
    expect(search.binarySearchRight("E0", ref)).toEqual(5);
    expect(search.binarySearchRight("F", ref)).toEqual(5);
})

test("searching by text works as expected", async () => {
    const tconf = utils.createTestConfig();
    const set_info = await gesel.fetchAllSets("10090", tconf);

    {
        const cout = await gesel.searchSetText("10090", "cancer", tconf)
        expect(cout.length).toBeGreaterThan(0);
        for (const x of cout) {
            const current = set_info[x];
            const matches = current.name.match(/cancer/i) || current.description.match(/cancer/i); 
            expect(Boolean(matches)).toEqual(true);
        }
    } 

    // Multiple words with a prefixed wildcard.
    {
        const iout = await gesel.searchSetText("10090", "innate immun*", tconf);
        expect(iout.length).toBeGreaterThan(0);
        for (const x of iout) {
            const current = set_info[x];
            const matches_innate = current.name.match(/innate/i) || current.description.match(/innate/i); 
            const matches_immune = current.name.match(/immun.*/i) || current.description.match(/immun.*/i); 
            expect(Boolean(matches_innate && matches_immune)).toEqual(true);
        }

        const aout = await gesel.searchSetText("10090", "adaptive immun*", tconf)
        expect(aout.length).toBeGreaterThan(0);
        for (const x of aout) {
            const current = set_info[x];
            const matches_adaptive = current.name.match(/adaptive/i) || current.description.match(/adaptive/i); 
            const matches_immune = current.name.match(/immun.*/i) || current.description.match(/immun.*/i); 
            expect(Boolean(matches_adaptive && matches_immune)).toEqual(true);
        }
    }

    // Trying with only the name or description (also tests the cache).
    {
        const iout_noname = await gesel.searchSetText("10090", "immun*", tconf, { inName: false });
        expect(iout_noname.length).toBeGreaterThan(0);
        for (const x of iout_noname) {
            const current = set_info[x];
            const matches = current.description.match(/immun.*/i);
            expect(Boolean(matches)).toBe(true);
        }

        const iout_nodesc = await gesel.searchSetText("10090", "immun*", tconf, { inDescription: false });
        expect(iout_nodesc.length).toBeGreaterThan(0);
        for (const x of iout_nodesc) {
            const current = set_info[x];
            const matches = current.name.match(/immun.*/i);
            expect(Boolean(matches)).toBe(true);
        }

        const iout_none = await gesel.searchSetText("10090", "immun*", tconf, { inDescription: false, inName: false });
        expect(iout_none.length).toEqual(0);
    }

    // Non-prefixed wildcard.
    {
        const nout = await gesel.searchSetText("10090", "*nucleic*", tconf);
        expect(nout.length).toBeGreaterThan(0);
        for (const x of nout) {
            const current = set_info[x];
            const matches = current.name.match(/.*nucleic.*/i) || current.description.match(/.*nucleic.*/i); 
            expect(Boolean(matches)).toEqual(true);
        }
    }

    // Trying a rare question mark.
    {
        const pout = await gesel.searchSetText("10090", "?ancreas", tconf);
        expect(pout.length).toBeGreaterThan(0);
        for (const x of pout) {
            const current = set_info[x];
            const matches = current.name.match(/.ancreas/i) || current.description.match(/.ancreas/i); 
            expect(Boolean(matches)).toEqual(true);
        }
    }
})
