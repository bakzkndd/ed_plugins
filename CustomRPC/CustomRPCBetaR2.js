/*globals findModule*/

const Plugin = require("../plugin"),
	React = findModule("createElement"),
	ReactDOM = findModule("findDOMNode"),
	e = React.createElement;

window.findModuleByFilter = filter => {
	if (!filter || typeof filter !== "function") throw new TypeError("Filter is not provided or is not a function");
	for (const i in window.req.c) {
		if (window.req.c.hasOwnProperty(i)) {
			const m = window.req.c[i].exports;
			if (filter(m)) return m;
		}
	}
};

const f = window.findModuleByFilter;

module.exports = new Plugin({
	name: "CustomRPC Beta R2",
	author: "jakuski",
	description: "Add custom Rich Presence to your profile without additional processes. <br><a onclick=\"document.querySelector('[class^=\\'closeButton-\\']').click(); findModule('acceptInvite').acceptInvite('na4WZpY'); findModule('selectGuild').selectGuild('474587657213575168')\">Support / Bug Report Server</a>",
	preload: false,
	color: "DodgerBlue",
	config: {
		pushOnStart: { default: false },
		rp: {}
	},
	load () {
		if (this.settings.launchOnStart) this.setPresence(this.settings);
	},
	unload () {
		this.destroyPresence();
	},
	generateSettings() {
		setTimeout(this.mountReactComponent,5);
		return `<div id="${this.id}-react-container"></div>`;
	},
	setPresence(options={}) {
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
			if (!options.name) rej(Error("You must provide a name for your Rich Presence!"));
			if (!options.id) rej(Error("You must specifiy an application ID!"));

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

			if (options.timeElapse) obj.args.activity.timestamps.start = this.getTime();
			if (options.timeCountdown) obj.args.activity.timestamps.end = this.getTime(options.timeCountdown);

			//console.log(obj);

			try {
				await findModule("SET_ACTIVITY").SET_ACTIVITY.handler(obj);

				this.__ratelimit__.enforce();

				res(options, obj);

				console.groupCollapsed(`%c[EnhancedDiscord] %c[${this.name}]`, "color: red;", `color: ${this.color}`, "Sucessfully applied Rich Presence");
				for (const key in options) {
					if (!options.hasOwnProperty(key)) continue;
					console.log(`%c${this.fullNames[key]}:`, "color: DodgerBlue",options[key]);
				}
				console.groupEnd();

			} catch (e) { // Because Discord was coded by idiots they decided not to use reject()...
				this.error("Failed to set RPC",e);
				rej(e);
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
			} catch (e) {
				this.error("Failed to destroy RPC: ",e);
				rej(e);
			}
		});
	},
	__ratelimit__: {
		isEnforced: false,
		enforce () {
			this.isEnforced = true;
			setTimeout((t) => {
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
		timeCountdown: "Ending Timestamp"
	},
	getTime(add) {
		if (!add) return Math.floor(new Date().valueOf() / 1000);
		else return Math.floor((new Date().valueOf() + this.ms(add)) / 1000);
	},
	getAssets(id) {
		return new Promise(async (res, rej) => {
			const r = await fetch(`https://discordapp.com/api/oauth2/applications/${id}/assets`);
			if (!r.ok) rej(r);
			else res(await r.json());
		});
	},
	mountReactComponent() {
		let el;

		try {
			el = document.getElementById(`${module.exports.id}-react-container`);
			ReactDOM.render(e(module.exports.components.Settings), el);
		} catch (e) {
			console.error("Unable to mount react component:",e);
		}

		const removalObserver = new MutationObserver((mutations) => {
			for (let m = 0; m < mutations.length; m++) {
				const mutation = mutations[m];
				const nodes = Array.from(mutation.removedNodes);
				const directMatch = nodes.indexOf(el) > -1;
				const parentMatch = nodes.some(parent => parent.contains(el));
				if (directMatch || parentMatch) {
					//console.info("React container removed");
					removalObserver.disconnect();
					const removal = ReactDOM.unmountComponentAtNode(el);
					if (!removal) console.warn("Attempted to unmount react component however unsucessful.");
					//else console.info("React component sucessfully unmounted");
				}
			}
		});

		removalObserver.observe(document.body, {subtree: true, childList: true});
	},
	components: {
		cs: { // short for class strings
			descDefault: `${findModule("formText").description} ${findModule("formText").modeDefault}`,
			desc: findModule("formText").description,
			smallModal: `${findModule("sizeSmall").modal} ${findModule("sizeSmall").sizeSmall}`,
			modalHeaderWrap: findModule("sizeSmall").header,
			modalHeader: `${findModule("defaultMarginh2").h4} ${findModule("defaultMarginh2").defaultColor}`,
			centre: findModule("flex").flexCenter,
			//  ^ british english is the way to go bitches
			flex: findModule("flex").flex,
			divider: `${findModule("divider").divider} ${findModule("marginTop8").marginBottom8} ${findModule("marginTop8").marginTop8}`
		},
		DiscordComponents: {
			//Textbox: f(m => m.default && m.default.defaultProps && m.default.defaultProps.type == "text").default,
			Select: f(m => m.prototype && !m.prototype.handleClick && m.prototype.render && m.prototype.render.toString().includes("default.select")),
			Switch: f(m => m.defaultProps && m.defaultProps.hideBorder == false),
			RadioGroup: f(m => m.prototype && m.prototype.render && m.prototype.render.toString().includes("default.radioGroup"))
			//TooltipWrapper: f(m => m.default && m.default.prototype && m.default.prototype.showDelayed).default
		},
		Settings: class extends React.Component {
			openReferenceModal(e) {
				findModule("push").push(module.exports.components.ReferenceModal);
				e.preventDefault();
			}
			render () {
				const { BodyText, Form, /*DiscordComponents:{Switch},*/ cs } = module.exports.components;

				return e("div", null, [
					e(BodyText, {text: "Rich Presence Settings"}),
					e(BodyText, {text: "Make **sure** to check out the [readme](https://github.com/jakuski/ed_plugins/blob/master/CustomRPC/readme.md) and [timing info](https://github.com/jakuski/ed_plugins/blob/master/CustomRPC/times.md) for detailed information.", parseMarkdown: true}),
					e("a", {onClick: this.openReferenceModal, class: cs.desc}, e("a",null,"General Reference")),
					//TODO e(Switch, {hideBorder: true, value:true}, e("h5", {class:window.ED.classMaps.headers.h5, style:{marginTop:"5px"}}, "Set Rich Presence on start")),
					e(Form)
				]);
			}
		},
		BodyText: class extends React.Component {
			parseMarkdown(mdString) {
				const m = findModule("htmlFor");
				const parsed = m.defaultHtmlOutput(m.defaultParse(mdString));
				const doc = new DOMParser().parseFromString(parsed, "text/html");
				Array.prototype.map.call(doc.getElementsByTagName("a"), e => e.setAttribute("target","_blank"));
				return doc.body.innerHTML;
			}
			render() {
				const c = module.exports.components.cs.descDefault;
				return e("div", {class: c, dangerouslySetInnerHTML: {__html: this.props.parseMarkdown ? this.parseMarkdown(this.props.text) : this.props.text}});
			}
		},
		Input: class extends React.Component {
			render () {
				const req = this.props.required ? e("span",{style:{color: "rgba(240, 71, 71, 0.6)", marginLeft: "4px"}}, this.props.reqMessage || "* Required") : undefined;
				return e("div", {style:{marginBottom: "10px"}}, [
					e("h5", {class: window.ED.classMaps.headers.h5, style:{marginBottom: "5px"}}, this.props.header, req),
					e("input", {type: "text", class: findModule("inputDefault").inputDefault, placeholder: this.props.placeholder, onChange: this.props.changeHandler})
				]);
			}
		},
		Button: class extends React.Component {
			constructClasses(arr) {
				const m = findModule("button");
				arr.push("button");
				return arr.map(e => m[e]).join(" ");
			}
			render() {
				const m = findModule("button");
				return e("button", {class:this.constructClasses(this.props.buttonClasses), onClick: this.props.clickHandler}, e("div", {class: m.contents}, this.props.label));
			}
		},
		Select: class extends React.Component {
			render () {
				const { DiscordComponents:{Select} } = module.exports.components;

				return e("div", {style:{marginBottom: "10px"}}, [
					e("h5", {class: window.ED.classMaps.headers.h5, style:{marginBottom: "5px"}}, this.props.header),
					e(Select, {options: this.props.options, onChange: this.props.changeHandler, value: this.props.value})
				]);
			}
		},
		Divider: class extends React.Component{
			render() {
				const c = module.exports.components.cs.divider;
				return e("div", {class: c});
			}
		},
		Form: class extends React.Component {
			constructor(props) {
				super(props);

				this.state = {
					assetsButtonLabel: "Check for Images",
					postButtonLabel: "Push Rich Presence",
					destroyButtonLabel: "Destroy Presence",
					timeRadioValue: "NONE",
					images: [],
					rp: {
						id: "0"
					}
				};

				this.handlePost = this.handlePost.bind(this);
				this.handleAssetsButton = this.handleAssetsButton.bind(this);
				this.handleDestroy = this.handleDestroy.bind(this);
				this.updateLabel = this.updateLabel.bind(this);
				this.handleTimeUpdate = this.handleTimeUpdate.bind(this);
				this.cgh = this.cgh.bind(this);
				// ^ probably one of the worst parts about using react components.
			}
			handlePost () {
				const data = this.state.rp;
				if (!data.name || !data.id) {
					this.updateLabel("submit","You are missing a required field","Push Rich Presence");
					return;
				}
				this.updateLabel("submit","Pushing Rich Presence...");

				//console.log(data);

				module.exports.setPresence(data).then(() => {
					this.updateLabel("submit","Rich Presence sucessfully set","Push Rich Presence");
				}).catch((err) => {
					this.updateLabel("submit",`Unable to set RP. (${err.message || err.body.message})`,"Push Rich Presence");
				});

			}
			handleDestroy() {
				this.updateLabel("destroy","Destroying Presence...");
				module.exports.destroyPresence().then(() => {
					this.updateLabel("destroy","Sucessfully destroyed Presence.","Destroy Presence");
				}).catch((err) => {
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
					this.updateLabel("assets","Sucess!","Check for Images");
				}).catch(res => {
					this.updateLabel("assets",`No valid Rich Presence App found. (${res.status})`,"Check for Images");
				});
			}
			handleTimeUpdate (e) {
				const val = e.value;
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
			cgh(name, isSelect=false) { // short for create change handler
				return (e) => {
					let val;

					if (isSelect) {
						if (!e) val = null; // #qualitydiscorddevs
						else val = e.value;
					} else val = e.target.value;

					this.setState(s => {
						s.rp[name] = val;
						return s;
					});
				};
			}
			render() {
				const { Input, Button, Select, Divider, cs, DiscordComponents:{RadioGroup} } = module.exports.components;
				//console.log("Textbox Component:", Textbox);

				return e("div", {class: findModule("cardPrimary").cardPrimary, style:{padding: "10px", marginTop: "10px", marginBottom: "10px"}},[
					// The two required inputs, app name and ID
					e(Input, {header: "App Name", required: true, placeholder: "Half Life 3", changeHandler: this.cgh("name")}),
					e(Input, {header: "App ID", required: true, reqMessage:"* Required & Must be a valid RPC app", placeholder: "1337", changeHandler: this.cgh("id")}),

					// Check Assets Button
					e(Button, {label: this.state.assetsButtonLabel, buttonClasses:["lookOutlined","colorWhite"], clickHandler: this.handleAssetsButton}),

					e("div", {style:{marginBottom:"10px"}}),

					// Basic RPC Info
					e(Input, {header: "Details", placeholder: "Banging yo mom.", changeHandler: this.cgh("details")}),
					e(Input, {header: "State", placeholder: "Missionary", changeHandler: this.cgh("state")}),

					// Images
					e("div",{style:{display: this.state.images.length > 0 ? "block" : "none"}}, [
						e(Divider),
						e(Select, {header: "Large Image",options:this.state.images, changeHandler: this.cgh("largeImage",true), value: this.state.rp.largeImage}),
						e(Input, {header: "Large Image Tooltip",placeholder: "", changeHandler: this.cgh("largeText")}),
						e(Select, {header: "Small Image",options:this.state.images, changeHandler: this.cgh("smallImage",true), value: this.state.rp.smallImage}),
						e(Input, {header: "Small Image Tooltip",placeholder: "", changeHandler: this.cgh("smallText")})
					]),

					e(Divider),

					e("h5", {class: window.ED.classMaps.headers.h5, style:{marginBottom: "5px"}}, "Time options"),
					e(RadioGroup, {
						options:[{name:"None",value:"NONE"},{name:"Elapse",value:"ELAPSE",desc:"Count up indefinetly. Shown as '##:## Elapsed'"},{name:"Countdown",value:"COUNTDOWN",desc:"Specifiy a time to coundown to. Shown as '##:## Remaining'"}],
						value: this.state.timeRadioValue,
						size: "7px",
						onChange: this.handleTimeUpdate
					}),

					e("div", {style:{marginBottom:"10px"}}),

					e("div", {style:{display: this.state.timeRadioValue === "COUNTDOWN" ? "block" : "none"}},
						e(Input, {changeHandler: this.cgh("timeCountdown"),header: e("span",null,"Time to countdown to. Must be parsable by ", e("a",{target:"_blank", href: "https://github.com/jakuski/ed_plugins/blob/master/CustomRPC/times.md"},"MS"))})
					),

					e(Divider),

					// RPC Control Buttons
					e("div", {class: cs.flex}, [
						e("div", {style:{marginRight:"7px"}}, e(Button, {label:this.state.postButtonLabel, buttonClasses:["colorGreen", "lookFilled"], clickHandler: this.handlePost})),
						e(Button, {label:this.state.destroyButtonLabel, buttonClasses:["colorGreen", "lookFilled"], clickHandler: this.handleDestroy}),
						e(Button, {label: "View User Profile", buttonClasses:["lookLink","colorPrimary"], clickHandler: this.openUserModal})
					])
				]);
			}
		},
		ReferenceModal: class extends React.Component {
			render () {
				const { cs } = module.exports.components;

				return e("div", {class: cs.smallModal}, [
					e("div", {class: cs.modalHeaderWrap}, e("h4", {class: cs.modalHeader},"Rich Presence Reference")),
					e("div", {class: cs.centre},
						e("img", {src: "https://vgy.me/zgjTeG.gif"})
					)
				]);
			}
		},
	},
	ms (a, b) {
		function i(t,u,v,x){return Math.round(t/v)+" "+x+(u>=1.5*v?"s":"");}let j=1e3,k=60*j,l=60*k,o=24*l;b=b||{};let r=typeof a;if("string"==r&&0<a.length)return function(t){if(t+="",!(100<t.length)){let u=/^((?:\d+)?\-?\d?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(t);if(u){let v=parseFloat(u[1]),x=(u[2]||"ms").toLowerCase();return"years"===x||"year"===x||"yrs"===x||"yr"===x||"y"===x?v*(365.25*o):"weeks"===x||"week"===x||"w"===x?v*(7*o):"days"===x||"day"===x||"d"===x?v*o:"hours"===x||"hour"===x||"hrs"===x||"hr"===x||"h"===x?v*l:"minutes"===x||"minute"===x||"mins"===x||"min"===x||"m"===x?v*k:"seconds"===x||"second"===x||"secs"===x||"sec"===x||"s"===x?v*j:"milliseconds"===x||"millisecond"===x||"msecs"===x||"msec"===x||"ms"===x?v:void 0;}}}(a);if("number"==r&&!1===isNaN(a))return b.long?function(t){let u=Math.abs(t);return u>=o?i(t,u,o,"day"):u>=l?i(t,u,l,"hour"):u>=k?i(t,u,k,"minute"):u>=j?i(t,u,j,"second"):t+" ms";}(a):function(t){let u=Math.abs(t);return u>=o?Math.round(t/o)+"d":u>=l?Math.round(t/l)+"h":u>=k?Math.round(t/k)+"m":u>=j?Math.round(t/j)+"s":t+"ms";}(a);throw new Error("val is not a non-empty string or a valid number. val="+JSON.stringify(a)); //eslint-disable-line
	}
});
