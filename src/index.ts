import { highlight } from './highlight';
import { initExample0 } from './example0';
import { initExample2 } from './example2';
import { initExample3 } from './example3';

// Syntax highlighting in the appendix gets ids attached
let codeBlocks = document.querySelectorAll('#appendix .python3');
for (let i = 0; i < codeBlocks.length; i++) {
    highlight(codeBlocks[i] as HTMLElement, true);
}

// Syntax highlighting in example 2 doesn't get ids attached
// beacuse it would create duplicate ids (scan)
codeBlocks = document.querySelectorAll('#example2wrapper .python3');
for (let i = 0; i < codeBlocks.length; i++) {
    highlight(codeBlocks[i] as HTMLElement, false);
}

initExample0(33, 11);
initExample2(8);
initExample3();
