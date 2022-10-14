# typisch

A collection of Typescript, React, Electron, etc. utility code and types.

> The name _typisch_ is Dutch for _typical_

## Packages

The code in this repository is split into several packages, each with their own dependencies.

### core

General purpose utilities that can be used in Node.js, in the browser an in basically any other Javascript environment.

### node

Utilities for working with [Node.js](https://nodejs.org).

### react

Tools for [React](https://reactjs.org).

### electron

Helper code for developing [Electron](https://www.electronjs.org) apps.

### eui

For use with [the Elastic UI framework](https://elastic.github.io/eui).

### earthapp

> Currently out of order, needs to have new build structure applied

Reusable code for developing applications using Electron, React, EUI and [SQLite3](https://github.com/WiseLibs/better-sqlite3).  
Consists of 3 subpackages common, main and renderer, for use in the respective Electron processes.

### rollup

Configuration helpers for [Rollup](https://rollupjs.org).

## Runtime dependencies

There is currently only a single `package.json` for the entire repo, so only a single dependency list for all packages.
The following table specifies which of those dependencies are required at runtime by each package.

| Dependency        | core | node | react | electron | eui | earthapp | rollup |
|-------------------|------|------|-------|----------|-----|----------|--------|
| react             |      |      | X     |          | X   | X        |        |
| react-dom         |      |      | X     |          | X   | X        |        |
| async             | X    | X    | X     | X        | X   | X        |        |
| @elastic/eui      |      |      |       |          | X   | X        |        |
| @elastic/datemath |      |      |       |          | X   | X        |        |

