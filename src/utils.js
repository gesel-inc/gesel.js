export async function decompressLines(buffer) {
    const gunzip = new DecompressionStream("gzip");
    const gzstr = new Blob([buffer]).stream().pipeThrough(gunzip);
    const contents = await new Response(gzstr).arrayBuffer();

    const txt = new TextDecoder();
    var lines = txt.decode(contents).split("\n");

    if (lines[lines.length - 1] != "") {
        throw new Error("expected a terminating newline at the end of each file");
    }
    lines.pop();

    return lines;
}

export async function retrieveRanges(config, resource) {
    var buffer = await config.fetchFile(resource + ".ranges.gz");
    var lengths = await decompressLines(buffer);
    var ranges = [0];
    for (var i = 0; i < lengths.length; i++) { 
        ranges.push(ranges[i] + Number(lengths[i]) + 1);
    }
    return ranges;
}

export async function retrieveNamedRanges(config, resource) {
    var buffer = await config.fetchFile(resource + ".ranges.gz");
    var lines = await decompressLines(buffer);

    var last = 0;
    var ranges = [0];
    var order = [];
    for (var i = 0; i < lines.length; i++) { 
        let split = lines[i].split("\t");
        let next = last + Number(split[1]) + 1; // +1 for the newline.
        ranges.push(next);
        order.push(split[0]);
        last = next;
    }

    return { ranges, order };
}

export async function retrieveRangesWithExtras(config, resource) {
    var buffer = await config.fetchFile(resource + ".ranges.gz");
    var lines = await decompressLines(buffer);

    var ranges = [0];
    var extra = [];
    for (var i = 0; i < lines.length; i++) {
        let split = lines[i].split("\t");
        ranges.push(ranges[i] + Number(split[0]) + 1); // +1 for the newline.
        extra.push(Number(split[1]));
    }

    return { ranges, extra };
}

export function decodeIndices(txt) {
    var output = [];

    if (txt !== "") {
        var last = 0;
        txt.split("\t").forEach(x => {
            var y = Number(x) + last;
            output.push(y);
            last = y;
        });
    }

    return new Uint32Array(output);
}

export function decodeIndicesFromBuffer(buffer) {
    const dec = new TextDecoder;
    return decodeIndices(dec.decode(buffer));
}

/**
 * @param {Array} arrays - Array of arrays over which to compute the intersection.
 * @return {Array} Intersection of all arrays in `arrays`.
 */
export function intersect(arrays) {
    if (arrays.length == 0) {
        return [];
    } else if (arrays.length == 1) {
        return arrays[0];
    }

    let ref = new Set(arrays[0]);
    for (var i = 1; i < arrays.length; i++) {
        let running = new Set;
        for (const x of arrays[i]) {
            if (ref.has(x)) {
                running.add(x);
            }
        }
        ref = running;
    }

    return Array.from(ref);
}

export function setdiff(x, y) {
    if (!(y instanceof Map)) {
        throw new Error("expected 'y' to be a Map");
    }

    let collected = [];
    for (const val of x) {
        if (!y.has(val)) {
            collected.push(val);
        }
    }

    return collected;
}
