export var default_download = (base, file, start, end) => {
    let url = base + "/" + file;
    if (start == null || end == null) {
        return fetch(url);
    } else {
        return fetch(url, { headers: { Range: "bytes=" + String(start) + "-" + String(end) } }); 
    }
}

var reference_base_url = "https://github.com/LTLA/gesel-feedstock/releases/download/indices-v0.2.2";

/**
 * Get or set the base URL for the pre-built references.
 * By default, it uses the `indices-*` release files from [the feedstock repository](https://github.com/LTLA/gesel-feedstock).
 * Setters should call this function before calling any **gesel** functions that might fetch resources.
 *
 * @param {string} [url] - Base URL to use for the prebuilt references.
 *
 * @return {string} If `url` is not supplied, the current base URL is returned.
 *
 * If `url` is supplied, it is set as the base URL, and the previous base URL is returned.
 */
export function referenceBaseUrl(url) {
    if (typeof url == "undefined") {
        return reference_base_url;
    } else {
        let old = reference_base_url;
        reference_base_url == url;
        return old;
    }
}

export var reference_download = (file, start = null, end = null) => default_download(reference_base_url, file, start, end);

/**
 * Get or set the global download function to fetch pre-built references.
 * By default, it uses the global `fetch` in browsers and later versions of Node.js.
 * Applications may specify a different function, e.g., to handle authentication or caching; 
 * this should be done before calling any other **gesel** functions that might fetch resources.
 *
 * @param {function} [fun] - Function that performs a GET request to an index file, returning a Response object containing the file contents.
 * This accepts three arguments:
 *
 * - The base name of the pre-built index file of interest (e.g., `"10090_collections.tsv.gz"`).
 * - The starting byte of the request.
 * - The ending byte of the request.
 *
 * If all three arguments are specified, the function should perform a HTTP range request to obtain the specified range of bytes.
 * If only the first argument is supplied, the function should download the entire file.
 *
 * @return {function} If `fun` is not supplied, the current global downloader is returned.
 *
 * If `fun` is supplied, it is used to set the global downloader, and the previous global value of the function is returned.
 */
export function referenceDownload(fun) {
    let prev = reference_download;
    if (typeof fun !== "undefined") {
        reference_download = fun;
    }
    return prev;
}

// For back-compatibility.
export function setReferenceDownload(fun) {
    return referenceDownload(fun);
}

var gene_base_url = "https://github.com/LTLA/gesel-feedstock/releases/download/genes-v1.0.0";

/**
 * Get or set the base URL for the gene information.
 * By default, it uses the `genes-*` release files from [the feedstock repository](https://github.com/LTLA/gesel-feedstock).
 * Setters should call this function before calling any other **gesel** functions that might fetch resources.
 *
 * @param {string} [url] - Base URL to use for the gene informatin.
 *
 * @return {string} If `url` is not supplied, the current base URL is returned.
 *
 * If `url` is supplied, it is set as the base URL, and the previous base URL is returned.
 */
export function geneBaseUrl(url) {
    if (typeof url == "undefined") {
        return gene_base_url;
    } else {
        let old = gene_base_url;
        gene_base_url == url;
        return old;
    }
}

export var gene_download = (file) => default_download(gene_base_url, file, null, null);

/**
 * Set the global download function to fetch gene information.
 * By default, it uses the global `fetch` in browsers and later versions of Node.js.
 * Applications may specify a different function, e.g., to handle authentication or caching; 
 * this should be done before calling any other **gesel** functions that might fetch resources.
 *
 * @param {function} [fun] - Function that performs a GET request to an index file, returning a Response object containing the file contents.
 * This should accept the base name of the pre-built index file of interest (e.g., `"9606_symbol.tsv.gz"`).
 *
 * @return {function} If `fun` is not supplied, the current global downloader is returned.
 *
 * If `fun` is supplied, it is used to set the global downloader, and the previous global value of the function is returned.
 */
export function geneDownload(fun) {
    let prev = gene_download;
    if (typeof fun !== "undefined") {
        gene_download = fun;
    }
    return prev;
}

// For back-compatibility.
export function setGeneDownload(fun) {
    return geneDownload(fun);
}

export async function decompressLines(buffer) {
    const gunzip = new DecompressionStream("gzip");
    const gzstr = new Blob([buffer]).stream().pipeThrough(gunzip);
    const contents = await new Response(gzstr).arrayBuffer();

    const txt = new TextDecoder();
    var lines = txt.decode(contents).split("\n");
    if (lines[lines.length - 1] == "") {
        return lines.slice(0, lines.length - 1); // remove empty string at trailing newline.
    } else {
        return lines;
    }
}

export async function retrieveRanges(resource) {
    var res = await reference_download(resource + ".ranges.gz");
    if (!res.ok) {
        throw "failed to fetch ranges for '" + resource + "'";
    }

    var buffer = await res.arrayBuffer();
    var lengths = await decompressLines(buffer);

    var ranges = [0];
    for (var i = 0; i < lengths.length; i++) { 
        ranges.push(ranges[i] + Number(lengths[i]) + 1);
    }
    return ranges;
}

export async function retrieveNamedRanges(resource) {
    var res = await reference_download(resource + ".ranges.gz");
    if (!res.ok) {
        throw "failed to fetch ranges for '" + resource + "'";
    }

    var buffer = await res.arrayBuffer();
    var lines = await decompressLines(buffer);

    var last = 0;
    var ranges = new Map; 
    var order = [];
    for (var i = 0; i < lines.length; i++) { 
        let split = lines[i].split("\t");
        let next = last + Number(split[1]) + 1; // +1 for the newline.
        ranges.set(split[0], [last, next]);
        order.push(split[0]);
        last = next;
    }

    return { ranges, order };
}

export async function retrieveRangesWithExtras(resource) {
    var res = await reference_download(resource + ".ranges.gz");
    if (!res.ok) {
        throw "failed to fetch ranges for '" + resource + "'";
    }

    var buffer = await res.arrayBuffer();
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

export function retrieveBytesByIndex(resource, ranges, index) {
    var start = ranges[index];
    var end = ranges[index + 1];
    return retrieveBytes(resource, start, end);
}

export async function retrieveBytes(resource, start, end) {
    end--; // ignore the newline.

    var res = await reference_download(resource, start, end);
    if (!res.ok) {
        throw "failed to fetch ranges for '" + resource + "'";
    }

    var txt = await res.text();
    return txt.slice(0, end - start); // make sure we limit it to the requested length.
}

export function convertToUint32Array(txt) { // Building back the indices from the diffs.
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

async function fetch_sizes_internal(species, _sizes, full, initialize, funSizes, funFound) {
    let sizes = _sizes.get(species);
    if (typeof sizes == "undefined") {
        let found = await full(species, { download: false });

        if (found !== null) {
            // Pulling it from the full info instead, if we already got it.
            return funFound(found);
        }

        await initialize(species);
        sizes = _sizes.get(species);
    }

    return funSizes(sizes);
}

export function fetchSizes(species, _sizes, full, initialize) {
    return fetch_sizes_internal(
        species, 
        _sizes, 
        full, 
        initialize, 
        x => x, 
        y => {
            let tmp_sizes = [];
            for (const x of y) {
                tmp_sizes.push(x.size);
            }
            _sizes.set(species, tmp_sizes);
            return tmp_sizes;
        }
    );
}

export function fetchNumber(species, _sizes, full, initialize) {
    return fetch_sizes_internal(
        species,
        _sizes,
        full,
        initialize,
        x => x.length,
        x => x.length
    );
}
