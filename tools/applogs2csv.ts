#!/usr/bin/env npx ts-node-script

import { argv } from 'process';
import { eachLine } from 'line-reader';

function main()  {    
    const inFile = argv[2];
    // FIXME: Use a decent CSV writing library such as fast-csv
    // Note that an early attempt at that was unsuccessful, since the use of
    // 'line-reader' somehow created asynchronous execution.
    console.log("time,decision,arrival,name,guid");
    eachLine(inFile, (line) => {
        const parsed = parseLine(line);
        if (parsed != undefined) {
            const arrival = parsed.arrival || "";
            console.log(`${parsed.ts},${parsed.decision},${arrival},"${parsed.name}",${parsed.guid}`);
        }
    });
    return;
}

function parseLine(line: string): any {
    const tokens = line.split(" ");
    const decision = tokens[2].toLowerCase();
    if (! ["allowing", "declining", "parting"].includes(decision)) {
        return undefined;
    }
    const nTokens = tokens.length;
    const userPos = tokens.indexOf("user");
    if (userPos < 2) {
        return undefined;
    }

    const beforeUser = tokens[userPos - 1].toLowerCase();
    return {
        ts: tokens[0],
        decision: decision,
        arrival: (beforeUser != "from") ? beforeUser : null,
        name: tokens.slice(userPos+1, nTokens-1).join(" "),
        guid: tokens[nTokens - 1]
    }

}

main();
