import { ParameterSet, Color3, Color4, } from '@microsoft/mixed-reality-extension-sdk';

// Get the last of potentially multiple values of a parameter in an MRE parameter set
export function  getParameterLastValue(params: ParameterSet, name: string, dflValue: string = ''): string {
    const value = params[name];
    if (typeof(value) === 'string') {
        return value;
    } else if (Array.isArray(value)) {
        return value[value.length - 1];
    }

    return dflValue;
}

// Get the value of a boolean parameter whose value can be 'y' or 'n'
export function getBooleanOption(params: ParameterSet, name: string, dfl = false): boolean {
    const assumeIfNotGiven = dfl ? 'y' : 'n'
    return (getParameterLastValue(params, name, assumeIfNotGiven)[0].toLowerCase() == 'y');
}

// Get a 3 or 4-channel colour from an option
export function getColorOption(
    params: ParameterSet, name: string, dfl: Color3|Color4
): Color3|Color4 {
    const colorSpec = "#" + getParameterLastValue(params, name, "").replace("#", " ").trim();
    switch (colorSpec.length) {
        case 7:
            return Color3.FromHexString(colorSpec);
        case 9:
            return Color4.FromHexString(colorSpec);
        case 1:
            return dfl;
        default:
            // FIXME: Throw a specific error class.
            throw Error(`Invalid HEX color: ${colorSpec}`);
    }
}
