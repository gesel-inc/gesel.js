# Client-side gene set enrichment

## Overview

Search for interesting gene sets, client-side.
This uses Javascript to do the queries in the browser, improving latency and avoiding the need for a back-end service.
Users can test for enrichment in their own list of genes and/or search by text in the set names or descriptions.
The queries rely on prebuilt databases containing gene sets of interest - see [here](https://github.com/gesel-inc/gesel-spec) for the expectations around the database files.

## Installation

[**gesel**](https://www.npmjs.com/package/gesel) can be installed with the usual commands:

```sh
npm i gesel
```

**gesel** is implemented as an ES6 module, so importing is as simple as:

```js
import * as gesel from "gesel";
```

See the [API documentation](https://gesel-inc.github.io/gesel.js) for all functions.

## Configuring downloaders

First, we set up a configuration object that describes how to fetch content from the Gesel database.
The example below just uses `fetch()` to download files (or parts thereof) from the [feedstock repository](https://github.com/gesel-inc/feedstock).
Applications can customize this configuration with caching, authentication, etc.

```js
const databaseUrl = "https://github.com/gesel-inc/feedstock/releases/download/indices-v0.3.0";
const geneUrl = "https://github.com/gesel-inc/feedstock/releases/download/genes-v0.3.0";

async function getFile(name, url) {
    let res = await fetch(url + "/" + name);
    if (!res.ok) {
        throw new Error("failed to fetch '" + name + "' (status " + String(res.status) + ")");
    }
    return res.arrayBuffer();
}

async function getRanges(name, url, start, end) {
    // GitHub doesn't support multi-range requests, but if it did, we could use that instead.
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

const config = gesel.newConfig(
    /* getGene = */ fname => getFile(fname, geneUrl),
    /* getFile = */ fname => getFile(fname, databaseUrl),
    /* getRanges = */ (fname, start, end) => getRanges(fname, databaseUrl, start, end)
);
```

## Searching by gene

Now we consider the question: given a user-supplied set of genes, what are the overlapping gene sets in our references?
We map the user-supplied gene symbols/identifiers to **gesel**'s internal identifiers:

```js
let user_supplied = [ "SNAP25", "NEUROD6", "ENSG00000123307", "TSPAN6" ];

// Seeing if the user-supplied symbols/IDs are found in the human reference. */
let user_supplied_ids = await gesel.searchGenes("9606", user_supplied, config);

// Taking the first matching ID for each user-supplied gene name. Applications
// may prefer to print warnings/errors if there are multiple matches.
let user_supplied_union = [];
for (const x of user_supplied_ids) {
    if (x.length >= 1) {
        user_supplied_union.push(x[0]);
    }
}
```

Then, we can search for the overlapping sets.
This returns an array of objects with the set IDs, the number of overlapping genes, the size of each set and the enrichment p-value based on the hypergeometric distribution: 

```js
let overlaps = await gesel.findOverlappingSets("9606", user_supplied_union, config);
console.log(overlaps);
```

```
[
  { id: 61, count: 1, size: 66, pvalue: 0.006055375713038935 },
  { id: 353, count: 1, size: 11, pvalue: 0.001011145568580063 },
  { id: 612, count: 1, size: 68, pvalue: 0.0062384416641664275 },
  { id: 2210, count: 1, size: 63, pvalue: 0.0057807294963071465 },
  { id: 2295, count: 1, size: 37, pvalue: 0.003398077466451266 }
]
```

Once we have a set ID, we can query the references to obtain that set's details.
For example, we can examine the details of the first 5 sets:

```js
console.log(await gesel.fetchSomeSets("9606", overlaps.slice(0, 5).map(x => x.id), config));
```

```
[
  {
    name: 'GO:0000149',
    description: 'SNARE binding',
    size: 66,
    collection: 0,
    number: 61
  },
  {
    name: 'GO:0001504',
    description: 'neurotransmitter uptake',
    size: 11,
    collection: 0,
    number: 353
  },
  {
    name: 'GO:0001917',
    description: 'photoreceptor inner segment',
    size: 68,
    collection: 0,
    number: 612
  },
  {
    name: 'GO:0005249',
    description: 'voltage-gated potassium channel activity',
    size: 63,
    collection: 0,
    number: 2210
  },
  {
    name: 'GO:0005484',
    description: 'SNAP receptor activity',
    size: 37,
    collection: 0,
    number: 2295
  }
]
```

## Searching by text

Each set also has some associated free text in its name and description.
We can do some simple queries on this text:

```js
let hits = await gesel.searchSetText("9606", "B immune", config);
console.log(await gesel.fetchSomeSets("9606", hits.slice(0, 5), config));
```

```
[
  {
    name: 'GO:0002312',
    description: 'B cell activation involved in immune response',
    size: 17,
    collection: 0,
    number: 843
  },
  {
    name: 'GO:0002313',
    description: 'mature B cell differentiation involved in immune response',
    size: 4,
    collection: 0,
    number: 844
  },
  {
    name: 'GO:0002322',
    description: 'B cell proliferation involved in immune response',
    size: 6,
    collection: 0,
    number: 852
  },
  {
    name: 'GO:0090717',
    description: 'adaptive immune memory response involving T cells and B cells',
    size: 3,
    collection: 0,
    number: 14499
  },
  {
    name: 'GO:0090721',
    description: 'primary adaptive immune response involving T cells and B cells',
    size: 1,
    collection: 0,
    number: 14501
  }
]
```

`*` and `?` wildcards are also supported:

```js
let hits2 = await gesel.searchSetText("9606", "B immun*", config);
console.log(await gesel.fetchSomeSets("9606", hits2.slice(0, 5), config));
```

```
[
  {
    name: 'GO:0002312',
    description: 'B cell activation involved in immune response',
    size: 17,
    collection: 0,
    number: 843
  },
  {
    name: 'GO:0002313',
    description: 'mature B cell differentiation involved in immune response',
    size: 4,
    collection: 0,
    number: 844
  },
  {
    name: 'GO:0002322',
    description: 'B cell proliferation involved in immune response',
    size: 6,
    collection: 0,
    number: 852
  },
  {
    name: 'GO:0019724',
    description: 'B cell mediated immunity',
    size: 6,
    collection: 0,
    number: 5637
  },
  {
    name: 'GO:0090717',
    description: 'adaptive immune memory response involving T cells and B cells',
    size: 3,
    collection: 0,
    number: 14499
  }
]
```

This can be combined with the output of `findOverlappingSets` to find all gene sets that overlap the user-supplied set _and_ contain the desired keywords.

```js
let combined = gesel.intersect([ hits, overlaps.map(x => x.id) ]);
``` 

## Implementation details

By default, **gesel** uses HTTP range requests to efficiently extract slices of data from the databases.
This allows us to obtain the identities of genes belonging to a particular gene set,
or the identities of the sets containing a particular gene,
or the details of a particular gene set or collection,
without downloading the entirety of the associated refences files.
Only the range indices need to be transferred to the client - as of time of writing, this amounts to an acceptably small payload (< 2 MB).

That said, some applications may prefer to download the entire database up-front rather than performing range requests for each query.
This may be more performant for batch processing where repeated range requests would unnecessarily increase network activity.
In those cases, we provide functions like `fetchGenesForAllSets()` to trigger a full download of the relevant file(s) on first use.
Subsequent calls to related functions like `fetchGenesForSomeSets()` will then re-use this data and skip range requests.
This approach transfers more data to the client but is still practical - 
the default human gene set database (containing the Gene Ontology and almost all MSigDB gene sets) is less than 9 MB in size, which is a tolerable payload.

**gesel** will automatically cache responses in memory to reduce network traffic across the lifetime of a single session.
Note that no caching is done across sessions, though users can add their own (e.g., with IndexedDB or the Cache API) by overriding the downloader.
