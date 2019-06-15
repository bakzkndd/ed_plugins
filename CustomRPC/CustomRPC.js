"use strict";
/*globals findModule, EDApi, _, DiscordNative*/

const Plugin = require("../plugin"),
	validateJson = require("json-schema"),
	{writeFile, readFile, existsSync, mkdirSync} = require("fs"),
	statusCodes = require("http").STATUS_CODES,
	moment = findModule("parseZone"),
	{ React, React:{createElement:e}, ReactDOM } = EDApi;

/*

Roses are red,
violets are blue,
if you are reading this,
I feel sorry for you.

xoxo.

*/

module.exports = new Plugin({
	name: "CustomRPC",
	author: "jakuski",
	description: "Add custom Rich Presence to your profile without additional processes.",
	preload: false,
	color: "DodgerBlue",
	id: require("path").parse(__filename).name, // temp fix till #42 gets merged., // lol ain't removing this since it will 100% break shit
	get config () {
		const c = window.ED.config[this.id]; // some trickery to hide UI whenever the plugin is unloaded
		return c ? c.enabled ? {} : null : {};
	},
	load () {
		this.config = {};

		this._cssEl = document.createElement("style");
		this._cssEl.innerHTML = this.css;
		document.head.appendChild(this._cssEl);

		if (this.settings.rpcOnStart) this.setPresence(this.settings.config);
	},
	unload () {
		delete this.config;
		this._cssEl.remove();
		this.destroyPresence();
	},
	generateSettings() {
		setTimeout(this.mountReactComponent,5);
		return `<div id="${module.exports.id || "CustomRPC"}-react-container"></div>`;
	},
	setPresence(options={}, quiet=false) {
		return new Promise(async (res, rej) => {
			if (this.__ratelimit__.isEnforced) return rej(Error("Pushing RPC too quickly [Enforced Ratelimit]"));

			const obj = {
				socket:{ application: {} },
				args:{ activity:{
					assets: {},
					timestamps: {}
				}}
			};
			// Required
			if (!options.name) return rej(Error("You must provide a name for your Rich Presence!"));
			if (!options.id) return rej(Error("You must specifiy an application ID!"));

			obj.args.pid = process.pid;
			obj.socket.transport = "ipc";
			obj.socket.application.id = options.id;
			obj.socket.application.name = options.name;

			// Optional
			if (options.details) obj.args.activity.details = options.details;
			if (options.state) obj.args.activity.state = options.state;

			if (options.largeImage) obj.args.activity.assets.large_image = options.largeImage;
			if (options.largeText) obj.args.activity.assets.large_text = options.largeText;

			if (options.smallImage) obj.args.activity.assets.small_image = options.smallImage;
			if (options.smallText) obj.args.activity.assets.small_text = options.smallText;

			if (options.timeElapse) obj.args.activity.timestamps.start = this.getTime(true, options.timeElapse);
			if (options.timeCountdown) obj.args.activity.timestamps.end = this.getTime(false, options.timeCountdown);

			if (options.partySize && options.partyMax) obj.args.activity.party = {
				size: [
					parseInt(options.partySize),
					parseInt(options.partyMax)
				]
			};

			try {
				await findModule("SET_ACTIVITY").SET_ACTIVITY.handler(obj);

				this.__ratelimit__.enforce();

				res(obj);

				if (quiet === true) return;

				console.groupCollapsed(`%c[EnhancedDiscord] %c[${this.name}]`, "color: red;", `color: ${this.color}`, "Sucessfully applied Rich Presence");
				for (const key in options) {
					if (!options.hasOwnProperty(key)) continue;
					console.log(`%c${this.fullNames[key]}:`, "color: DodgerBlue",options[key]);
				}
				console.groupEnd();

			} catch (err) { // Because Discord was coded by idiots they decided not to use reject()...
				this.error("Failed to set RPC",err);
				rej(err);
			}
		});
	},
	destroyPresence () {
		return new Promise((res, rej) => {
			const obj = {socket: {transport: "ipc"},args: {pid: process.pid}};
			if (this.__ratelimit__.isEnforced) return rej(Error("You are setting RP too quickly [Enforced Ratelimit]"));
			try {
				findModule("SET_ACTIVITY").SET_ACTIVITY.handler(obj).then(() => {
					this.info("Sucessfully destroyed Rich Presence.");
					this.__ratelimit__.enforce();
					res();
				});
			} catch (err) {
				this.error("Failed to destroy RPC: ",err);
				rej(err);
			}
		});
	},
	__ratelimit__: {
		isEnforced: false,
		timeTillOkay () {
			return Math.abs(this.okayAt - new Date()) / 1000 % 60; // quick maffs
		},
		enforce () {
			this.isEnforced = true;
			this.enforcedAt = new Date();
			this.okayAt = (() => {
				const d = new Date();
				d.setSeconds(this.enforcedAt.getSeconds() + 15);
				return d;
			})();
			setTimeout(t => {
				t.isEnforced = false;
			}, 15000, this);
		}
	},
	fullNames: {
		name: "App Name",
		id: "App ID",
		details: "Details",
		state: "State",
		largeImage: "Large Image",
		largeText: "Large Image Tooltip",
		smallImage: "Small Image",
		smallText: "Small Image Tooltip",
		timeElapse: "Elapse Time?",
		timeCountdown: "Ending Timestamp",
		partySize: "Party Size",
		partyMax: "Party Max"
	},
	getTime(isElapse, date) {
		if (isElapse === true && date === true) return moment().unix();
		if (date instanceof Date) return moment(date).unix();
		if (date instanceof moment) return date.unix();
		if (typeof date === "number") return date;
		if (isElapse === false && typeof date === "string") return moment().add(this.ms(date), "ms").unix();
		else throw new Error("Unexpected date argument");
	},
	getAssets(id) {
		return new Promise(async (res, rej) => {
			const r = await fetch(`/api/oauth2/applications/${id}/assets`);
			if (!r.ok) rej(await r.json());
			else res(await r.json());
		});
	},
	mountReactComponent() {
		let el;

		try {
			el = document.getElementById(`${module.exports.id || "CustomRPC"}-react-container`);
			ReactDOM.render(e(module.exports.components.Settings), el);
		} catch (e) {
			console.error("Unable to mount react component:",e);
		}

		const removalObserver = new MutationObserver(mutations => { // kudos to Zerebos for showing me this snippet :pepeThumbsUp:
			for (let m = 0; m < mutations.length; m++) {
				const mutation = mutations[m];
				const nodes = Array.from(mutation.removedNodes);
				const directMatch = nodes.indexOf(el) > -1;
				const parentMatch = nodes.some(parent => parent.contains(el));
				if (directMatch || parentMatch) {
					removalObserver.disconnect();
					const removal = ReactDOM.unmountComponentAtNode(el);
					if (!removal) console.warn("Attempted to unmount react component however unsucessful. If you continue to recieve this warning, please report it to the developer on GitHub (jakuski/ed_plugins)");
				}
			}
		});

		removalObserver.observe(document.body, {subtree: true, childList: true});
	},
	supportGuild: {
		code: "na4WZpY",
		id: "474587657213575168",
		supportChannelId: "474617402525483028"
	},
	createContextMenu(config, event) {
		if (!event) throw new TypeError("A onContextMenu event must be provided as the second argument.");
		if (!Array.isArray(config)) throw new TypeError(`Context Menu Config must be an Array. Recieved: ${config}`);

		findModule("openContextMenu").openContextMenu(event, props => e(module.exports.components.ContextMenu, props), config);
	},
	components: {
		cs: { // short for class strings
			flex: findModule("flex").flex,
			justifyBetween: findModule("flex").justifyBetween,
			alignCentre: `${findModule("flex").flex} ${findModule("flex").alignCenter}`,
			verticalCentre: `${findModule("flex").flexCenter} ${findModule("flex").vertical}`,
			iconButton: ` ${findModule("iconButtonDefault").iconButtonDefault} ${findModule("iconButtonDefault").medium} crpc-icon`,
			iconFlat: "crpc-icon-flat",
			card: `${findModule("cardPrimary").cardPrimary} crpc-card`,
			margDef: "crpc-margin-default",
			margRight: "crpc-margin-right",
			partyWidth: "crpc-party-width",
			req: "crpc-req",
			spacer: "crpc-spacer",
			largeMargBottom: "crpc-margin-large-bottom",
			lineSpacing: "crpc-line-spacing",
			[Symbol.toStringTag]: "ClassStrings"
		},
		DiscordComponents: {
			Modal: EDApi.findModuleByDisplayName("Modal"),
			Textbox: EDApi.findModuleByDisplayName("TextInput"),
			Select: EDApi.findModuleByDisplayName("SelectTempWrapper"),
			Switch: EDApi.findModuleByDisplayName("SwitchItem"),
			RadioGroup: EDApi.findModuleByDisplayName("RadioGroup"),
			Divider: EDApi.findModuleByDisplayName("FormDivider"),
			Title: EDApi.findModuleByDisplayName("FormTitle"),
			Text: EDApi.findModuleByDisplayName("FormText"),
			Icon: EDApi.findModuleByDisplayName("Icon"),
			Sequencer: EDApi.findModuleByDisplayName("Sequencer"),
			LoadingSpinner: EDApi.findModuleByDisplayName("Spinner"),
			TooltipWrapper: (comp => {
				return props => {
					const children = () => e("div", null, props.children);
					return e(comp, {...props, children})
				}
			})(EDApi.findModuleByDisplayName("Tooltip")),
			ContextMenuItem: EDApi.findModuleByDisplayName("MenuItem"),
			ContextMenuGroup: EDApi.findModuleByDisplayName("MenuGroup")
		},
		Settings: class extends React.Component {
			constructor(props) {
				super(props);
				this.state = {
					switchChecked: EDApi.loadData(module.exports.id, "rpcOnStart")
				};
				this.handleSwitchUpdate = this.handleSwitchUpdate.bind(this);
			}
			handleSwitchUpdate(event) {
				const val = event.target.checked;
				EDApi.saveData(module.exports.id, "rpcOnStart", val);
				this.setState({switchChecked: val});
			}
			render () {
				const { Form, DiscordComponents:{Switch} } = module.exports.components;

				return e(React.Fragment, null,
					e(Switch, {onChange: this.handleSwitchUpdate, hideBorder: false, value:this.state.switchChecked, note: "Push rich presence whenever the plugin is loaded"}, "Set Rich Presence on start"),
					e(Form)
				);
			}
		},
		Button: class extends React.Component {
			constructClasses(arr, m) {
				if (!arr.includes("button")) arr.push("button"); // Add the base class
				const calc = arr.map(c => m[c]).join(" ");
				return calc;
			}
			render() {
				const m = findModule("button");
				return e("button", {className:this.constructClasses(this.props.buttonClasses, m), onClick: this.props.onClick, disabled: this.props.disabled}, e("div", {className: m.contents}, this.props.children));
			}
		},
		ContextMenu: class extends React.Component {
			generateChildren(config) {
				const {ContextMenuGroup, ContextMenuItem} = module.exports.components.DiscordComponents;
				const children = [];
				const closeMenu = findModule("openContextMenu").closeContextMenu;
				let currentGroup = [];

				const generateAction = func => {
					return event => {
						if (!func) return;
						func(closeMenu, event);
					};
				};

				const l = config.length;
				for (let x = 0; x < l; x++) {
					const el = config[x];

					switch (el.type) { // potential idea: discord react toolkit which handles shit like context menus on whatnot?
					case "divider":
						children.push(e(ContextMenuGroup, null, currentGroup));
						currentGroup = [];
						continue;
					case "clickable":
						currentGroup.push(e(ContextMenuItem, {label: el.label, action: generateAction(el.onClick)}));
						continue;
					}
				}
				children.push(e(ContextMenuGroup, null, currentGroup));

				return children;
			}
			render() {
				return e("div", {className: this.props.className, style: this.props.style},
					this.generateChildren(this.props.config)
				);
			}
		},
		Form: class extends React.Component {
			constructor(props) {
				super(props);

				this.makeState = this.makeState.bind(this);

				this.state = this.makeState();

				this.reset = this.reset.bind(this);
				this.activateRateLimit = this.activateRateLimit.bind(this);
				this.handlePost = this.handlePost.bind(this);
				this.handleAssetsButton = this.handleAssetsButton.bind(this);
				this.handleDestroy = this.handleDestroy.bind(this);
				this.updateLabel = this.updateLabel.bind(this);
				this.handleTimeUpdate = this.handleTimeUpdate.bind(this);
				this.handleSettingsContextMenu = this.handleSettingsContextMenu.bind(this);
				this.openSelectModal = this.openSelectModal.bind(this);
				this.cgh = this.cgh.bind(this);
				// ^ probably one of the worst parts about using react components.
			}
			cloneState(_state) {
				const state = _.cloneDeep(_state);
				Object.keys(state).forEach(key => {
					const el = state[key];
					if (el === "") delete state[key];
				});

				const validation = validateJson(state, module.exports.settingsSchema);
				if (!validation.valid) {
					findModule("push").push(module.exports.components.ErrorModal, {errorType: "validation", error: validation});
					return false;
				}

				EDApi.saveData(module.exports.id, "config", state);
				return true;
			}
			makeState(newConfig) {
				let config;
				if (newConfig) config = newConfig;
				else config = EDApi.loadData(module.exports.id, "config") ? _.cloneDeep(EDApi.loadData(module.exports.id, "config")) : {};

				//  ^ Data must be cloned otherwise the properties will still be
				// referenced to ED.config which means that everytime the user types in something,
				// the file system will be called as the config works via setters and getters, which is a big no-no.

				const state = {
					assetsButtonLabel: "Check for Images",
					postButtonLabel: "Push Rich Presence",
					destroyButtonLabel: "Destroy Presence",
					timeRadioValue: "NONE",
					isOffline: false,
					ratelimit: module.exports.__ratelimit__.isEnforced,
					rp: config
				};

				const _tempImages = [];

				//if (!config.timeCountdown && !config.timeElapse) state.timeRadioValue = "NONE";
				if (!config.timeElapse && typeof config.timeCountdown === "string") state.timeRadioValue = "COUNTDOWN";
				if (!config.timeCountdown && config.timeElapse === true) state.timeRadioValue = "ELAPSE";

				if (config.smallImage) _tempImages.push({label: config.smallImage, value: config.smallImage});
				if (config.largeImage) _tempImages.push({label: config.largeImage, value: config.largeImage});

				if (module.exports.__ratelimit__.isEnforced) {
					state.ratelimit = true;
					state.rateLimitTimeout = setTimeout(t => {
						t.setState(s => {
							s.ratelimit = false;
							return s;
						});
					}, module.exports.__ratelimit__.timeTillOkay() * 1000, this);
				}

				state.images = _tempImages.filter((value, index, self) => self.indexOf(value) === index); // Remove dupes.

				const userStatus = findModule("getStatus").getStatus(findModule("getCurrentUser").getCurrentUser().id);
				if (userStatus === "invisible" || userStatus === "offline") state.isOffline = true;

				return state;
			}
			componentWillUnmount() {
				this.setState(s => {
					clearTimeout(s.rateLimitTimeout);
					return s;
				});
			}
			reset() {
				this.setState({
					timeRadioValue:"NONE",
					images:[],
					rp: {
						name: "",
						id: "",
						details: "",
						state: "",
						partySize: "",
						partyMax: "",
						smallImage: null,
						largeImage: null,
						largeText: "",
						smallText: "",
						timeCountdown: ""
					}
				});
			}
			activateRateLimit() {
				module.exports.__ratelimit__.enforce();
				this.setState(state => {
					state.ratelimit = true;
					state.rateLimitTimeout = setTimeout(t => {
						t.setState(s => {
							s.ratelimit = false;
							return s;
						});
					}, module.exports.__ratelimit__.timeTillOkay() * 1000, this);
					return state;
				});
			}
			handlePost () {
				const data = this.state.rp;

				this.updateLabel("submit","Pushing Rich Presence...");

				if (!this.cloneState(data)) return this.updateLabel("submit","Failed (Validation Error)","Push Rich Presence");

				module.exports.setPresence(data).then(() => {
					this.updateLabel("submit","Rich Presence sucessfully set","Push Rich Presence");
					this.activateRateLimit();
				}).catch(err => {
					if (err.body && err.body.message) findModule("push").push(module.exports.components.ErrorModal, {errorType: "request", error: err});
					else findModule("push").push(module.exports.components.ErrorModal, {errorType: "generic", error: err});

					this.updateLabel("submit",`Unable to set RP. (${err.message || err.body.message})`,"Push Rich Presence");
				});

			}
			handleDestroy() {
				this.updateLabel("destroy","Destroying Presence...");
				module.exports.destroyPresence().then(() => {
					this.updateLabel("destroy","Sucessfully destroyed Presence.","Destroy Presence");
					this.activateRateLimit();
				}).catch(err => {
					this.updateLabel("destroy",`An Error Occured. (${err.message})`,"Destroy Presence");
				});
			}
			handleAssetsButton() {
				this.updateLabel("assets","Fetching Assets...");
				module.exports.getAssets(this.state.rp.id).then(res => {
					this.setState(s => {
						s.images = res.map(e => ({label: e.name, value: e.name}));
						return s;
					});
					if (res.length === 0) this.updateLabel("assets","No Images found","Check for Images");
					else this.updateLabel("assets","Sucess!","Check for Images");
				}).catch(res => {
					this.updateLabel("assets",`No valid Rich Presence App found. (${res.message})`,"Check for Images");
					this.setState(s => {
						s.images = [];
						delete s.rp.largeImage;
						delete s.rp.smallImage;
						s.rp.smallText = "";
						s.rp.largeText = "";
						return s;
					});
				});
			}
			handleTimeUpdate (event) {
				const val = event.value;
				this.setState(s => {
					switch (val) {
					case "NONE":
						delete s.rp.timeElapse;
						delete s.rp.timeCountdown;
						s.timeRadioValue = val;
						return s;
					case "ELAPSE":
						s.rp.timeElapse = true;
						delete s.rp.timeCountdown;
						s.timeRadioValue = val;
						return s;
					case "COUNTDOWN":
						delete s.rp.timeElapse;
						s.timeRadioValue = val;
						return s;
					}
				});
			}
			openUserModal() {
				const userID = findModule("getCurrentUser").getCurrentUser().id;
				findModule("fetchMutualFriends").open(userID);
			}
			openHelpModal() {
				findModule("push").push(module.exports.components.HelpModal);
			}
			openSelectModal() {
				findModule("push").push(module.exports.components.SelectModal, {form: this});
			}
			updateLabel(btn, txt, returnTo) {
				const obj = {
					assets:"assetsButtonLabel",
					submit:"postButtonLabel",
					destroy: "destroyButtonLabel"
				};
				const name = obj[btn];
				this.setState(s =>{
					s[name] = txt;
					return s;
				});
				if (returnTo) {
					setTimeout(() => {
						this.setState(s =>{
							s[name] = returnTo;
							return s;
						});
					}, 3000);
				}
			}
			cgh(name, type) { // short for create change handler
				return event => {
					let val;

					switch (type) {
					case "text":
						val = event;
						break;
					case "number":
						if (!module.exports.regex.number.test(event)) return;
						else val = event;
						break;
					case "select":
						if (!event) val = null; // #qualitydiscorddevs
						else val = event.value;
						break;
					}

					this.setState(s => {
						s.rp[name] = val;
						return s;
					});
				};
			}
			handleLinkContextMenu(event) {
				const openExternalURL = url => require("electron").shell.openExternal(url);
				const links = module.exports.links.map(el => {
					return {
						type: "clickable",
						label: el.colour ? e("span",{style:{color: el.colour}}, el.label) : el.label,
						onClick: () => openExternalURL(el.url)
					};
				});

				module.exports.createContextMenu(links, event);
			}
			handleSettingsContextMenu(event) {
				const config = [
					{
						type: "clickable",
						label: "Reset Form",
						onClick: closeMenu => {
							this.reset();
							closeMenu();
						}
					}
				];

				module.exports.createContextMenu(config, event);
			}
			render() {
				const { Button, cs, DiscordComponents:{RadioGroup, Divider, Title, Select, TooltipWrapper, Icon, Textbox} } = module.exports.components;

				const margDef = {className: cs.margDef};
				const spacer = {className: cs.spacer};

				const disableImagesButton = (!this.state.rp.id || module.exports.regex.blankString.test(this.state.rp.id));

				return e("div", {className: cs.card},
					// The two required inputs, app name and ID
					e(Title, spacer, "App Name", e("span",{className: cs.req}, "* Required")),
					e(Textbox, {placeholder: "Half Life 3", onChange: this.cgh("name", "text"), value: this.state.rp.name}),
					e(Title, margDef, "App ID", e("span",{className: cs.req}, "* Required & Must be a valid RPC app")),
					e(Textbox, {placeholder: "1337", onChange: this.cgh("id", "number"), value: this.state.rp.id}),

					e("div", spacer),

					// Check Assets Button
					e(Button, {buttonClasses:["lookOutlined","colorWhite"], onClick: this.handleAssetsButton, disabled: disableImagesButton}, this.state.assetsButtonLabel),

					e("div", spacer),

					// Basic RPC Info
					e(Title, margDef, "Details"),
					e(Textbox, {placeholder: "Your 1st line of text", onChange: this.cgh("details", "text"), value: this.state.rp.details}),
					e(Title, margDef, "State"),
					e(Textbox, {placeholder: "Your 2nd line of text", onChange: this.cgh("state", "text"), value: this.state.rp.state}),

					// Images
					e("div",{style:{display: this.state.images.length > 0 ? "block" : "none"}},
						e(Divider, margDef),

						e(Title, margDef, "Large Image"),
						e(Select, {options: this.state.images, onChange: this.cgh("largeImage","select"), value: this.state.rp.largeImage}),

						e(Title, margDef, "Large Image Tooltip"),
						e(Textbox, {placeholder: "This text will be shown when you hover over the large image.", onChange: this.cgh("largeText", "text"), value: this.state.rp.largeText}),

						e(Title, margDef, "Small Image"),
						e(Select, {options: this.state.images, onChange: this.cgh("smallImage","select"), value: this.state.rp.smallImage}),

						e(Title, margDef, "Small Image Tooltip"),
						e(Textbox, {placeholder: "This text will be shown when you hover over the small image.",onChange: this.cgh("smallText", "text"), value: this.state.rp.smallText})
					),

					e(Divider, margDef),

					// Time Radio Selection
					e(Title, margDef, "Time Options"),
					e(RadioGroup, {
						options:[{name:"None",value:"NONE"},{name:"Elapse",value:"ELAPSE",desc:"Count up indefinetly. Shown as '##:## Elapsed'"},{name:"Countdown",value:"COUNTDOWN",desc:"Specifiy how long to countdown for. Shown as '##:## left'"}],
						value: this.state.timeRadioValue,
						size: "7px",
						onChange: this.handleTimeUpdate
					}),

					e("div", spacer),

					// Countdown Time Input
					e("div", {style:{display: this.state.timeRadioValue === "COUNTDOWN" ? "block" : "none"}},
						e(Title, margDef, "How long to countdown for. Must be parsable by ", e("a",{target:"_blank", href: "https://github.com/jakuski/ed_plugins/blob/master/CustomRPC/times.md"},"MS")),
						e(Textbox, {onChange: this.cgh("timeCountdown", "text"), value: this.state.rp.timeCountdown, placeholder: "6h"})
					),

					// Party
					e(Title, margDef, "Party"),
					e("div", {className: cs.flex},
						e(Textbox, {placeholder: "Size", maxLength: 4, onChange: this.cgh("partySize", "number"), value: this.state.rp.partySize, className: `${cs.partyWidth} ${cs.margRight}`}),
						e(Textbox, {placeholder: "Max", maxLength: 4, onChange: this.cgh("partyMax", "number"), value: this.state.rp.partyMax, className: cs.partyWidth})
					),

					e(Divider, margDef),

					// RPC Control Buttons
					e("div", {className: `${cs.alignCentre} ${cs.justifyBetween}`},
						e("div", {className: cs.flex},
							e(TooltipWrapper, {
								text: this.state.ratelimit ? "You are currently being ratelimited. Please wait."
									: this.state.isOffline ? "You are currently offline! No activities will appear!" : null
							},
							e("div", {className: cs.margRight}, // blank div required otherwise tooltip won't work. big sad.
								e(Button, {buttonClasses:["colorGreen", "lookFilled"], onClick: this.handlePost, disabled: this.state.ratelimit}, this.state.postButtonLabel)
							)),
							e(TooltipWrapper, {text: this.state.ratelimit ? "You are currently being ratelimited. Please wait." : null},
								e("div",null,e(Button, {buttonClasses:["colorGreen", "lookFilled"], onClick: this.handleDestroy, disabled: this.state.ratelimit}, this.state.destroyButtonLabel))
							),
							//e(Button, {buttonClasses:["colorGreen", "lookFilled"], onClick: this.handleDestroy, disabled: module.exports.__ratelimit__.isEnforced}, this.state.destroyButtonLabel),
							e(Button, {buttonClasses:["lookLink","colorPrimary"], onClick: this.openUserModal}, "View User Profile")
							//e(Title, {tag: "h4"}, "You are currently being Ratelimited. Please wait 15s.")
						),
						e("div", {className: cs.flex},
							e("div", {onContextMenu: this.handleLinkContextMenu, onClick: this.openHelpModal},
								e(TooltipWrapper, {text: "Quick Links & Help"},
									e(Icon, {name: "QuestionMark", className: cs.iconButton})
								)
							),
							e("div", {onContextMenu: this.handleSettingsContextMenu, onClick: this.openSelectModal},
								e(TooltipWrapper, {text: "Import / Export Settings"},
									e(Icon, {name: "Gear", className: cs.iconButton})
								)
							)
						)
					));
			}
		},
		HelpModal: class extends React.Component {
			constructor(props) {
				super(props);
				this.state = {
					hasJoinedSupportGuild: findModule("getGuild").getGuild(module.exports.supportGuild.id) ? true : false
				};
				this.joinSupportGuild = this.joinSupportGuild.bind(this);
			}
			joinSupportGuild() {
				this.props.onClose(); // Close the modal
				findModule("popLayer").popLayer(); // Close the settings layer popup thing

				if (!findModule("getGuild").getGuild(module.exports.supportGuild.id)) findModule("acceptInvite").acceptInvite(module.exports.supportGuild.code);
				findModule("dispatch").dispatch({
					type: "CHANNEL_SELECT",
					guildId: module.exports.supportGuild.id,
					channelId: module.exports.supportGuild.supportChannelId
				});
			}
			generateLinks() {
				const links = module.exports.links;
				return links.map(el => {
					return e(React.Fragment, null,
						e("a",{target: "_blank", href: el.url}, el.label),
						e("br")
					);
				});
			}
			render() {
				const {Button, cs, DiscordComponents:{Modal, Title, Text, Divider}} = module.exports.components;

				const margDef = {className: cs.margDef};

				return e(Modal, {size: Modal.Sizes.MEDIUM},
					e(Modal.Header, null,
						e(Title, {tag: "h4"}, "Quick Links & Help"),
						e(Modal.CloseButton, {onClick: this.props.onClose})
					),
					e(Modal.Content, {className: cs.lineSpacing},
						e(Title, {tag: "h5"}, "Quick Links"),
						e(Text, {type: "description"}, this.generateLinks()),

						e(Divider, margDef),

						e(Title, {tag: "h5"}, "F.A.Q."),
						e(Text, {type: "default"}, e("strong",null, "Q: How do I make my own app?"),e("br"),
							"A: Visit the Discord Developer Portal (linked above) and log in, you'll be at the home screen of the Discord Developer portal. This is where you can create bots and other 1337 Discord things, for now we are just going to make a app to host our images. Click 'Create an application' and you'll have your own app. You don't need to assign it a special name or image. Click on the Rich Presence tab on the left, then Art Assets. On this screen you will be able to upload your own images which you'll be able to use in CustomRPC. After uploading some images, you can head back to CustomRPC and start filling it in. Your app name ",e("strong",null,"does not"), " have to be the same one as your application on the developer portal.",
							e("br"),e("br"),
							e("strong",null, "Q: How do I get my ID?"),e("br"),
							"A: Your ID is listed as 'Client ID' on the General Information tab of your application on the Discord Developer Portal.",
							e("br"),e("br"),
							e("strong",null, "Q: How do I apply an image?"),e("br"),
							"A: Put your app ID into it's respective field (the second one) and click the 'Check for Images' button. If you have images uploaded on your application, the images sections will appear and you will be able to set the image and a tooltip for it.",
							e("br"),e("br"),
							e("strong",null, "Q: What is a ratelimit?"), e("br"),
							"A: Discord only allows you setting a Rich Presence every 15 seconds, this time restraint is called a rate limit.",
							e("br"),e("br"),
							e("strong",null, "Q: I've got a validation error? wtf?"),e("br"),
							"A: Go on the GitHub page of CustomRPC (linked above), and check out each setting. Make sure your input meets the requirements of the validation section. E.g. your App Name is not longer than 32 characters. If there is an error you cannot understand, ask in my support server (link below).",
							e("br"),e("br"),
							e("strong",null, "Q: My rich presence is not showing up!"),e("br"),
							"A: Make sure you do not have another app / game pushing rich presence, also make sure you are not offline.",
							e("br"),e("br"),
							e("strong",null, "Q: Some of my images are missing?"),e("br"),
							"A: This happens because CustomRPC only stores the images you have selected and not the others returned from the API. Simply check for images once again and they'll re-appear."
						),

						e(Divider, margDef),

						e(Title, {tag: "h5"}, "General Reference"),
						e("div", {className: `${cs.flex} ${cs.spacer}`},
							e("img", {src: "https://vgy.me/zgjTeG.gif"})
						),

						e(Divider, margDef),

						e(Title, {tag: "h5"}, "Support Server"),
						e(Button, {buttonClasses:["lookFilled","colorBrand","grow","sizeMedium"], onClick: this.joinSupportGuild}, this.state.hasJoinedSupportGuild ? "You have already joined the support server. Click here to go to it." : "Click here to join the support server."),
						e("div", {className: cs.largeMargBottom}) // Fix for BMT being a gay
					)
				);
			}
		},
		ErrorModal: class extends React.Component {
			constructor(props) {
				super(props);
				this.state = {copyButtonLabel: "Copy formatted error"};

				this.generateErrorBody = this.generateErrorBody.bind(this);
				this.copyToClip = this.copyToClip.bind(this);
			}
			copyToClip(content) {
				DiscordNative.clipboard.copy(content);
				this.setState({copyButtonLabel: "Copied!"});
				setTimeout(t => t.setState({copyButtonLabel: "Copy formatted error"}), 3000, this);
			}
			generateErrorBody() {
				const {cs, DiscordComponents:{Title, Text, Divider}} = module.exports.components;
				const headerChildren = [];
				const bodyChildren = [];
				let clip;

				const margDef = {className: cs.margDef};

				switch (this.props.errorType) {
				case "validation":
					headerChildren.push(
						e(Title, null, "A validation error occured."),
						e(Text, null, "This most likely means you entered something you shouldn't have. If you don't understand any of the errors below, check out the F.A.Q. (available from the question mark icon). If you are trying to load a config, this means you're config is not in valid format.")
					);

					this.props.error.errors.forEach(err => {
						bodyChildren.push(
							e(Divider, margDef),
							e(Title, null, "Property"),
							e(Text, {className: cs.spacer}, err.property === "" ? "root" : module.exports.fullNames[err.property] ? module.exports.fullNames[err.property] : err.property),
							e(Title, null, "Error Message"),
							e(Text, {className: cs.spacer}, _.upperFirst(err.message))
						);
					});
					clip = `Validation Error:\n\`\`\`json\n${JSON.stringify(this.props.error.errors, null, 4)}\n\`\`\``;
					// Alternate clipboard text, if I ever decide to swtich back. //clip = `**Validation Error:**\n${this.props.error.errors.map(el => `Property: \`${el.property === "" ? "root" : el.property}\`\nMessage: \`${el.message}\``).join("\n")}`;
					break;
				case "request":
					headerChildren.push(
						e(Title, null, "A HTTP request error occured whilst fetching images"),
						e(Text, null, "This most likely means the ID you have provided is incorrect. Double check it and make sure its a valid app. If it still doesn't work, the Discord API may be faulty and you'll have to try again later.")
					);

					bodyChildren.push(
						e(Divider, margDef),
						e(Title, null, "Request Details"),
						e(Text, {className: cs.spacer},
							e("strong",null, "URL: "),
							(this.props.error.url || e("i", null, "URL not programatically provided. Check console.")),
							e("br"),
							e("strong",null,"Response Code: "),
							this.props.error.status,
							e("br"),
							e("strong",null,"Response Text: "),
							statusCodes[this.props.error.status]
						),
						e(Divider, margDef),
						e(Title, null, "Request Response"),
						e(Text, {className: cs.spacer},
							e("strong",null,"Message: "),
							this.props.error.body.message,
							e("br"),
							e("strong",null,"Error Code: "),
							this.props.error.body.code
						)
					);
					clip = `HTTP non-ok response:\n\`\`\`md\n> Request\n[URL][${this.props.error.url || "none"}]\n[Response Code][${this.props.error.status}]\n[Response Text][${statusCodes[this.props.error.status]}]\n\n> Response\n[Message][${this.props.error.body.message}]\n[Code][${this.props.error.body.code}]\n\`\`\``;
					break;
				case "generic":
					headerChildren.push(
						e(Title, null, "A generic error was caught."),
						e(Text, null, "Not much can be deciphered from this programatically :/",e("br"),"If this kind of error persists, please report it in the support server (available from the help section (question mark icon on form))")
					);

					bodyChildren.push(
						e(Divider, margDef),
						e(Title, null, "Error Stack:"),
						e(Text, {className: cs.spacer},
							e("pre",null,this.props.error.stack)
						)
					);
					clip = `Generic Error:\n\`\`\`\n${_.truncate(this.props.error.stack, {length:1950})}\n\`\`\``;
					break;
				default:
					headerChildren.push(
						e(Title, null, "Excuse me what the fuck."),
						e(Text, null, "Chances are you are screwing with the plugin in which case, ur mam gay. However, if you are a genuine user, please report this error ASAP in the support server (link in help section)")
					);
					clip = "suck ur mom";
				}


				return {body: bodyChildren, header: headerChildren, clipboardText: clip};
			}
			render() {
				const {Button, cs, DiscordComponents:{Modal, Title, Icon}} = module.exports.components;

				const content = this.generateErrorBody(this.props.errorType, this.props.error);

				return e(Modal, {size: Modal.Sizes.MEDIUM},
					e(Modal.Header, null,
						e(Title, {tag: "h4"}, "Something fucked up."),
						e(Modal.CloseButton, {onClick: this.props.onClose})
					),
					e(Modal.Content, {className: cs.lineSpacing},
						e("div", {className: cs.flex},
							e("div", {onClick: () => require("electron").shell.openExternal("https://www.youtube.com/watch?v=ukznXQ3MgN0")},
								e(Icon, {name: "Poop", width: 100, height: 100, className: `${cs.iconFlat} ${cs.margRight}`})
							),
							e("div", null, content.header)
						),
						content.body
					),
					e(Modal.Footer, null,
						e(Button, {buttonClasses: ["lookFilled","colorBrand","grow","sizeSmall"], onClick: this.props.onClose}, "Close"),
						e(Button, {buttonClasses: ["lookLink","colorWhite","grow","sizeSmall"], onClick: () => this.copyToClip(content.clipboardText)}, this.state.copyButtonLabel)
					)
				);
			}
		},
		SelectModal: class extends React.Component {
			constructor(props) {
				super(props);

				this.state = {
					view: "JUST_OPENED",
					closable: true
				};

				if (!existsSync(module.exports.configPath)){ // Yeah its probably not a good idea to use sync methods but I dont know where else to put it.
					mkdirSync(module.exports.configPath);
				}

				this.views = ["JUST_OPENED","AWAITING_EXPORT_CONFIRM","AWAITING_FILE_PICKER","ERROR:FS_ERR","ERROR:INVALID_CONFIG","ERROR:INVALID_JSON","FILE_READ_OK","SAVE_SUCESS"];

				this.import = this.import.bind(this);
				this.confirmExport = this.confirmExport.bind(this);
				this.export = this.export.bind(this);
				this.reset = this.reset.bind(this);
				this.insertIntoForm = this.insertIntoForm.bind(this);
				this.renderBody = this.renderBody.bind(this);
				this.renderFooter = this.renderFooter.bind(this);
			}
			import() {
				this.setState({view: "AWAITING_FILE_PICKER", closable: false});
				require("electron").remote.dialog.showOpenDialog({
					title: "Select a configuration",
					defaultPath: module.exports.configPath,
					filters:[{name:"CustomRPC Configuration", extensions:["crpc"]}, {name:"CRPC Configs + JSON", extensions:["crpc","json"]}],
					properties:["openFile"]
				}, dir => {
					if (!dir) return this.setState({view: "JUST_OPENED", closable: true});
					const path = dir[0];
					readFile(path, {encoding: "utf-8"}, (err, str) => {
						if (err) return this.setState(s => {
							s.view = "ERROR:FS_ERR";
							s.err = err;
							s.closable = true;
							return s;
						});
						let data;
						try {
							data = JSON.parse(str);
						} catch (e) {
							return this.setState(s => {
								s.view = "ERROR:INVALID_JSON";
								s.err = e;
								s.closable = true;
								return s;
							});
						}

						const validation = validateJson(data, module.exports.settingsSchema);
						if (!validation.valid) return this.setState(s => {
							s.view = "ERROR:INVALID_CONFIG";
							s.err = validation.errors;
							s.closable = true;
							return s;
						});

						this.setState(s => {
							s.view = "FILE_READ_OK";
							s.file = data;
							s.closable = true;
							return s;
						});
					});
				});
			}
			confirmExport() {
				this.setState({view: "AWAITING_EXPORT_CONFIRM"});
			}
			export() {
				this.setState({view: "AWAITING_FILE_PICKER", closable: false});
				require("electron").remote.dialog.showSaveDialog({
					title: "Save a configuration",
					defaultPath: require("path").join(module.exports.configPath,"MyConfig.crpc"),
					filters:[{name:"CustomRPC Configuration", extensions:["crpc"]}, {name:"CRPC Configs + JSON", extensions:["crpc","json"]}]
				}, dir => {
					if (!dir) return this.setState({view: "AWAITING_EXPORT_CONFIRM", closable: true});
					writeFile(dir, JSON.stringify(this.props.form.state.rp), err => {
						if (err) return this.setState({
							view: "ERROR:FS_ERR",
							err,
							closable: true
						});

						this.setState({view: "SAVE_SUCESS", closable: true});
					});
				});
			}
			async insertIntoForm() {
				this.props.form.reset();
				await module.exports.sleep(100); // wait for state to be reset before pushing new one
				this.props.form.setState(this.props.form.makeState(this.state.file));
				this.props.onClose();
			}
			openConfigDir() {
				require("electron").shell.openItem(module.exports.configPath);
			}
			reset(e) {
				if (e) e.preventDefault();
				this.setState(s => {
					s.view = "JUST_OPENED";
					s.closable = true;
					delete s.err;
					delete s.file;
					return s;
				});
			}
			renderBody() {
				const {cs, Button, DiscordComponents:{Title, Text, LoadingSpinner, Icon}} = module.exports.components;

				switch (this.state.view) {
				case "JUST_OPENED":
					return e(React.Fragment, null,
						e(Title, null, "Import"),
						e(Button, {buttonClasses:["grow","sizeSmall","lookFilled","fullWidth","colorBrand"], onClick: this.import},"Import a configuration"),
						e("div", {className: cs.spacer}),
						e(Title, null, "Export"),
						e(Button, {buttonClasses:["grow","sizeSmall","lookFilled","fullWidth","colorBrand"], onClick: this.confirmExport},"Export your current configuration"),
						e("div", {className: cs.spacer})
					);
				case "AWAITING_EXPORT_CONFIRM":
					return e(React.Fragment, null,
						e(Title, null, "Exporting the following configuration"),
						e(Text, null,
							Object.keys(this.props.form.state.rp).map(key => e(React.Fragment, null,
								e("strong", null, module.exports.fullNames[key], ": "),
								this.props.form.state.rp[key],
								e("br")
							))
						),
						e("div", {className: cs.spacer})
					);
				case "AWAITING_FILE_PICKER":
					return e(LoadingSpinner);
				case "FILE_READ_OK":
					return e(React.Fragment, null,
						e(Title, null, "Importing the following configuration"),
						e(Text, null,
							Object.keys(this.state.file).map(key => e(React.Fragment, null,
								e("strong", null, module.exports.fullNames[key], ": "),
								this.state.file[key],
								e("br")
							))
						),
						e("div", {className: cs.spacer})
					);
				case "SAVE_SUCESS":
					return e("div", {className: cs.verticalCentre},
						e(Icon, {name: "Checkmark", className: cs.iconFlat, width: 50, height:50}),
						e(Text, null, "Config sucessfully saved."),
						e("div", {className: cs.largeMargBottom})
					);

				case "ERROR:FS_ERR":
					return e(React.Fragment, null,
						e(Title, null, "Error - Failed file system operation"),
						e(Text, null, this.state.err.message)
					);
				case "ERROR:INVALID_CONFIG":
					return e(React.Fragment, null,
						e(Title, null, "Error - Chosen config does not match the schema (is invalid)"),
						this.state.err.map(err => e(React.Fragment,null,
							e(Text,null,
								e("strong",null,"Property: "),
								module.exports.fullNames[err.property] ? module.exports.fullNames[err.property] : err.property,
								e("br"),
								e("strong",null,"Message: "),
								_.upperFirst(err.message)
							)
						)),
						e("div", {className: cs.spacer})
					);
				case "ERROR:INVALID_JSON":
					return e(React.Fragment, null,
						e(Title, null, "Error - Failed whilst parsing JSON"),
						e(Text, null, this.state.err.message)
					);
				default:
					return e(Title, null, "Unknown Error / View");
				}
			}
			renderFooter() {
				const {Button} = module.exports.components;
				switch (this.state.view) {
				case "JUST_OPENED":
					return e(Button, {buttonClasses: ["lookLink","colorPrimary"], onClick: this.openConfigDir}, "Open configuration directory");
				case "AWAITING_FILE_PICKER":
					return e(React.Fragment);
				case "AWAITING_EXPORT_CONFIRM":
					return e(React.Fragment, null,
						e(Button, {buttonClasses: ["lookLink","colorPrimary"], onClick:this.reset}, "Cancel"),
						e(Button, {buttonClasses: ["lookFilled","colorBrand","grow","sizeMedium"], onClick:this.export}, "Export Configuration")
					);
				case "FILE_READ_OK":
					return e(React.Fragment, null,
						e(Button, {buttonClasses: ["lookLink","colorPrimary"], onClick:this.reset}, "Cancel"),
						e(Button, {buttonClasses: ["lookFilled","colorBrand","grow","sizeMedium"], onClick:this.insertIntoForm}, "Import Configuration")
					);
				case "SAVE_SUCESS":
					return e(Button, {buttonClasses: ["lookFilled","colorBrand","grow","sizeMedium"], onClick: this.props.onClose}, "Finish");
				default:
					return e(Button, {buttonClasses: ["lookFilled","colorBrand","grow","sizeMedium"], onClick: this.reset}, "Reset");
				}
			}
			render() {
				const {cs, DiscordComponents:{Modal, Title, Sequencer}} = module.exports.components;

				return e(Modal, {size: Modal.Sizes.SMALL},
					e(Modal.Header, null,
						e(Title, {tag: "h4"}, "Import / Export Configs"),
						this.state.closable ? e(Modal.CloseButton, {onClick: this.props.onClose}) : null
					),
					e(Modal.Content, {className: cs.lineSpacing},
						e(Sequencer, {
							step: this.state.view,
							steps: this.views
						}, this.renderBody())
					),
					e(Modal.Footer, null,
						e(Sequencer, {
							step: this.state.view,
							steps: this.views
						}, e("div", {className: cs.flex}, this.renderFooter()))
					)
				);
			}
		}
	},
	links: [
		{
			label: "Discord Developer Portal",
			url: "https://discordapp.com/developers/applications/",
			colour: "#7289DA"
		},
		{
			label: "GitHub",
			url: "https://github.com/jakuski/ed_plugins/tree/master/CustomRPC",
		},
		{
			label: "Timing Info",
			url: "https://github.com/jakuski/ed_plugins/blob/master/CustomRPC/times.md"
		}
	],
	regex: {
		snowflake: /^\d{17,20}$/,
		blankString: /^\s*$/,
		number: /^\d*$/,
		numberReq: /^\d+$/,
		ms: /^((?:\d+)?-?\d?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i
	},
	settingsSchema: {
		type: "object",
		required: true,
		properties: {
			name: {type: "string", required: true, minLength: 2, maxLength:32},
			id: {type: "string", required: true, get pattern () { return module.exports.regex.snowflake; },}, // I dont have to enforce a min/maxlength since the regex does that for me :wesmart:
			details: {type: "string", minLength: 2, maxLength:128},
			state: {type: "string", minLength: 2, maxLength:128},
			smallImage: {type: "string", minLength: 1, maxLength:128},
			smallText: {type: "string", minLength: 1, maxLength:128},
			largeImage: {type: "string", minLength: 1, maxLength:128},
			largeText: {type: "string", minLength: 1, maxLength:128},
			partySize: {type: "string", get pattern() { return module.exports.regex.numberReq; }, minLength:1, maxLength: 4},
			partyMax: {type: "string", get pattern() { return module.exports.regex.numberReq; }, minLength:1, maxLength: 4},
			timeCountdown: {type: "string", get pattern () { return module.exports.regex.ms; }}, // Must be getters because the plugin object has not yet been assigned.
			timeElapse: {type: "boolean"}
		}
	},
	configPath: require("path").join(process.env.injDir, "plugins", "CustomRPC Configurations"),
	css: "/* Styles for CustomRPC */\n.crpc-margin-default{margin-top:8px;margin-bottom:8px}.crpc-card,.crpc-spacer{margin-bottom:10px}.crpc-margin-right{margin-right:10px}svg.crpc-icon g,svg.crpc-icon path{fill:#fff}svg.crpc-icon-flat path{fill:#fff;opacity:.7}svg.crpc-icon-flat g polyline{opacity:.7;stroke:#fff}.crpc-party-width{width:60px}.crpc-card{padding:10px;margin-top:10px}.crpc-req{color:rgba(240,71,71,.6);margin-left:4px}.crpc-margin-large-bottom{margin-bottom:20px}.crpc-line-spacing{line-height:20px}",
	ms (a, b) {
		function i(t,u,v,x){return Math.round(t/v)+" "+x+(u>=1.5*v?"s":"");}let j=1e3,k=60*j,l=60*k,o=24*l;b=b||{};let r=typeof a;if("string"==r&&0<a.length)return function(t){if(t+="",!(100<t.length)){let u=/^((?:\d+)?\-?\d?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(t);if(u){let v=parseFloat(u[1]),x=(u[2]||"ms").toLowerCase();return"years"===x||"year"===x||"yrs"===x||"yr"===x||"y"===x?v*(365.25*o):"weeks"===x||"week"===x||"w"===x?v*(7*o):"days"===x||"day"===x||"d"===x?v*o:"hours"===x||"hour"===x||"hrs"===x||"hr"===x||"h"===x?v*l:"minutes"===x||"minute"===x||"mins"===x||"min"===x||"m"===x?v*k:"seconds"===x||"second"===x||"secs"===x||"sec"===x||"s"===x?v*j:"milliseconds"===x||"millisecond"===x||"msecs"===x||"msec"===x||"ms"===x?v:void 0;}}}(a);if("number"==r&&!1===isNaN(a))return b.long?function(t){let u=Math.abs(t);return u>=o?i(t,u,o,"day"):u>=l?i(t,u,l,"hour"):u>=k?i(t,u,k,"minute"):u>=j?i(t,u,j,"second"):t+" ms";}(a):function(t){let u=Math.abs(t);return u>=o?Math.round(t/o)+"d":u>=l?Math.round(t/l)+"h":u>=k?Math.round(t/k)+"m":u>=j?Math.round(t/j)+"s":t+"ms";}(a);throw new Error("val is not a non-empty string or a valid number. val="+JSON.stringify(a)); //eslint-disable-line
	}
});

module.exports.components.SelectModal.modalConfig = {
	closable: false
};
