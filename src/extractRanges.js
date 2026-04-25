// Return the index of the last element that is less than or equal to 'value'.
export function binarySearchLeft(vec, left, right, value) {
    if (value < vec[left]) {
        return -1;
    }

    while (true) {
        const diff = right - left;
        if (diff < 2) {
            break;
        }

        const mid = Math.floor(left + diff / 2);
        const midval = vec[mid];
        if (midval > value) {
            right = mid;
        } else if (midval < value) {
            left = mid;
        } else {
            return mid;
        }
    }

    return left; 
}

export function extractRanges(parts, partsStarts, partsEnds, requestBoundaries, requestIndices, fun, { skipNewline = true } = {}) {
    let last_part = 0;
    let previous_start = -1;

    for (const ii of requestIndices) {
        const req_start = requestBoundaries[ii];
        if (req_start < previous_start) {
            throw new Error("expected 'requestStarts' to be sorted");
        }
        const req_end = requestBoundaries[ii + 1] - Number(skipNewline);
        previous_start = req_start;

        last_part = binarySearchLeft(partsStarts, last_part, partsStarts.length, req_start);
        if (last_part < 0 || req_end > partsEnds[last_part]) {
            throw new Error("multipart response does not contain the requested byte ranges")
        }

        const offset = partsStarts[last_part];
        fun(ii, parts[last_part].slice(req_start - offset, req_end - offset));
    }
}
