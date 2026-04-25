import { binarySearchLeft, extractRanges } from "../src/extractRanges.js";

test("binarySearchLeft works correctly", () => {
    const vec = [0, 0.5, 1, 2, 3, 5];

    // Works using the full range.
    expect(binarySearchLeft(vec, 0, 6, -1)).toEqual(-1);
    expect(binarySearchLeft(vec, 0, 6, 0)).toEqual(0);
    expect(binarySearchLeft(vec, 0, 6, 0.1)).toEqual(0);
    expect(binarySearchLeft(vec, 0, 6, 0.5)).toEqual(1);
    expect(binarySearchLeft(vec, 0, 6, 1)).toEqual(2);
    expect(binarySearchLeft(vec, 0, 6, 1.5)).toEqual(2);
    expect(binarySearchLeft(vec, 0, 6, 2)).toEqual(3);
    expect(binarySearchLeft(vec, 0, 6, 2.7)).toEqual(3);
    expect(binarySearchLeft(vec, 0, 6, 3)).toEqual(4);
    expect(binarySearchLeft(vec, 0, 6, 3.4)).toEqual(4);
    expect(binarySearchLeft(vec, 0, 6, 5)).toEqual(5);
    expect(binarySearchLeft(vec, 0, 6, 100)).toEqual(5);

    // Works with a truncation.
    expect(binarySearchLeft(vec, 1, 6, 0)).toEqual(-1);
    expect(binarySearchLeft(vec, 1, 6, 0.49)).toEqual(-1);
    expect(binarySearchLeft(vec, 1, 6, 0.6)).toEqual(1);
    expect(binarySearchLeft(vec, 1, 6, 1)).toEqual(2);
    expect(binarySearchLeft(vec, 1, 6, 1.2)).toEqual(2);
    expect(binarySearchLeft(vec, 1, 6, 5)).toEqual(5);
    expect(binarySearchLeft(vec, 1, 5, 100)).toEqual(4);
})

test("extractRanges works correctly", () => {
    const payload = [[0, 1, 2, 3, 4, 5], [6, 7, 8, 9], [10, 11, 12, 13, 14, 15], [16]];
    const pstarts = [100, 200, 300, 400]; 
    const pends = pstarts.map((x, i) => x + payload[i].length);

    const req_bounds = [ 0, 100, 103, 104, 106, 190, 200, 201, 204, 300, 305, 306, 400, 401, 401 ];
    const needed = [ 1, 3, 6, 7, 9, 10, 13 ];

    // Without skipping the newline:
    {
        const collected = [];
        extractRanges(payload, pstarts, pends, req_bounds, needed, (ii, ex) => { collected.push([ii, ex]); }, { skipNewline: false });

        expect(collected[0]).toEqual([1, [0, 1, 2]]);
        expect(collected[1]).toEqual([3, [4, 5]]);
        expect(collected[2]).toEqual([6, [6]]);
        expect(collected[3]).toEqual([7, [7, 8, 9]]);
        expect(collected[4]).toEqual([9, [10, 11, 12, 13, 14]]);
        expect(collected[5]).toEqual([10, [15]]);
        expect(collected[6]).toEqual([13, []]);
    }

    // With a newline skip.
    {
        const collected = [];
        extractRanges(payload, pstarts, pends, req_bounds, needed, (ii, ex) => { collected.push([ii, ex]); });

        expect(collected[0]).toEqual([1, [0, 1]]);
        expect(collected[1]).toEqual([3, [4]]);
        expect(collected[2]).toEqual([6, []]);
        expect(collected[3]).toEqual([7, [7, 8]]);
        expect(collected[4]).toEqual([9, [10, 11, 12, 13]]);
        expect(collected[5]).toEqual([10, []]);
        expect(collected[6]).toEqual([13, []]);
    }

    // Check errors.
    expect(() => extractRanges(payload, pstarts, pends, req_bounds, [1, 0, 2], (ii, ex) => {})).toThrow("sorted");
    expect(() => extractRanges(payload, pstarts, pends, [0, 90, 100], [1], (ii, ex) => {})).toThrow("does not contain");
    expect(() => extractRanges(payload, pstarts, pends, [0, 90, 101, 120], [2], (ii, ex) => {})).toThrow("does not contain");
    expect(() => extractRanges(payload, pstarts, pends, [0, 701, 800], [1], (ii, ex) => {})).toThrow("does not contain");
})
