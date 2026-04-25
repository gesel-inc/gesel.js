import { setdiff } from "../src/utils.js";

test("setdiff works as expected", () => {
    let existing = new Map;
    existing.set(2, 0);
    existing.set(3, 1);
    existing.set(4, 2);
    existing.set(5, 3);

    const out = setdiff([1, 3, 5, 7], existing);
    expect(out).toEqual([1, 7]);
});
