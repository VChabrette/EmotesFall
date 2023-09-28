export class Toggler extends Map<string, boolean> {
	private _set = this.set;
	public override set = (key: string, value: boolean): this => {
		console.warn('Toggler.set() is forbidden, use Toggler.toggle() instead');
		return this;
	}

	public get isToggled(): boolean {
		return [...this.values()].some(v => v);
	}

	constructor(params?: { [key: string]: boolean } | string[]) {
		super();

		if (!params) return;

		if (Array.isArray(params)) {
			for (const key of params) {
				this._set(key, false);
			}
		} else {
			for (const [key, value] of Object.entries(params)) {
				this._set(key, value);
			}
		}

	}

	public toggle(key: string, value?: boolean): this {
		const val: boolean = value ?? !this.get(key);

		for (const [k, _] of this) {
			this._set(k, k === key && val);
		}

		this._set(key, val);

		return this;
	}
}