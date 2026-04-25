import { newConfig } from "../src/newConfig.js";
import * as fs from "fs";
import * as path from "path";

const databaseUrl = "https://github.com/gesel-inc/feedstock/releases/download/indices-v0.3.0";
const geneUrl = "https://github.com/gesel-inc/feedstock/releases/download/genes-v0.3.0";

async function cachedGet(name, url) {
    const cache = "files";
    if (!fs.existsSync(cache)) {
        fs.mkdirSync(cache);
    }

    let cache_path = path.join(cache, name);
    if (!fs.existsSync(cache_path)) {
        let res = await fetch(url + "/" + name);
        if (!res.ok) {
            throw new Error("failed to fetch '" + name + "' (status " + String(res.status) + ")");
        }
        fs.writeFileSync(cache_path, new Uint8Array(await res.arrayBuffer()));
    }

    let contents = fs.readFileSync(cache_path);
    let buffer = (new Uint8Array(contents)).buffer;
    return buffer; 
}

async function getRanges(name, url, start, end) {
    const full_url = url + "/" + name;
    const everything = [];
    for (var i = 0; i < start.length; i++) {
        const resp = fetch(full_url, { headers: { Range: "bytes=" + String(start[i]) + "-" + String(end[i] - 1) } })
            .then(
                res => {
                    if (!res.ok) {
                        throw new Error("failed to fetch range from '" + name + "' (status " + String(res.status) + ")");
                    }
                    return res.arrayBuffer();
                }
            );
        everything.push(resp);
    }
    return await Promise.all(everything);
}

export function createTestConfig() {
    return newConfig(
        fname => cachedGet(fname, geneUrl),
        fname => cachedGet(fname, databaseUrl),
        (fname, start, end) => getRanges(fname, databaseUrl, start, end)
    );
}

export function sample(n, k) {
    let output = [];
    for (var i = 0; i < n; ++i) {
        const remaining = n - i + 1;
        if (Math.random() < k / remaining) {
            output.push(i);
            --k;
            if (k == 0) {
                break;
            }
        }
    }
    return output;
}
