import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { Moment, utc, now, ISO_8601 } from 'moment';
import { resolve as resolvePath } from 'path';
//import * as i18next from 'i18next';
import { default as i18next } from 'i18next';
const FSBackend = require('i18next-fs-backend');

import { PersistentSet } from './persistent-set';
import { getParameterLastValue, getColorOption } from './parameter_set_util';

/**
 * The main class of this app. All the logic goes here.
 */
export default class VRGateway {
	private rootActor?: MRE.Actor = undefined;
	private knownUserIds: PersistentSet<MRE.Guid>;
	private assets: MRE.AssetContainer;
	private readonly barrierColor: MRE.Color4;
	private barrierAsset?: MRE.Asset = undefined;
	private barrierMaterial?: MRE.Material;
	private readonly entranceDeadline: Moment;

	constructor(private context: MRE.Context, private params: MRE.ParameterSet, private baseUrl: string) {
		const entranceDeadlineIsoStr = getParameterLastValue(params, "ed").replace(" ", "+");
		this.context.onStarted(() => this.started());
		this.context.onUserJoined(user => this.onUserJoined(user));
		this.context.onUserLeft(user => this.onUserLeft(user));
		this.knownUserIds = new PersistentSet<MRE.Guid>("user-ids", context.sessionId, MRE.parseGuid);
		this.assets = new MRE.AssetContainer(context);
		this.entranceDeadline = utc(entranceDeadlineIsoStr, ISO_8601);
		const colorParamValue = getColorOption(
			params, "c", MRE.Color4.FromInts(128, 128, 128, 255));
		this.barrierColor = this.toColor4(colorParamValue);
		return;
	}

	/**
	 * Once the context is "started", initialize the app.
	 */
	private async started() {
		await this.initMessages();
		this.rootActor = MRE.Actor.Create(this.context, {
            actor: {
                name: 'Root Actor',
            }
		});
		
		this.knownUserIds.load();

		// Create a fixed size 1x1 square, to be used as barrier.
		// To adjust its size in actual use, use the scale parameter in World Editor.
		this.barrierAsset = this.assets.createBoxMesh("barrier", 1, 1, 0.01);
		this.barrierMaterial = this.assets.createMaterial(
			"barrier material", {
				color: this.barrierColor,
				alphaMode: MRE.AlphaMode.Blend
			}
		);
	}

	private async onUserJoined(user: MRE.User) {
		const allowedIn = this.userMayEnter(user);
		const msgArgs = { name: user.name };
		if (allowedIn) {
			const addedNow = this.knownUserIds.add(user.id);
			const welcomeMsg = addedNow ? "Welcome" : "Welcome back";
			await user.prompt(
				i18next.t(welcomeMsg, msgArgs), false);
		}
		else {
			this.createBarrier(user);
			await user.prompt(
				i18next.t("You're late", msgArgs),
				false);
		}

		return;
	}

	private async onUserLeft(user: MRE.User) {
		console.log("Parting from user", user.name, user.id);
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
					materialId: this.barrierMaterial!.id,
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

	private toColor4 = (color: MRE.Color3|MRE.Color4): MRE.Color4 => {
		if (color instanceof MRE.Color3) {
			return MRE.Color4.FromColor3(color);
		}

		return color;
	}

	private async initMessages() {
		await i18next.use(FSBackend).init({
			initImmediate: true,
			fallbackLng: 'en',
			lng: 'en',
			backend: {
				loadPath: resolvePath(__dirname, '../locales/{{lng}}.json')
			}
		})
	}
}
