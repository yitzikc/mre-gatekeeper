import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { eachLine } from 'line-reader';
import { appendFile } from 'fs';
import { parseGuid } from '@microsoft/mixed-reality-extension-sdk';

// import { getParameterLastValue, getBooleanOption } from './parameter_set_util'

/**
 * The main class of this app. All the logic goes here.
 */
export default class VRGateway {
	private rootActor?: MRE.Actor = undefined;
	private knownUserIds: Set<MRE.Guid> = new Set();

	constructor(private context: MRE.Context, private params: MRE.ParameterSet, private baseUrl: string) {
		this.context.onStarted(() => this.started());
		this.context.onUserJoined(user => this.onUserJoined(user));
		return;
	}

	/**
	 * Once the context is "started", initialize the app.
	 */
	private async started() {
		this.rootActor = MRE.Actor.Create(this.context, {
            actor: {
                name: 'Root Actor',
            }
		});

		try {
			eachLine('known_ids.txt', (l: string) => {
				this.knownUserIds.add(parseGuid(l));
			});
		}
		catch (e) {
			console.log("Can't open file:", e);
		}
	}

	private async onUserJoined(user: MRE.User) {
		const isKnown = this.knownUserIds.has(user.id);
		const shouldAllowNew = true;
		if (isKnown || shouldAllowNew) {
			const welcome = isKnown ? "Welcome back" : "Welcome";
			//const accepted = 
			await user.prompt(
				`${welcome} ${user.name}! Please join us at the main meeting area.`, false);
		}

		if (! isKnown && shouldAllowNew) {
			this.knownUserIds.add(user.id);
			appendFile('known_ids.txt', user.id, 'utf8',
			// callback function
			(err) => { 
				if (err) throw err;
				// if no error
				console.log("Data is appended to file successfully.")
			});
		}
		return;
	}
}
