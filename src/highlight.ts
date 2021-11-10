// Off the cuff syntax highlighting.
// In an ideal world, I would have copy pasted the html output of this script
// into index.html so that users didn't need to run this inefficient script to
// highlight things.

// I haven't gotten around to that yet. That's one advantage of true server-side
// rendering over my jury-rigged static-side rendering. It's more automatic.

// attachId gives function names (when declared) ids if true. We give some function names ids
// so that clicking on function calls jumps to the function declaration. We need to turn
// this feature off for some parts of the code (the scan function shows up twice) because ids
// are supposed to be unique.
export function highlight(code: HTMLElement, attachId: boolean): void {
    const text = code.textContent;
    if (!text) {
        return;
    }

    const parseLine = function (line: string): string {
        if (!line) {
            return '';
        }

        // const indentResult = /^( {4})(.*)/.exec(line);
        // if (indentResult !== null) {
        //     return `${indentResult[1]}${parseLine(indentResult[2])}`;
        // }

        const impResult = /(.*)(from|import)(.*)/.exec(line);
        if (impResult !== null) {
            return `${parseLine(impResult[1])}<span class="key">${impResult[2]}</span>${parseLine(impResult[3])}`;
        }

        const defResult = /^def (\w+)\((.*)\):/.exec(line);
        if (defResult !== null) {
            if (attachId) {
                return `<span class="key">def</span> <span class="def" id="${defResult[1]}">${defResult[1]}</span>(${parseArgs(defResult[2])}):`;
            } else {
                return `<span class="key">def</span> <span class="def">${defResult[1]}</span>(${parseArgs(defResult[2])}):`;
            }
        }

        const classResult = /^class (\w+)(.*):/.exec(line);
        if (classResult !== null) {
            if (attachId) {
                return `<span class="key">class</span> <span class="def" id="${classResult[1]}">${classResult[1]}</span>${classResult[2]}:`;
            } else {
                return `<span class="key">class</span> <span class="def">${classResult[1]}</span>${classResult[2]}:`;
            }
        }

        const returnResult = /^return (.+)/.exec(line);
        if (returnResult !== null) {
            return `<span class="key">return</span> ${parseLine(returnResult[1])}`;
        }

        const emptyReturnResult = /^return/.exec(line);
        if (emptyReturnResult !== null) {
            return '<span class="key">return</span>';
        }

        const yieldResult = /^yield (.+)/.exec(line);
        if (yieldResult !== null) {
            return `<span class="key">yield</span> ${parseLine(yieldResult[1])}`;
        }

        const forResult = /^for (.+) in (.+):/.exec(line);
        if (forResult !== null) {
            return `<span class="key">for</span> ${parseLine(forResult[1])} <span class="key">in</span> ${parseLine(forResult[2])}:`;
        }

        const whileResult = /^while (.+):/.exec(line);
        if (whileResult !== null) {
            return `<span class="key">while</span> ${parseLine(whileResult[1])}:`;
        }

        const ifResult = /^if (.+):/.exec(line);
        if (ifResult !== null) {
            return `<span class="key">if</span> ${parseLine(ifResult[1])}:`;
        }

        const fnResult = /(.*)\b(\w+)\((.*)/.exec(line);
        if (fnResult !== null) {
            return `${parseLine(fnResult[1])}<a class="fn" href="#${fnResult[2]}">${fnResult[2]}</a>(${parseLine(fnResult[3])}`;
        }

        const binOpResult = /^(.*) (and|or|==|>=|<=|is not|is|in|\+|\*|-|=) (.*)/.exec(line);
        if (binOpResult !== null) {
            return `${parseLine(binOpResult[1])} <span class="op">${binOpResult[2]}</span> ${parseLine(binOpResult[3])}`;
        }

        const monOpResult = /^(.*)not(.*)/.exec(line);
        if (monOpResult !== null) {
            return `${parseLine(monOpResult[1])}<span class="op">not</span>${parseLine(monOpResult[2])}`;
        }

        const dotResult = /^(.*)\.(.*)/.exec(line);
        if (dotResult !== null) {
            return `${parseLine(dotResult[1])}<span class="dot">.</span>${parseLine(dotResult[2])}`;
        }

        const commaResult = /^(.+),(.*)/.exec(line);
        if (commaResult !== null) {
            return `${parseLine(commaResult[1])}<span class="dot">,</span>${parseLine(commaResult[2])}`;
        }

        // const litResult = /^(.*)(\d+|True|False|None)(.*)/.exec(line);
        // if (litResult !== null) {
        //     return `${parseLine(litResult[1])}<span class="lit">${litResult[2]}</span>${parseLine(litResult[3])}`;
        // }

        const selfResult = /(.*)\bself\b(.*)/.exec(line);
        if (selfResult !== null) {
            return `${parseLine(selfResult[1])}<span class="self">self</span>${parseLine(selfResult[2])}`;
        }

        return line;
    };

    code.innerHTML = text.split('\n').map(line => {
        const indentResult = /[^ ]/.exec(line);
        if (indentResult !== null && indentResult.index > 0) {
            return `<div class="line">${line.substring(0, indentResult.index)}${parseLine(line.substring(indentResult.index))}</div>`;
        }

        return `<div class="line">${parseLine(line)}</div>`;
    }).join('\n');
}

function parseArgs(args: string): string {
    const commaResult = /^(.+), (.+)/.exec(args);
    if (commaResult !== null) {
        return `${parseArgs(commaResult[1])}<span class="dot">,</span> ${parseArgs(commaResult[2])}`;
    }

    return args;
}
