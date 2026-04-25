/**
 * Create a new configuration object to specify how the Gesel database should be queried.
 * This can be used in each **gesel** function to point to a different Gesel database from the default.
 *
 * The configuration object also contains a cache of data structures that can be populated by **gesel** functions.
 * This avoids unnecessary fetch requests upon repeated calls to the same function.
 * If the cache becomes stale or too large, it can be cleared by calling {@linkcode flushMemoryCache}.
 *
 * @param {function} fetchGene - Function that accepts the name of a Gesel gene description file and returns an ArrayBuffer of its contents.
 * This may be async.
 * @param {function} fetchFile - Function that accepts the name of a Gesel database file and returns an ArrayBuffer of its contents.
 * This may be async.
 * @param {function} fetchRanges - Function that accepts three arguments:
 *
 * - `name`, the name of the file in the Gesel database.
 * - `start`, an array of integers containing the 0-based closed starts of the byte ranges.
 * - `end`, an array of integers containing the 0-based open ends of the byte ranges.
 *   This is of the same length as `start`, such that the `i`-th range is defined as `[start[i], end[i])`.
 *   
 * It should return an array of ArrayBuffers of the same length as `start`, where each entry has the contents of the corresponding byte range.
 * This may be async.
 * @param {object} [options={}] - Optional parameters.
 * @param {number} [options.consolidateBlockSize=10000] - Block size for consolidation, in bytes.
 * **gesel** functions will consolidate near-adjacent ranges into larger blocks to reduce the number of requests.
 * Larger block sizes will reduce the number of requests at the cost of larger requests. 
 *
 * @return {object} A configuration object.
 */
export function newConfig(fetchGene, fetchFile, fetchRanges, { consolidateBlockSize = 10000 } = {}) {
    return {
        cache: {},
        fetchGene,
        fetchFile,
        fetchRanges,
        consolidateBlockSize
    }
}
