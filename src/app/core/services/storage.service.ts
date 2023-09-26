import { Injectable } from '@angular/core';
import { BaseDirectory, createDir, readDir, readTextFile, writeFile } from '@tauri-apps/api/fs';
import { debounceTime, Subject } from 'rxjs';

const FILENAME = '.persistent_data';

const clone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

@Injectable({
	providedIn: 'root'
})
export class StorageService {
	private data = new Map<string, any>();

	private save$ = new Subject<void>();

	private path = BaseDirectory.AppData;

	constructor() {
		this.save$.pipe(debounceTime(1000)).subscribe(() => this.saveData());
	}

	public get<T = any>(key: string): T | null {
		// return a clone of the value to prevent modification of the original value
		if (typeof this.data.get(key) !== 'undefined') return clone(this.data.get(key));

		return null;
	}

	public async set<T>(key: string, val?: T) {
		if (JSON.stringify(this.get(key)) === JSON.stringify(val)) return; // Only register if value is modified

		if (typeof val === 'undefined' || val === null) this.data.delete(key)
		else this.data.set(key, val);

		this.save$.next();
	}

	public async init() {
		if (!window.__TAURI_IPC__) return;
		// resolve the path to the data folder
		await this.loadData();
	}

	private async loadData() {
		const data = new Map<string, any>();

		await this.createDataFolderIfNecessary();

		const dataFileExists = await this.dataFileExists();
		if (!dataFileExists) await this.saveData();

		const content = await readTextFile(FILENAME, { dir: this.path });
		console.log(content);
		if (!content) this.data = new Map();

		const entries = Object.entries(JSON.parse(content));
		for (const [key, value] of entries) { data.set(key, value); }

		this.data = data;
	}

	private async saveData() {
		await this.createDataFolderIfNecessary();

		const toSave: { [key: string]: unknown } = {};
		for (const [key, value] of this.data.entries()) { toSave[key] = value }

		console.log('Saving data', toSave, JSON.stringify(toSave));

		await writeFile({ path: FILENAME, contents: JSON.stringify(toSave) }, { dir: this.path })
	}

	private async createDataFolderIfNecessary(): Promise<void> {
		try {
			await readDir('', { dir: this.path });
		} catch (_) {
			console.log('Creating data folder');
			await createDir('', { dir: this.path })
			console.log('Created data folder');
		}
	}

	private async dataFileExists(): Promise<boolean> {
		try {
			await readTextFile(FILENAME, { dir: this.path });
			return true;
		} catch (_) {
			return false;
		}
	}
}
