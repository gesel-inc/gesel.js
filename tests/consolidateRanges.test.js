import { rangesToBlocks, consolidateRanges } from "../src/consolidateRanges.js";
import * as utils from "./utils.js";

test("consolidateRanges works for simple examples", () => {
    const boundaries = [ 0, 10, 30, 100, 200, 210 ];

    expect(consolidateRanges(boundaries, rangesToBlocks(boundaries, 1), [1,2,3])).toEqual({ start: [10], end: [200], requested: [1,2,3] });
    expect(consolidateRanges(boundaries, rangesToBlocks(boundaries, 10), [1,2,3])).toEqual({ start: [10], end: [200], requested: [1,2,3] });
    expect(consolidateRanges(boundaries, rangesToBlocks(boundaries, 100), [1,2,3])).toEqual({ start: [0], end: [200], requested: [0,1,2,3] });
    expect(consolidateRanges(boundaries, rangesToBlocks(boundaries, 1000), [1,2,3])).toEqual({ start: [0], end: [210], requested: [0,1,2,3,4] });

    expect(consolidateRanges(boundaries, rangesToBlocks(boundaries, 1), [0, 2, 4])).toEqual({ start: [0, 30, 200], end: [10, 100, 210], requested: [0, 2, 4] });
    expect(consolidateRanges(boundaries, rangesToBlocks(boundaries, 100), [0, 2, 4])).toEqual({ start: [0, 200], end: [100, 210], requested: [0, 1, 2, 4] });
    expect(consolidateRanges(boundaries, rangesToBlocks(boundaries, 1000), [0, 2, 4])).toEqual({ start: [0], end: [210], requested: [0, 1, 2, 3, 4] });

    expect(consolidateRanges(boundaries, rangesToBlocks(boundaries, 1), [0, 4])).toEqual({ start: [0, 200], end: [10, 210], requested: [0, 4] });
    expect(consolidateRanges(boundaries, rangesToBlocks(boundaries, 100), [0, 4])).toEqual({ start: [0, 200], end: [100, 210], requested: [0, 1, 2, 4] });
    expect(consolidateRanges(boundaries, rangesToBlocks(boundaries, 200), [0, 4])).toEqual({ start: [0], end: [210], requested: [0, 1, 2, 3, 4] });
})

test("consolidateRanges works for a harder example", () => {
    const ntotal = 100
    const bounds = [0];
    const mids = [];
    var last = 0;
    for (var i = 0; i < ntotal; i++) {
        const extra = Math.ceil(Math.random() * 50);
        mids.push(last + extra / 2);
        last += extra;
        bounds.push(last);
    }

    for (const bs of [0, 5, 10, 20, 50, 100]) {
        const blocked = rangesToBlocks(bounds, bs);

        for (var n = 1; n <= 50; n++) {
            const needed = utils.sample(ntotal, n);
            const consolidated = consolidateRanges(bounds, blocked, needed)
            const retrieved = new Set(consolidated.requested);
            for (const ni of needed) {
                expect(retrieved.has(ni)).toBe(true);
            }

            // Check consistency between requested and boundaries.
            const expected = new Uint8Array(bounds[bounds.length - 1]);
            for (const x of consolidated.requested) {
                const rstart = bounds[x];
                const rend = bounds[x + 1];
                expected.fill(1, rstart, rend);
            }

            const observed = new Uint8Array(bounds[bounds.length - 1]);
            for (var i = 0; i < consolidated.start.length; i++) {
                observed.fill(1, consolidated.start[i], consolidated.end[i]);
            }

            expect(observed).toEqual(expected);

            // Check that the same blocks are retrieved.
            const requested_blocks = new Set;
            for (const x of consolidated.requested) {
                requested_blocks.add(Math.floor(mids[x] / bs));
            }

            const needed_blocks = new Set;
            for (const ni of needed) {
                needed_blocks.add(Math.floor(mids[ni] / bs));
            }

            expect(requested_blocks).toEqual(needed_blocks);
        }
    }
})

test("consolidateRanges works for edge cases", () => {
    let boundaries = [0, 10, 20, 30, 40, 50];
    expect(consolidateRanges(boundaries, rangesToBlocks(boundaries, 10), [])).toEqual({ start: [], end: [], requested: [] });

    boundaries = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
    expect(consolidateRanges(boundaries, rangesToBlocks(boundaries, 10), [0, 4, 8])).toEqual({ start: [0], end: [0], requested: [ 0, 1, 2, 3, 4, 5, 6, 7, 8 ] });

    boundaries = [ 0, 0, 0, 0, 0, 5, 5, 5, 5 ];
    expect(consolidateRanges(boundaries, rangesToBlocks(boundaries, 1), [1, 3, 5, 7])).toEqual({ start: [0, 5], end: [0, 5], requested: [ 0, 1, 2, 3, 5, 6, 7 ] });
})
