/**
 * Example 3 accompanies the `tiles` function in the python.
 */

export function initExample3(): void {
    const $line1 = document.getElementById('tiles_line1') as SVGLineElement | null;
    const $line2 = document.getElementById('tiles_line2') as SVGLineElement | null;
    const $slope1 = document.getElementById('tiles_slope1') as HTMLInputElement | null;
    const $slope2 = document.getElementById('tiles_slope2') as HTMLInputElement | null;
    const $diamonds = document.getElementsByClassName('inscribed');

    if (!$line1 || !$line2 || !$slope1 || !$slope2) return;

    let slope1 = $slope1.valueAsNumber;
    let slope2 = $slope2.valueAsNumber;

    const update = function (): void {
        const start = Math.min(slope1, slope2);
        const end = Math.max(slope1, slope2);
        $line1.setAttribute('x2', `${start * 3.125}`);
        $line2.setAttribute('x2', `${end * 3.125}`);

        for (let i = 0; i < $diamonds.length; i++) {
            if (i < (start + 1) / 40 - 0.5 || i > (end - 1) / 40 + 0.5) {
                $diamonds[i].setAttribute('stroke', 'none');
            } else {
                $diamonds[i].setAttribute('stroke', '#fd8');
            }
        }
    };

    update();

    $slope1.addEventListener('input', function () {
        slope1 = this.valueAsNumber;
        update();
    });
    $slope2.addEventListener('input', function () {
        slope2 = this.valueAsNumber;
        update();
    });
}
