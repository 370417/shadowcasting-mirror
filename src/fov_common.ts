// Each interactive example has a different scan function for different levels
// of logging, but they all share the same details in terms of algorithm. The
// copied parts are put here so that they don't get duplicated in the minified js.

export type Slope = {
    num: number;
    den: number;
}

export type Row = {
    start: Slope;
    end: Slope;
    depth: number;
}

export function isSymmetric(row: Row, col: number): boolean {
    return col * row.start.den >= row.depth * row.start.num
        && col * row.end.den <= row.depth * row.end.num;
}

export function minCol(row: Row): number {
    return Math.floor(0.5 + row.depth * row.start.num / row.start.den);
}

export function maxCol(row: Row): number {
    return Math.ceil(-0.5 + row.depth * row.end.num / row.end.den);
}

export function slope(row: Row, col: number): Slope {
    return {
        num: 2 * col - 1,
        den: 2 * row.depth,
    };
}

// Functions for generating wall edges

type Edge = 'N' | 'S' | 'E' | 'W';
type Pos = {
    row: number;
    col: number;
    edge: Edge;
};
type Tile = {
    row: number;
    col: number;
};

export function traceAllWalls(
    forEachWEdge: (fun: (row: number, col: number) => void) => void,
    isWall: (row: number, col: number) => boolean,
): string {
    const paths: string[] = [];
    const visited: Set<string> = new Set();
    forEachWEdge((row, col) => {
        const pos: Pos = { row, col, edge: 'W' };
        if (visited.has(coords(pos))) {
            return;
        }
        paths.push(traceWall(pos, visited, ({ row, col }: Tile) => isWall(row, col)));
    });
    return paths.join(' ');
}

// Trace the edges of a group of walls clockwise
function traceWall(pos: Pos, visited: Set<string>, isWall: (tile: Tile) => boolean): string {
    const path: Pos[] = [pos];
    // keep track of visited W positions only, since we only ever begin tracing from the west
    visited.add(coords(pos));
    // eslint-disable-next-line no-constant-condition
    while (true) {
        path.push(...nextBeveled(pos, isWall));
        pos = path[path.length - 1];
        if (pos.row == path[0].row && pos.col == path[0].col && pos.edge == path[0].edge) {
            break;
        }
        if (pos.edge == 'W') {
            visited.add(coords(pos));
        }
    }
    return renderPath(path);
}

function renderPath(path: Pos[]): string {
    let d = `M ${coords(path[0])}`;
    for (let i = 1; i < path.length; i++) {
        d += ` L ${coords(path[i])}`;
    }
    return d;
}

// turn a Pos into svg coordinates in string form for an svg path
function coords(pos: Pos): string {
    switch (pos.edge) {
        case 'N':
            return [5 + 10 * pos.col, 5 + 10 * pos.row - 5].join(' ');
        case 'S':
            return [5 + 10 * pos.col, 5 + 10 * pos.row + 5].join(' ');
        case 'E':
            return [5 + 10 * pos.col + 5, 5 + 10 * pos.row].join(' ');
        case 'W':
            return [5 + 10 * pos.col - 5, 5 + 10 * pos.row].join(' ');
    }
}

function nextBeveled(pos: Pos, isWall: (tile: Tile) => boolean): Pos[] {
    if (!isWall(nextStraight(pos))) {
        return [nextExterior(pos)];
    }
    if (!isWall(nextInterior(pos))) {
        return [nextStraight(pos)];
    }
    return [nextHalfStraight(pos), nextInterior(pos)];
}

// The following functions
// - nextStraight
// - nextHalfStraight
// - nextExterior
// - nextInterior
// All return the next position assuming a certain junction type.
// "Next" means the next position going clockwise around a group of wall tiles.
//
// Straight:
// -> ## ->
//
// Exterior:
// -> #
//    #
//    |
//    v
//
// Interior:
//    ^
//    |
//    #
// -> #


function nextStraight(pos: Pos): Pos {
    switch (pos.edge) {
        case 'N':
            return {
                row: pos.row,
                col: pos.col + 1,
                edge: pos.edge,
            };
        case 'S':
            return {
                row: pos.row,
                col: pos.col - 1,
                edge: pos.edge,
            };
        case 'E':
            return {
                row: pos.row + 1,
                col: pos.col,
                edge: pos.edge,
            };
        case 'W':
            return {
                row: pos.row - 1,
                col: pos.col,
                edge: pos.edge,
            };
    }
}

// Half straight means going to where an interior corner would be
function nextHalfStraight(pos: Pos): Pos {
    switch (pos.edge) {
        case 'N':
            return {
                row: pos.row,
                col: pos.col + 0.5,
                edge: pos.edge,
            };
        case 'S':
            return {
                row: pos.row,
                col: pos.col - 0.5,
                edge: pos.edge,
            };
        case 'E':
            return {
                row: pos.row + 0.5,
                col: pos.col,
                edge: pos.edge,
            };
        case 'W':
            return {
                row: pos.row - 0.5,
                col: pos.col,
                edge: pos.edge,
            };
    }
}

function nextExterior(pos: Pos): Pos {
    switch (pos.edge) {
        case 'N':
            return {
                row: pos.row,
                col: pos.col,
                edge: 'E',
            };
        case 'S':
            return {
                row: pos.row,
                col: pos.col,
                edge: 'W',
            };
        case 'E':
            return {
                row: pos.row,
                col: pos.col,
                edge: 'S',
            };
        case 'W':
            return {
                row: pos.row,
                col: pos.col,
                edge: 'N',
            };
    }
}

function nextInterior(pos: Pos): Pos {
    switch (pos.edge) {
        case 'N':
            return {
                row: pos.row - 1,
                col: pos.col + 1,
                edge: 'W',
            };
        case 'S':
            return {
                row: pos.row + 1,
                col: pos.col - 1,
                edge: 'E',
            };
        case 'E':
            return {
                row: pos.row + 1,
                col: pos.col + 1,
                edge: 'N',
            };
        case 'W':
            return {
                row: pos.row - 1,
                col: pos.col - 1,
                edge: 'S',
            };
    }
}
