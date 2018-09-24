const Plugin = require("../plugin");

module.exports = new Plugin({
	name:"Hide Blocked Messages",
	description: "Hide the blocked messages buttons so you're not tempted to click them.",
	author: "jakuski",
	color: "yellow",
	load () {
		this.__previousName = findModule("messageGroupBlocked").messageGroupBlocked;
		const el = document.createElement("style");
		el.innerHTML = ".displayNone { display: none !important; }";
		el.setAttribute("id","edPlugin-HideBlockedMessages");
		document.head.appendChild(el);
		findModule("messageGroupBlocked").messageGroupBlocked = "displayNone";
	},
	unload () {
		findModule("messageGroupBlocked").messageGroupBlocked = this.__previousName || "";
		document.getElementById("edPlugin-HideBlockedMessages").remove();
	}
});
