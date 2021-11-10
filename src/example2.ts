import { Row, minCol, maxCol, slope, isSymmetric, traceAllWalls } from './fov_common';

/**
 * Example 2 is the code and output side by side.
 * Like example 0, the initial grid state is stored in the html, not the js.
 * The line numbers are hard-coded into this file (in the scan functoin),
 * and need to be updated if the python code changes.
 */

type State = {
    visible: number[][];
    text: ('#' | '·' | '@')[][];

    tick: number;
    maxTick: number;

    line: number[];
    start: number[];
    end: number[];
    row: number[];
    // col is null outside the for loop
    col: (number | null)[];
}

export function initExample2(height: number): void {
    // find the prepopulated html
    const root = document.getElementById('example2');
    const foregrounds = root?.getElementsByClassName('foreground');
    const backgrounds = root?.getElementsByClassName('background');
    const prevButton = document.getElementById('prev2');
    const nextButton = document.getElementById('next2');
    const slider = document.getElementById('slider2') as HTMLInputElement | null;

    const $walls = document.getElementById('walls2') as SVGPathElement | null;
    const $start = document.getElementById('start2') as SVGPathElement | null;
    const $end = document.getElementById('end2') as SVGPathElement | null;
    const $row = document.getElementById('row2') as SVGPathElement | null;
    const $col = document.getElementById('col2') as SVGPathElement | null;

    const lines = Array.from(document.querySelectorAll('#example2wrapper .line'));

    if (!root) return;
    if (!foregrounds || foregrounds.length != 1) return;
    if (!backgrounds || backgrounds.length != 1) return;
    if (!prevButton || !nextButton || !slider) return;
    if (!$walls || !$start || !$end || !$row || !$col) return;

    const fg = foregrounds[0];
    const bg = backgrounds[0];

    // parse prepopoluated html
    const state = parseHtml(fg, bg, height);
    if (!state) return;
    const { text } = state;

    // update slider size
    slider.max = state.maxTick as unknown as string;
    slider.value = '1';

    const playerRow = 0;
    const playerCol = height - 1;

    // root element size is in CSS ch, so we need to measure the pixels in javascript
    const bounds = root.getBoundingClientRect();
    const tileSize = bounds.height / height;

    // listen to mouse events
    let mouseRow = 0;
    let mouseCol = 0;
    let dragBehavior: '#' | '·' | null = null;

    const setCurrentTile = function (value: '#' | '·'): void {
        text[mouseRow][mouseCol] = value;
        // state.line[state.tick] and similar are undefined if at max tick,
        // so skip the search for a good tick. We can just use the new maxTick.
        if (state.tick == state.maxTick) {
            computeFov(playerRow, playerCol, state, height - 1);
            slider.max = state.maxTick as unknown as string;
            slider.value = state.tick as unknown as string;
            renderHTML(state, fg, bg, $walls, $start, $end, $row, $col, lines);
            return;
        }
        const oldLine = state.line[state.tick];
        const oldRow = state.row[state.tick];
        const oldCol = state.col[state.tick];
        computeFov(playerRow, playerCol, state, height - 1);
        // Search for a tick with the same row, col, and line
        // With the fallback of just row/col, not line
        let perfectMatch: number | null = null;
        let goodMatch: number | null = null;
        for (let tick = 0; tick < state.maxTick; tick++) {
            if (state.row[tick] == oldRow &&
                state.col[tick] == oldCol) {
                if (state.line[tick] == oldLine) {
                    perfectMatch = tick;
                    break;
                }
                // We want the first good match, not the last
                if (goodMatch == null) {
                    goodMatch = tick;
                }
            }
        }
        if (perfectMatch != null) {
            state.tick = perfectMatch;
        } else if (goodMatch != null) {
            state.tick = goodMatch;
        }
        slider.max = state.maxTick as unknown as string;
        slider.value = state.tick as unknown as string;
        renderHTML(state, fg, bg, $walls, $start, $end, $row, $col, lines);
    };

    root.addEventListener('mousedown', function () {
        if (!inBounds(mouseRow, mouseCol, height)) {
            return;
        } else if (text[mouseRow][mouseCol] == '#') {
            dragBehavior = '·';
        } else if (text[mouseRow][mouseCol] == '·') {
            dragBehavior = '#';
        } else {
            return;
        }

        setCurrentTile(dragBehavior);
    });

    root.addEventListener('mousemove', function (event) {
        const x = Math.floor(event.offsetX / tileSize);
        const y = Math.floor(event.offsetY / tileSize);

        if (y != mouseRow || x != mouseCol) {
            mouseRow = y;
            mouseCol = x;

            if (!inBounds(y, x, height)) return;

            if (dragBehavior && text[mouseRow][mouseCol] != '@') {
                setCurrentTile(dragBehavior);
            }
        }
    });

    window.addEventListener('mouseup', function () {
        if (dragBehavior) {
            dragBehavior = null;

            // let the user use arrow keys
            slider.focus({
                preventScroll: true,
            });
        }
    });

    slider.addEventListener('input', function () {
        state.tick = this.valueAsNumber;
        renderHTML(state, fg, bg, $walls, $start, $end, $row, $col, lines);
    });

    const prev = function (): void {
        if (state.tick > 1) {
            state.tick--;
            slider.value = state.tick as unknown as string;
            renderHTML(state, fg, bg, $walls, $start, $end, $row, $col, lines);
        }
        // let the user use arrow keys
        slider.focus({
            preventScroll: true,
        });
    };

    const next = function (): void {
        const maxTick = state.maxTick;
        if (state.tick < maxTick) {
            state.tick++;
            slider.value = state.tick as unknown as string;
            renderHTML(state, fg, bg, $walls, $start, $end, $row, $col, lines);
        }
        // let the user use arrow keys
        slider.focus({
            preventScroll: true,
        });
    };

    prevButton.addEventListener('click', prev);
    nextButton.addEventListener('click', next);

    renderHTML(state, fg, bg, $walls, $start, $end, $row, $col, lines);
}

// Convert the prepopulated html into visible and text 2d arrays.
// visible[row][col] stores when row,col became invisible, or Infinity otherwise.
// Time is measured in ticks starting at 0, where ticks increment each time a tile is revealed.
// text[row][col] stores the character to be displayed.
// These are sparse 2d arrays in a triangular shape.
// For a grid of height h, any row n where n in [0, h) will have elements in
// the range [h-1-n, h-1+n].
function parseHtml(fg: Element, bg: Element, height: number): State | null {
    const fgText = fg.textContent;
    const bgText = bg.textContent;

    if (!fgText || !bgText) return null;

    const visible: number[][] = [];
    const text: ('#' | '·' | '@')[][] = [];

    let index = 0;
    for (let row = 0; row < height; row++) {
        visible.push([]);
        text.push([]);
        // On the 0th row, there are height - 1 leading non-breaking spaces before the first
        // significant character. On the 1st row, there are height - 2, etc. This line skips
        // those spaces.
        index += height - row - 1;
        for (let col = height - 1 - row; col < height + row; col++, index++) {
            if (fgText[index] == '·' || fgText[index] == '#') {
                text[row][col] = fgText[index] as ('#' | '·');
            } else if (bgText[index] == '·' || bgText[index] == '#') {
                text[row][col] = bgText[index] as ('#' | '·');
            } else if (fgText[index] == '@') {
                text[row][col] = '@';
            } else {
                return null;
            }
        }
        // Add 1 to account for the trailing newline
        index++;
    }

    const state = {
        visible,
        text,
        tick: 0,
        maxTick: 0,
        line: [],
        start: [],
        end: [],
        row: [],
        col: [],
    };

    // We don't store visibility tick info in the html, so we need to run fov
    // to generate that info. Otherwise the slider won't work. 
    computeFov(0, height - 1, state, height - 1);

    state.tick = 1;

    return state;
}

// Render our 2d arrays back to efficient-ish html.
function renderHTML(state: State, fg: Element, bg: Element, $walls: SVGPathElement, $start: SVGPathElement, $end: SVGPathElement, $row: SVGPathElement, $col: SVGPathElement, lines: Element[]): void {
    const { visible, text } = state;

    function isVisible(row: number, col: number): boolean {
        return visible[row][col] <= state.tick;
    }

    const height = text.length;
    fg.textContent = text.map((line, row) => {
        const chars: string[] = [];
        const minCol = height - 1 - row;
        for (let col = 0; col < height + row; col++) {
            if (col < minCol || !isVisible(row, col)) {
                chars.push(' ');
            } else {
                chars.push(line[col]);
            }
        }
        return chars.join('');
    }).join('\n');

    bg.textContent = text.map((line, row) => {
        const chars: string[] = [];
        const minCol = height - 1 - row;
        for (let col = 0; col < height + row; col++) {
            if (col < minCol || isVisible(row, col)) {
                chars.push(' ');
            } else {
                chars.push(line[col]);
            }
        }
        return chars.join('');
    }).join('\n');

    // walls

    function isWall(row: number, col: number): boolean {
        return row >= 0 && col >= height - 1 - row && row < height && col < text[row].length && text[row][col] == '#';
    }

    // find a floor to wall transition between two horizontally adjacent tiles
    function forEachWEdge(fun: (row: number, col: number) => void): void {
        for (let row = 0; row < height; row++) {
            for (let col = height - 2 - row; col < height + row; col++) {
                if (!isWall(row, col) && isWall(row, col + 1)) {
                    fun(row, col + 1);
                }
            }
        }
    }

    const wallsPath = traceAllWalls(forEachWEdge, isWall);
    $walls.setAttribute('d', wallsPath);

    if (state.tick == state.maxTick) {
        document.querySelector('#example2wrapper .current.line')?.classList?.remove('current');
        $start.setAttribute('d', '');
        $end.setAttribute('d', '');
        $col.setAttribute('d', '');
        $row.setAttribute('d', '');
        return;
    }
    // python line highlighting
    document.querySelector('#example2wrapper .current.line')?.classList?.remove('current');
    lines[state.line[state.tick]].classList.add('current');

    // start & end slope
    const cx = 5 + 10 * (height - 1);
    const cy = 5;
    const bigy = 10 * state.row[state.tick];
    const startx = bigy * state.start[state.tick];
    const endx = bigy * state.end[state.tick];
    const minCol = cx - 5 + 10 * Math.floor(0.5 + state.row[state.tick] * state.start[state.tick]);
    const maxCol = 5 + cx + 10 * Math.ceil(-0.5 + state.row[state.tick] * state.end[state.tick]);
    $row.setAttribute('d', `M ${minCol} ${bigy} H ${maxCol} v 10 H ${minCol} Z`);
    $start.setAttribute('d', `M ${cx} ${cy} l ${startx} ${bigy}`);
    $end.setAttribute('d', `M ${cx} ${cy} l ${endx} ${bigy}`);
    const col = state.col[state.tick];
    if (col == null) {
        $col.setAttribute('d', '');
    } else {
        const x = cx + 10 * col;
        const y = cy + 10 * state.row[state.tick];
        $col.setAttribute('d', `M ${x - 5} ${y - 5} l 10 0 l 0 10 l -10 0 Z`);
        $col.classList.replace('double', 'single');
    }
}

// Mutate the visible array according to fov rules.
// This doesn't touch the DOM.
function computeFov(centerRow: number, centerCol: number, state: State, range: number): void {
    const { visible, text } = state;

    for (let row = 0; row < visible.length; row++) {
        for (let col = 0; col < visible[row].length; col++) {
            visible[row][col] = Infinity;
        }
    }

    visible[centerRow][centerCol] = 0;
    state.line = [0];
    state.start = [-1];
    state.end = [1];
    state.row = [0];
    state.col = [0];

    state.tick = 0;

    function transform(row: Row, col: number): [number, number] | null {
        if (row.depth >= text.length) return null;
        const major = row.depth;
        const minor = col;
        return [centerRow + major, centerCol + minor];
    }

    function reveal(row: Row, col: number): void {
        const tile = transform(row, col);
        if (tile) {
            const [row, col] = tile;
            visible[row][col] = state.tick + 1;
        }
    }

    function isWall(row: Row, col: number): boolean {
        const tile = transform(row, col);
        if (tile) {
            const [row, col] = tile;
            return text[row][col] == '#';
        } else {
            return true;
        }
    }

    function isFloor(row: Row, col: number): boolean {
        const tile = transform(row, col);
        if (tile) {
            const [row, col] = tile;
            return text[row][col] == '·';
        } else {
            return false;
        }
    }

    function scan(row: Row): void {
        if (row.depth > range) return;
        tick(1, row, null, state);
        tick(2, row, null, state);
        for (let col = minCol(row); col <= maxCol(row); col++) {
            tick(3, row, col, state);
            if (isWall(row, col) || isSymmetric(row, col)) {
                tick(4, row, col, state);
                reveal(row, col);
            }
            if (col == minCol(row)) {
                // skip the if statements if prev_tile is None
                tick(5, row, col, state);
                tick(7, row, col, state);
                tick(11, row, col, state);
            } else {
                const prev = col - 1;
                tick(5, row, col, state);
                if (isWall(row, prev) && isFloor(row, col)) {
                    tick(6, row, col, state);
                    row.start = slope(row, col);
                }
                tick(7, row, col, state);
                if (isFloor(row, prev) && isWall(row, col)) {
                    tick(8, row, col, state);
                    tick(9, row, col, state);
                    const nextRow = {
                        depth: row.depth + 1,
                        start: row.start,
                        end: slope(row, col),
                    };
                    tick(10, row, col, state);
                    scan(nextRow);
                }
                tick(11, row, col, state);
            }
        }
        const col_ = maxCol(row);
        tick(12, row, col_, state);
        if (isFloor(row, col_)) {
            tick(13, row, col_, state);
            const nextRow = {
                depth: row.depth + 1,
                start: row.start,
                end: row.end,
            };
            scan(nextRow);
        }
        tick(14, row, null, state);
        return;
    }

    const row = {
        depth: 1,
        start: {
            num: -1,
            den: 1,
        },
        end: {
            num: 1,
            den: 1,
        },
    };
    scan(row);

    state.maxTick = ++state.tick;
}

// Whether a given row, col is in bounds of an isoceles triangle array arrangment
// of a given height.
function inBounds(row: number, col: number, height: number): boolean {
    return row >= 0 && row < height && col >= height - 1 - row && col < height + row;
}

// advance tick and log current state
function tick(line: number, row: Row, col: number | null, state: State): void {
    state.tick++;
    state.line.push(line);
    state.start.push(row.start.num / row.start.den);
    state.end.push(row.end.num / row.end.den);
    state.row.push(row.depth);
    state.col.push(col);
}
