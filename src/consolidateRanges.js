export function rangesToBlocks(boundaries, block_size) {
    const nranges = boundaries.length - 1;
    const raw_block_ids = [];
    for (var r = 0; r < nranges; r++) {
        const start = boundaries[r];
        const mid = start + (boundaries[r + 1] - start) * 0.5; // use midpoints to place blocks.
        raw_block_ids.push(Math.floor(mid / block_size));
    }

    const unique_block_ids = Array.from(new Set(raw_block_ids));
    unique_block_ids.sort((a, b) => a - b);
    const block_mapping = new Map;
    const by_id = [];
    for (var u = 0; u < unique_block_ids.length; u++) {
        block_mapping.set(unique_block_ids[u], u);
        by_id.push([]);
    }

    const block_ids = [];
    for (var r = 0; r < nranges; r++) {
        const b = raw_block_ids[r];
        const remapped = block_mapping.get(b); 
        block_ids.push(remapped);
        by_id[remapped].push(r);
    }

    const block_boundaries = [];
    for (var u = 0; u < unique_block_ids.length; u++) {
        block_boundaries.push(boundaries[by_id[u][0]]);
    }
    block_boundaries.push(boundaries[boundaries.length - 1]);

    return {
        bounds: block_boundaries,
        to_block: block_ids,
        to_range: by_id
    }
}

export function consolidateRanges(boundaries, blocked, needed) {
    let requested_blocks = [];
    for (const x of needed) {
        requested_blocks.push(blocked.to_block[x]);
    }

    requested_blocks = Array.from(new Set(requested_blocks));
    requested_blocks.sort((a, b) => a - b);
    if (requested_blocks.length == 0) {
        return {
            start: [],
            end: [],
            requested: []
        };
    }

    const run_start = [blocked.bounds[requested_blocks[0]]];
    const run_end = [];
    for (var i = 1; i < requested_blocks.length; i++) {
        const current = requested_blocks[i];
        const previous = requested_blocks[i - 1];
        if (current > previous + 1) {
            run_end.push(blocked.bounds[previous + 1]);
            run_start.push(blocked.bounds[current]);
        }
    }
    run_end.push(blocked.bounds[requested_blocks[requested_blocks.length - 1] + 1]);

    const all_requested = [];
    for (const rb of requested_blocks) {
        const available = blocked.to_range[rb];
        for (const a of available) {
            all_requested.push(a);
        }
    }

    return {
        start: run_start,
        end: run_end,
        requested: all_requested
    };
}
