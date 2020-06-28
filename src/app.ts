import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { Moment, utc, now, ISO_8601 } from 'moment';
import { PersistentSet } from './persistent-set';
import { getParameterLastValue } from './parameter_set_util';

// import { getParameterLastValue, getBooleanOption } from './parameter_set_util'

/**
 * The main class of this app. All the logic goes here.
 */
export default class VRGateway {
	private rootActor?: MRE.Actor = undefined;
	private knownUserIds: PersistentSet<MRE.Guid>;
	private assets: MRE.AssetContainer;
	private barrierAsset?: MRE.Asset = undefined;
	private barrierColor?: MRE.Material;
	private readonly entranceDeadline: Moment;

	constructor(private context: MRE.Context, private params: MRE.ParameterSet, private baseUrl: string) {
		// FIXME: get this from params
		const entranceDeadlineIsoStr = getParameterLastValue(params, "ed").replace(" ", "+");
		this.context.onStarted(() => this.started());
		this.context.onUserJoined(user => this.onUserJoined(user));
		this.knownUserIds = new PersistentSet<MRE.Guid>("user-ids", context.sessionId, MRE.parseGuid);
		this.assets = new MRE.AssetContainer(context);
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

		// Create a fixed size 1x1 square, to be used as barrier.
		// To adjust its size in actual use, use the scale parameter in World Editor.
		this.barrierAsset = this.assets.createBoxMesh("barrier", 1, 1, 0.01);
		// TODO: Allow the RGBA code to be passed as an argument
		this.barrierColor = this.assets.createMaterial(
			"translucent Burgundy", {
				color: {
					a: 64 / 255,
					r: 1,
					g: 0,
					b: 102 / 255
				},
				alphaMode: MRE.AlphaMode.Blend,
			}
		);
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
			this.createBarrier(user);
			await user.prompt(
				`We apologize, ${user.name}, but the event is now in progress and we aren't allowing new people in. ` +
				`Please use the browser link behind you to register for our next event. We'd love to see you then!`,
				false);
		}

		return;
	}

	private userMayEnter = (user: MRE.User) => {
		// TODO: Optionally allow privileged entry to moderators
		// NOTE: The format of the log messages should be retained, as
		// the applogs2csv.ts utility expects it.
		if (this.knownUserIds.has(user.id)) {
			console.log("Allowing in returning user", user.name, user.id);
			return true;
		}
		else {
			const entranceDeadlineMs = 1000 * this.entranceDeadline.unix();
			if (now() < entranceDeadlineMs) {
				console.log("Allowing in timely user", user.name, user.id);
				return true;
			}
			else {
				console.log("Declining entry for late user", user.name, user.id);
			}
		}

		return false;
	}

	private createBarrier(user: MRE.User) {
		MRE.Actor.Create(this.context, {
			actor: {
				name: `barrier to ${user.name} ${user.id}`,
				parentId: this.rootActor!.id,
				exclusiveToUser: user.id,
				appearance: {
					meshId: this.barrierAsset!.id,
					materialId: this.barrierColor!.id,
				},
				collider: {
					enabled: true,
					geometry: {
						shape: MRE.ColliderType.Auto
					},
					layer: MRE.CollisionLayer.Navigation,
					isTrigger: false,
				},
				rigidBody: {
					enabled: true,
					useGravity: false,
					isKinematic: true,
				},
				transform: {
					app: {
						position: { x: 0, y: 0, z: 0 },
					}
				}
			}
		});
		return;
	}
}
