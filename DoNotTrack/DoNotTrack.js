"use strict";
/* globals monkeyPatch findModule */
const Plugin = require("../plugin");

module.exports = new Plugin({
	name:"Do Not Track Port",
	description: "A port of the <a href=\"https://github.com/rauenzi/BetterDiscordAddons/blob/master/Plugins/DoNotTrack\" target=\"_blank\">Do Not Track</a> BD plugin by <a href=\"https://github.com/rauenzi/\" target=\"_blank\">Zerebos#7790</a>.",
	author: "jakuski",
	"color": "#d15353",
	preload: false,
	load: function () {
		monkeyPatch(findModule("AnalyticEventConfigs"), "AnalyticEventConfigs", () => {});
		monkeyPatch(findModule("consoleWarning"), "consoleWarning", () => {});
		monkeyPatch(findModule("wrapMethod"), "wrapMethod", () => {});
		monkeyPatch(findModule("_wrappedBuiltIns"), "_wrappedBuiltIns", () => {});

		findModule("_originalConsoleMethods").uninstall();

		monkeyPatch(findModule("_originalConsoleMethods"), "_breadcrumbEventHandler", () => () => {});
		monkeyPatch(findModule("_originalConsoleMethods"), "captureBreadcrumb", () => {});
		monkeyPatch(findModule("_originalConsoleMethods"), "_makeRequest", () => {});
		monkeyPatch(findModule("_originalConsoleMethods"), "_sendProcessedPayload", () => {});
		monkeyPatch(findModule("_originalConsoleMethods"), "_send", () => {});

		Object.assign(window.console, findModule("_originalConsoleMethods")._originalConsoleMethods);
	},
	unload: function () {
		findModule("AnalyticEventConfigs").AnalyticEventConfigs.unpatch();
		findModule("consoleWarning").consoleWarning.unpatch();
		findModule("wrapMethod").wrapMethod.unpatch();
		findModule("_wrappedBuiltIns")._wrappedBuiltIns.unpatch();
	}
});
