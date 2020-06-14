import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { Moment, utc, now, ISO_8601 } from 'moment';
import { PersistentSet } from './persistent-set';

// import { getParameterLastValue, getBooleanOption } from './parameter_set_util'

/**
 * The main class of this app. All the logic goes here.
 */
export default class VRGateway {
	private rootActor?: MRE.Actor = undefined;
	private knownUserIds: PersistentSet<MRE.Guid>;
	private readonly entranceDeadline: Moment;

	constructor(private context: MRE.Context, private params: MRE.ParameterSet, private baseUrl: string) {
		// FIXME: get this from params
		const entranceDeadlineIsoStr = "2020-06-14T10:00:30+01";

		this.context.onStarted(() => this.started());
		this.context.onUserJoined(user => this.onUserJoined(user));
		this.knownUserIds = new PersistentSet<MRE.Guid>("user-ids", context.sessionId, MRE.parseGuid);
		this.entranceDeadline = utc(entranceDeadlineIsoStr, ISO_8601);
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
		const allowedIn = this.userMayEnter(user);
		if (allowedIn) {
			const addedNow = this.knownUserIds.add(user.id);
			const welcome = addedNow ? "Welcome" : "Welcome back";
			await user.prompt(
				`${welcome} ${user.name}! Please join us at the main meeting area.`, false);
		}
		else {
			await this.createBarrier();
			await user.prompt(
				`We apologize, ${user.name}, but the event is now in progress and we aren't allowing new people in. ` +
				`Please use the browser link to register for our next event`);
		}

		return;
	}

	private userMayEnter = (user: MRE.User) => {
		// TODO: Optionally allow privileged entry to moderators
		const entranceDeadlineMs = 1000 * this.entranceDeadline.unix();
		if (now() < entranceDeadlineMs) {
			console.log("Allowing in timely user", user.name, user.id);
			return true;
		}
		else if (this.knownUserIds.has(user.id)) {
			console.log("Allowing in returning user", user.name, user.id);
			return true;
		}
		else {
			console.log("Declining entry for late user", user.name, user.id);
		}

		return false;
	}

	private async createBarrier() {
		// TODO: Create a barrier to disallow entry
	}
}
