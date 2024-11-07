# Contributing to gesel

## Getting Started

Contributions are made to this repository via [Issues](https://github.com/gesel-inc/gesel.js/issues) and [Pull Requests (PRs)](https://github.com/gesel-inc/gesel.js/pulls). 
Consider searching for existing Issues and PRs before creating your own.

## Setting up

**gesel** development is done with Node.js 16 or higher.
Assuming that an appropriate Node.js version is available, developers can clone this repository and install **gesel**'s dependencies:

```sh
git clone https://github.com/gesel-inc/gesel.js
cd gesel.js
npm install
```

And then run the unit tests in `tests/`:

```sh
npm run test
```

Or build the documentation into `docs/built`:

```sh
npm run jsdoc
```

## Issues

[Issues](https://github.com/kanaverse/kana/issues) should be used to report problems with the application or any of its dependencies, request a new feature, 
or to discuss potential changes before a PR is created. 

When reporting bugs, provide a [minimum reproducible example](https://stackoverflow.com/help/minimal-reproducible-example), 
the version of **gesel.js**, and the environment (e.g., Node.js, browser versions).

If you find an Issue that addresses the problem you're having, please add your own reproducible example to the existing issue rather than creating a new one. 

## Pull Requests

[PRs](https://github.com/kanaverse/kana/pulls) are always welcome and can be a quick way to get your fix or improvement merged. 
In general, PRs should:

- Only fix/add the functionality in question OR address widespread whitespace/style issues, not both.
- Address a single concern in the least number of changed lines as possible.
- Include documentation in the repo either in the README or through the wiki page.
  
For changes that address core functionality or would require breaking changes (e.g. a major release), it's best to open an Issue to discuss your proposal first. 
This is not required but can save time creating and reviewing changes.

In general, we follow the ["fork-and-pull" Git workflow](https://gist.github.com/Chaser324/ce0505fbed06b947d962)

- [Fork](https://github.com/kanaverse/kana/fork) the repository to your own Github account
- Clone the project to your machine
- Create a branch locally with a succinct but descriptive name
- Commit changes to the branch
- Following any formatting and testing guidelines specific to this repo
- Push changes to your fork
- Open a PR in our repository and follow the PR template so that we can efficiently review the changes
