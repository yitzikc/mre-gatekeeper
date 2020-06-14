import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { PersistentSet } from './persistent-set';

// import { getParameterLastValue, getBooleanOption } from './parameter_set_util'

/**
 * The main class of this app. All the logic goes here.
 */
export default class VRGateway {
	private rootActor?: MRE.Actor = undefined;
	private knownUserIds: PersistentSet<MRE.Guid>;
	// private knownUserIds: Set<MRE.Guid> = new Set();

	constructor(private context: MRE.Context, private params: MRE.ParameterSet, private baseUrl: string) {
		this.context.onStarted(() => this.started());
		this.context.onUserJoined(user => this.onUserJoined(user));
		this.knownUserIds = new PersistentSet<MRE.Guid>("user-ids", context.sessionId, MRE.parseGuid);
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
		
		this.knownUserIds.load();
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

		if (shouldAllowNew) {
			this.knownUserIds.add(user.id);
		}
		return;
	}
}
