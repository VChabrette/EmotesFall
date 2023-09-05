import { Application, ColorMatrixFilter, Graphics } from 'pixi.js';
import { Body, Vec2, World, Circle, Box, Contact } from 'planck';
import { EMOTE_SCALE, EmoteSprite } from './emote-sprite';

type EmoteBody = { getUserData: () => EmoteSprite } & Body;

const GROUND_COLLISION = parseInt('001', 2);

export class EmotesApp extends Application {
	private pixelPerMeter = this.height / 10;

	private plankWorld: World = World({ gravity: Vec2(0, -10) });

	private get emotesBodies(): EmoteBody[] {
		const bodies: EmoteBody[] = [];

		let body = this.plankWorld.getBodyList();
		while (body !== null) {
			const currBody = body;
			body = body.getNext();

			const data = currBody.getUserData();
			if (data instanceof EmoteSprite) bodies.push(currBody as EmoteBody);
		}

		return bodies;
	}

	private pixiPositionToPlank({ x, y }: { x: number, y: number }) {
		//change Y origin point and direction
		y = (y - this.height) * -1;

		//convert pixels to meters
		x = x / this.pixelPerMeter;
		y = y / this.pixelPerMeter;

		return Vec2(x, y);
	}

	private plankPositionToPixi(v: Vec2) {
		//convert pixels to meters
		let x = v.x * this.pixelPerMeter;
		let y = v.y * this.pixelPerMeter;

		//change Y origin point and direction
		y = (y * -1) + this.height;

		return { x, y };
	}

	constructor(private height: number, private width: number) {
		super({ width, height, backgroundAlpha: 0 });

		// create world bounds
		this.createBounds();

		// flush flushable emotes
		this.plankWorld.on('pre-solve', (contact) => this.flushContact(contact));
	}

	private createBounds() {
		// HACK: Wtf man, I don't understand shit about those units
		const groundBody = this.plankWorld.createBody({ position: Vec2(0, (0.5 * EMOTE_SCALE)), userData: 'ground' });
		groundBody.createFixture({
			shape: Box(this.width / this.pixelPerMeter, 0),
			filterCategoryBits: GROUND_COLLISION,
			filterMaskBits: GROUND_COLLISION,
		});

		const leftWallBody = this.plankWorld.createBody({ position: Vec2(-1 - (0.5 * EMOTE_SCALE), 0) });
		leftWallBody.createFixture({
			shape: Box(1, this.height / this.pixelPerMeter),
		});

		const rightWallBody = this.plankWorld.createBody({ position: Vec2(this.width / this.pixelPerMeter + (0.5 * EMOTE_SCALE), 0) });
		rightWallBody.createFixture({
			shape: Box(1, this.height / this.pixelPerMeter),
		});

		// emotes cleaning
		this.ticker.add(() => {
			this.plankWorld.step(this.ticker.elapsedMS / 1000);

			for (const body of this.emotesBodies) {
				const emoteSprite = body.getUserData();

				const po = this.plankPositionToPixi(body.getPosition());

				emoteSprite.position.set(po.x, po.y);
				emoteSprite.rotation = body.getAngle() * -1;

				// if body is out of bounds, remove it
				if (body.getPosition().x < -1 || body.getPosition().x > this.width / this.pixelPerMeter + 1 || body.getPosition().y < -1) {
					this.stage.removeChild(emoteSprite);
					body.setActive(false); // HACK
					this.plankWorld.destroyBody(body);
				}
			}
		});
	}

	private flushImmediateContacts() {
		for (let c = this.plankWorld.getContactList(); c; c = c.getNext()) {
			this.flushContact(c);
		}
	}

	private flushContact(contact: Contact) {
		const getEmotesBodies = (contact: Contact) => {
			const bodyA = contact.getFixtureA().getBody();
			const bodyB = contact.getFixtureB().getBody();

			return [bodyA, bodyB].filter(body => body.getUserData() instanceof EmoteSprite) as Body[];
		}

		const [...emotesBodies] = getEmotesBodies(contact);
		if (!emotesBodies.length) return;

		for (const emoteBody of emotesBodies) {
			if (!(emoteBody.getUserData() as EmoteSprite).flushed) continue;

			contact.setEnabled(false);
			// apply a tiny linuar impulse downwards to avoid the emote to be stuck
			this.nudge(emoteBody, -0.01);
		}
	}

	private nudge(body: Body, value: number) {
		body.applyLinearImpulse(Vec2(0, value), body.getPosition(), true);
	}

	public async addEmoteSprite(emoteSprite: EmoteSprite, xPercent: number) {
		// contain x in 60% of the screen
		xPercent *= 0.6;

		// Compute emote X position from percentage of the screen width
		const rightLimit = this.width - emoteSprite.width;
		emoteSprite.position.set((rightLimit * .1) + rightLimit * xPercent, -emoteSprite.height);

		// Create the Plank model
		const emoteBody = this.plankWorld.createBody({
			type: Body.DYNAMIC,
			position: this.pixiPositionToPlank(emoteSprite.position),
			userData: emoteSprite,
		}) as EmoteBody;

		emoteBody.createFixture({
			shape: Circle(emoteSprite.height / (this.pixelPerMeter * 2)),
			friction: 0.5,
			restitution: 0.2,
			filterCategoryBits: GROUND_COLLISION,
			filterMaskBits: GROUND_COLLISION,
		});

		this.stage.addChild(emoteSprite);

		// Start emote decay
		emoteSprite.startDecay(60_000, () => this.nudge(emoteBody, 3));
	}

	public flush() {
		for (const body of this.emotesBodies) {
			const data = body.getUserData();
			if (!(data instanceof EmoteSprite)) continue;

			data.flushed = true;
		}

		this.flushImmediateContacts();
	}
}