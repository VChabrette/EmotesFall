import { AnimatedSprite, ColorMatrixFilter, Texture } from 'pixi.js';
import { parseGIF, decompressFrames } from 'gifuct-js'

export const EMOTE_SCALE = 0.5;

export class EmoteSprite extends AnimatedSprite {
	private static textures = new Map<string, Texture[]>();

	public createdAt = new Date();
	public flushed = false;

	// prevent calling constructor directly
	private constructor(texture: Texture[], public url: string) {
		super(texture);
		this.anchor.set(0.5);

		this.animationSpeed = 1 / 4;
		if (this.textures.length > 1) this.play();
	}

	static async fromUrl(url: string): Promise<EmoteSprite> {
		if (!this.textures.has(url)) {
			this.textures.set(url, url.includes('/animated/') ? await this.getAnimatedTextures(url) : [await Texture.fromURL(url)]);
		}

		const emote = new EmoteSprite(this.textures.get(url)!, url);

		emote.scale.set(EMOTE_SCALE);
		return emote;
	}

	private static async getAnimatedTextures(url: string): Promise<Texture[]> {
		const gif = await fetch(url).then(res => res.arrayBuffer()).then(parseGIF);
		const frames = decompressFrames(gif, true);

		return frames.map(frame => {
			return Texture.fromBuffer(new Uint8Array(frame.patch), frame.dims.width, frame.dims.height)
		});
	}

	public startDecay(duration: number, onFlush: () => void) {
		// add grayscale filter to the emote
		const filter = new ColorMatrixFilter();
		this.filters = [filter];

		// flush emote after 60 seconds, and desaturate progressively every 100ms in the last 10% of the time
		let step = 200;
		let counter = 0, max = duration / step, decayTime = 1 / 12;
		const interval = setInterval(() => {
			if (this.flushed) {
				clearInterval(interval);
				return;
			}

			if (counter >= max * (1 - decayTime)) {
				const saturation = (counter / max - (1 - decayTime)) / decayTime;
				filter.saturate(-saturation, true);
			}

			if (counter >= max) {
				clearInterval(interval);
				this.flushed = true;

				onFlush();
			}

			counter++;
		}, step);
	}
}