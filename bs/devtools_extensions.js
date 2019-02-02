const Plugin = require("../plugin");
const { join } = require("path");
const _fs = require("fs");
const promisify = require("util").promisify;

const fs = {
	readdir: promisify(_fs.readdir),
	readFile: promisify(_fs.readFile)
};

module.exports = new Plugin({
	name: "DevTools Extension Loader",
	description: "Register devtools extensions",
	color: "green",
	author: "jakuski",
	extensions: [
		"fmkadmapgofadopljbjfkapdkoienihi",
		"bomhdjeadceaggdgfoefmpeafkjhegbo"
	],
	async load () {
		this.__ext = [];

		for (const ext of this.extensions) {
			const data = await this.getExtensionData(ext);
			this.__ext.push(data);
		}

		this.browserWindow.webContents.on("devtools-opened", this.listener);
		if (this.browserWindow.webContents.isDevToolsOpened())  {
			this.browserWindow.webContents.toggleDevTools(); // Close and re open devtools
			this.browserWindow.webContents.toggleDevTools();
		}
	},
	unload () {
		this.browserWindow.webContents.removeListener("devtools-opened", this.listener);
		console.info("Removed listener");
	},
	listener () {
		module.exports.removeAll();
		module.exports.registerAll();
	},
	removeAll() {
		Object.keys(this.getExt()).forEach(ext => {
			try {
				this.removeExt(ext);
			} catch(e) {
				this.error("Failed to remove extension", e);
			}
		});
	},
	registerAll() {
		this.__ext.forEach(ext => {
			const sucess = this.addExt(ext.path);
			if (!sucess) this.error(`Unable to register extension: ${ext.name}`);
		});
	},
	async getExtensionData(id) {
		const folderPath = join(this.chromeExtPath, id);
		const versions = await fs.readdir(folderPath);
		const extPath = join(folderPath, versions[0]);
		const meta = await this.readJson(join(extPath, "manifest.json"));

		return {
			name: meta.name,
			desc: meta.description || "No description provided",
			path: extPath
		};
	},
	chromeExtPath: join(process.env.LOCALAPPDATA, "Google", "Chrome", "User Data", "Default", "Extensions"),
	addExt: require("electron").remote.BrowserWindow.addExtension,
	removeExt: require("electron").remote.BrowserWindow.removeExtension,
	getExt: require("electron").remote.BrowserWindow.getExtensions,
	get browserWindow() {
		return require("electron").remote.BrowserWindow.getAllWindows()[0]
	},
	async readJson(path) {
		const data = await fs.readFile(path, {encoding: "utf-8"});
		return JSON.parse(data);
	}
});