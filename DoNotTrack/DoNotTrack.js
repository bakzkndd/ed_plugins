"use strict";
/* globals monkeyPatch findModule */
const Plugin = require("../plugin");

module.exports = new Plugin({
	name:"Do Not Track Port",
	description: "A port of the <a href=\"https://github.com/rauenzi/BetterDiscordAddons/blob/master/Plugins/DoNotTrack\" target=\"_blank\">Do Not Track</a> BD plugin by <a href=\"https://github.com/rauenzi/\" target=\"_blank\">Zerebros#7790</a>.",
	author: "jakuski",
	"color": "#d15353",
	load: function () {
		monkeyPatch( findModule("AnalyticEventConfigs"), "AnalyticEventConfigs", () => {});
		monkeyPatch( findModule("consoleWarning"), "consoleWarning", () => {});
		monkeyPatch( findModule("wrapMethod"), "wrapMethod", () => {});
	},
	unload: function () {
		findModule("AnalyticEventConfigs").AnalyticEventConfigs.unpatch();
		findModule("consoleWarning").consoleWarning.unpatch();
		findModule("wrapMethod").wrapMethod.unpatch();
	}
});
