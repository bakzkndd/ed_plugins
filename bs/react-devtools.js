const Plugin = require("../plugin");

module.exports = new Plugin({
	name: "React DevTools",
	description: "exd",
	color: "green",
	author: "jakuski",
	load () {
		this.bw = require("electron").remote.BrowserWindow.getAllWindows()[0];
		this.bw.webContents.on("devtools-opened", this.listener);
		console.info("Installed react devtools");
	},
	unload () {
		this.bw.webContents.removeListener("devtools-opened", this.listener);
		console.info("Removed listener");
	},
	listener () {
		const path = "../../Google/Chrome/User Data/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/3.4.3_0";
		require("electron").remote.BrowserWindow.removeDevToolsExtension("React Developer Tools");
		require("electron").webFrame.registerURLSchemeAsSecure("chrome-extension");
		if(require("electron").remote.BrowserWindow.addDevToolsExtension(path)) console.info("Sucessfully loaded React DevTools");
		else console.error("Unable to load React DevTools");
	}
});