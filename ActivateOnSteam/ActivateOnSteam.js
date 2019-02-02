/*globals findModule, monkeyPatch, EDApi*/

const Plugin = require("../plugin");
const { React, findModuleByDisplayName } = EDApi;

module.exports = new Plugin({
	name: "Activate on Steam",
	description: "Adds a activate on steam option to the context menu whenever you highlight a valid steam key.",
	author: "jakuski",
	color: "#0c1935",
	load () {
		const MessageContextMenuType = findModule("ContextMenuTypes").ContextMenuTypes.MESSAGE_MAIN;
		const MessageContextMenu = findModuleByDisplayName("MessageContextMenu");
		const Icon = findModuleByDisplayName("Icon");
		const ContextMenuGroup = findModuleByDisplayName("MenuGroup");
		const ContextMenuItem = findModuleByDisplayName("MenuItem");
		const labelClassName = `${findModule("flex").flex} ${findModule("flex").alignCenter} ${findModule("flex").directionRow}`;

		monkeyPatch(MessageContextMenu.prototype, "render", data => {
			const render = data.callOriginalMethod();
			const type = data.thisObject.props.type;
			if (type !== MessageContextMenuType || !render.props.children[1].props.children) return render;
			else {
				const selection = render.props.children[1].props.children.props.value.trim();
				const selectionIsSteamKey = /^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/g.test(selection);
				if (!selectionIsSteamKey) return render;

				render.props.children.splice(2, 0, React.createElement(ContextMenuGroup, null,
					React.createElement(ContextMenuItem, {
						label: React.createElement("div", {className: labelClassName},
							React.createElement(Icon, {name:"PlatformSteam", width: 20, height: 20, style:{marginRight: "2px"}, viewBox:"4 4 15.9 15.9"}), React.createElement("div",null,"Activate on Steam")
						),
						action: () => require("electron").shell.openExternal("https://store.steampowered.com/account/registerkey?key=" + selection)
					})
				));

				return render;
			}
		});
	},
	unload () {
		findModuleByDisplayName("MessageContextMenu").prototype.render.unpatch();
	},
});