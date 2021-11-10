import { Row, Slope, minCol, maxCol, slope, isSymmetric, traceAllWalls } from './fov_common';

/**
 * Example 0 is the first interactive example.
 * The data backing example 0 is stored in the html as text, not as an array in code.
 * This way, I could try out different configurations of wall and floor tiles and
 * persist them by copy pasting the html from the dev server to `./static/index.html`.
 * The other upside is pseudo-server side rendering (really static rendering).
 * There's no flash of blank grid, and it shows something even with js disabled.
 */

export function initExample0(width: number, height: number): void {
    // find the prepopulated html
    const root = document.getElementById('example0');
    const foregrounds = root?.getElementsByClassName('foreground');
    const backgrounds = root?.getElementsByClassName('background');

    const checkbox = document.getElementById('outlines') as HTMLInputElement | null;

    const walls = document.getElementById('walls') as SVGPathElement | null;
    const umbra = document.getElementById('umbra') as SVGPathElement | null;

    if (!root || !walls || !umbra || !checkbox) return;
    if (!foregrounds || foregrounds.length != 1) return;
    if (!backgrounds || backgrounds.length != 1) return;

    const fg = foregrounds[0];
    const bg = backgrounds[0];

    // parse prepopoluated html
    const parsed = parseHtml(fg, bg, width, height);
    if (!parsed) return;
    const [visible, text] = parsed;

    const playerRow = (height - 1) / 2;
    const playerCol = (width - 1) / 2;

    // root element size is in CSS ch, so we need to measure the pixels in javascript
    const bounds = root.getBoundingClientRect();
    const tileSize = bounds.width / width;

    // listen to mouse events
    let mouseRow = 0;
    let mouseCol = 0;
    let dragBehavior: '#' | '·' | null = null;

    checkbox.addEventListener('input', function () {
        if (checkbox.checked) {
            root.classList.remove('hide-outlines');
        } else {
            root.classList.add('hide-outlines');
        }
        // root.classList.toggle('hide-outlines');
    });

    root.addEventListener('mousedown', function () {
        if (text[mouseRow][mouseCol] == '#') {
            dragBehavior = '·';
        } else if (text[mouseRow][mouseCol] == '·') {
            dragBehavior = '#';
        } else {
            return;
        }

        text[mouseRow][mouseCol] = dragBehavior;
        const edges = computeFov(playerRow, playerCol, text, visible);
        renderHTML(visible, text, fg, bg, walls, umbra, edges);
    });

    root.addEventListener('mousemove', function (event) {
        const x = Math.floor(event.offsetX / tileSize);
        const y = Math.floor(event.offsetY / tileSize);

        if (y != mouseRow || x != mouseCol) {
            if (y >= height || x >= width) {
                return;
            }

            mouseRow = y;
            mouseCol = x;

            if (dragBehavior && text[mouseRow][mouseCol] != '@') {
                text[mouseRow][mouseCol] = dragBehavior;
                const edges = computeFov(playerRow, playerCol, text, visible);
                renderHTML(visible, text, fg, bg, walls, umbra, edges);
            }
        }
    });

    window.addEventListener('mouseup', function () {
        dragBehavior = null;
    });

    const edges = computeFov(playerRow, playerCol, text, visible);
    renderHTML(visible, text, fg, bg, walls, umbra, edges);
}

// Convert the prepopulated html into visible and text 2d arrays.
// visible[row][col] stores visibility.
// text[row][col] stores the character to be displayed.
function parseHtml(fg: Element, bg: Element, width: number, height: number): [boolean[][], ('#' | '·' | '@')[][]] | null {
    const fgText = fg.textContent;
    const bgText = bg.textContent;

    if (!fgText || fgText.length < width * height) return null;
    if (!bgText || bgText.length < width * height) return null;

    const visible: boolean[][] = [];
    const text: ('#' | '·' | '@')[][] = [];

    for (let row = 0; row < height; row++) {
        visible.push([]);
        text.push([]);
        for (let col = 0; col < width; col++) {
            // Add 1 to width to account for newlines
            const index = row * (width + 1) + col;
            if (fgText[index] == '·' || fgText[index] == '#') {
                visible[row].push(true);
                text[row].push(fgText[index] as ('#' | '·'));
            } else if (bgText[index] == '·' || bgText[index] == '#') {
                visible[row].push(false);
                text[row].push(bgText[index] as ('#' | '·'));
            } else if (fgText[index] == '@') {
                visible[row].push(true);
                text[row].push('@');
            } else {
                return null;
            }
        }
    }

    return [visible, text];
}

// Render our 2d arrays back to efficient-ish html.
function renderHTML(visible: boolean[][], text: ('#' | '·' | '@')[][], fg: Element, bg: Element, walls: SVGPathElement, umbra: SVGPathElement, edges: Edges): void {
    fg.textContent = text.map((line, row) => {
        return line.map((tile, col) => {
            if (visible[row][col]) {
                return tile;
            } else {
                return ' ';
            }
        }).join('');
    }).join('\n');

    bg.textContent = text.map((line, row) => {
        return line.map((tile, col) => {
            if (visible[row][col]) {
                return ' ';
            } else {
                return tile;
            }
        }).join('');
    }).join('\n');

    // clear svg
    walls.setAttribute('d', '');
    umbra.setAttribute('d', '');

    // umbra

    function tileToSvg([row, col]: [number, number]): string {
        return `${5 + 10 * col} ${5 + 10 * row}`;
    }

    let d = '';
    let wasMove = false;
    for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        if (edge == 'Move') {
            wasMove = true;
        } else if (wasMove) {
            d += ` M ${tileToSvg(edge)}`;
            wasMove = false;
        } else {
            d += ` L ${tileToSvg(edge)}`;
        }
    }
    umbra.setAttribute('d', d);

    // walls

    function isWall(row: number, col: number): boolean {
        return row >= 0 && col >= 0 && row < text.length && col < text[row].length && text[row][col] == '#';
    }

    // find a floor to wall transition between two horizontally adjacent tiles
    function forEachWEdge(fun: (row: number, col: number) => void): void {
        for (let row = 0; row < text.length; row++) {
            for (let col = -1; col < text[row].length; col++) {
                if (!isWall(row, col) && isWall(row, col + 1)) {
                    fun(row, col + 1);
                }
            }
        }
    }

    const wallsPath = traceAllWalls(forEachWEdge, isWall);
    walls.setAttribute('d', wallsPath);
}

type Edges = ([number, number] | 'Move')[]

function computeFov(centerRow: number, centerCol: number, text: ('#' | '·' | '@')[][], visible: boolean[][]): Edges {
    for (let row = 0; row < visible.length; row++) {
        for (let col = 0; col < visible[row].length; col++) {
            visible[row][col] = false;
        }
    }

    visible[centerRow][centerCol] = true;

    const shadowEdges: Edges = ['Move'];

    function transform(row: Row, col: number, quadrant: number, unbounded?: boolean): [number, number] | null {
        let major = row.depth;
        let minor = col;
        if (quadrant & 1) {
            major = -major;
        }
        if (quadrant & 2) {
            const temp = major;
            major = minor;
            minor = temp;
        }
        const y = centerRow + major;
        const x = centerCol + minor;
        if (!unbounded && (x < 0 || y < 0 || y >= text.length || x >= text[0].length)) {
            return null;
        }
        return [centerRow + major, centerCol + minor];
    }

    function reveal(row: Row, col: number, quadrant: number): void {
        const tile = transform(row, col, quadrant);
        if (tile) {
            const [row, col] = tile;
            visible[row][col] = true;
        }
    }

    function isWall(row: Row, col: number, quadrant: number): boolean {
        const tile = transform(row, col, quadrant);
        if (tile) {
            const [row, col] = tile;
            return text[row][col] == '#';
        } else {
            return true;
        }
    }

    function isFloor(row: Row, col: number, quadrant: number): boolean {
        const tile = transform(row, col, quadrant);
        if (tile) {
            const [row, col] = tile;
            return text[row][col] == '·';
        } else {
            return false;
        }
    }

    function revealSlope(row: Row, slope: Slope, quadrant: number): void {
        if (slope.den == 1 && Math.abs(slope.num) == 1) return;
        row = {
            depth: row.depth,
            start: row.start,
            end: row.end,
        };
        const col = row.depth * slope.num / slope.den;
        const tile = transform(row, col, quadrant, true);
        if (tile) shadowEdges.push(tile);
    }

    function scan(row: Row, q: number): void {
        revealSlope(row, row.start, q);
        shadowEdges.push('Move');

        for (let col = minCol(row); col <= maxCol(row); col++) {
            if (isWall(row, col, q) || isSymmetric(row, col)) {
                reveal(row, col, q);
            }
        }
        for (let prev = minCol(row); prev < maxCol(row); prev++) {
            const curr = prev + 1;
            if (isWall(row, prev, q) && isFloor(row, curr, q)) {
                row.start = slope(row, curr);
            }
            if (isFloor(row, prev, q) && isWall(row, curr, q)) {
                // shadowEdges.push('Move');
                revealSlope(row, row.start, q);
                const nextRow = {
                    depth: row.depth + 1,
                    start: row.start,
                    end: slope(row, curr),
                };
                scan(nextRow, q);
                revealSlope(row, slope(row, curr), q);
                shadowEdges.push('Move');
            }
        }
        if (isFloor(row, maxCol(row), q)) {
            revealSlope(row, row.start, q);
            const nextRow = {
                depth: row.depth + 1,
                start: row.start,
                end: row.end,
            };
            scan(nextRow, q);
        }

        revealSlope(row, row.end, q);
    }

    for (let q = 0; q < 4; q++) {
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
        scan(row, q);
        shadowEdges.push('Move');
    }

    return shadowEdges;
}
