/*
A set of values, which is persisted to a local file
*/

import { eachLine } from 'line-reader';
import { appendFile } from 'fs';

export class PersistentSet<T> {
    private readonly fileName: string;
    private values: Set<T> = new Set();

    constructor(
        generalName: string,
        specificName: string,
        private readonly fromString: (s: string) => T
    )
    {
        this.fileName = `build/${generalName}-${specificName}.txt`
    }

    // FIXME: Use a consistent exception handling strategy in load() and add()

    public load = () => {
		try {
			eachLine(this.fileName, (l: string) => {
				this.values.add(this.fromString(l));
			});
		}
		catch (err) {
            console.log("Can't read from file", this.fileName, err);
            throw err;
        }

        return;
    }

    public add = (value: T) => {
        const sizeBefore = this.values.size;
        this.values.add(value);
        if (this.values.size > sizeBefore) {
            appendFile(
                this.fileName, `${value}\n`, 'utf8',
                (err) => { 
                    if (err) throw err;
                });
            return true;
        }

        return false;
    }

    public has = (value: T) => {
        return this.values.has(value);
    }

    public forEach = (f: (x: T) => void) => {
        this.values.forEach(f);
    }

}