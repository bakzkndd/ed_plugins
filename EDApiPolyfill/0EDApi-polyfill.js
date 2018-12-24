/*globals req*/
const Plugin = require("../plugin");

(() => {
	const appNodeModules = require("path").resolve(require("electron").remote.app.getAppPath(), "node_modules");
	const {globalPaths} = require('module').Module;
	if (!globalPaths.includes(appNodeModules)) globalPaths.push(appNodeModules);

	if (window.EDApi || window.BdApi) return console.warn("Aborting polyfill, EDApi already exists...");

	window.EDApi = window.BdApi = class EDApi {
		static get React() { return this.findModuleByProps("createElement"); }
		static get ReactDOM() { return this.findModuleByProps("findDOMNode"); }

		static escapeID(id) {
			return id.replace(/^[^a-z]+|[^\w-]+/gi, "");
		}

		static injectCSS(id, css) {
			const el = document.createElement("style");
			el.setAttribute("id", this.escapeID(id));
			el.innerHTML = css;
			document.head.appendChild(el);
			return el;
		}

		static clearCSS(id) {
			document.getElementById(this.escapeID(id)).remove();
		}

		static linkJS(id, url) {
			const el = document.createElement("script");
			el.setAttribute("id", this.escapeID(id));
			el.setAttribute("src", url);
			el.setAttribute("type", "text/javascript");
			document.head.appendChild(el);
			return el;
		}

		static unlinkJS(id) {
			document.getElementById(this.escapeID(id)).remove();
		}

		static getPlugin(name) {
			const plugin = Object.values(window.ED.plugins).find(p => p.name == name);
			return plugin || null;
		}

		static alert(title, body) {
			const ModalStack = EDApi.findModuleByProps("push", "update", "pop", "popWithKey");
			const AlertModal = EDApi.findModule(m => m.prototype && m.prototype.handleCancel && m.prototype.handleSubmit && m.prototype.handleMinorConfirm);
			if (!ModalStack || !AlertModal) return window.alert(body);
			ModalStack.push(function(props) {
				return EDApi.React.createElement(AlertModal, Object.assign({title, body}, props));
			});
		}

		static loadData(pluginName, key) {
			if (!window.ED.config[pluginName]) window.ED.config[pluginName] = {};
			return window.ED.config[pluginName][key];
		}

		static saveData(pluginName, key, data) {
			if (!window.ED.config[pluginName]) window.ED.config[pluginName] = {};
			window.ED.config[pluginName][key] = data;
			window.ED.config = window.ED.config;
		}

		static getData(pluginName, key) {
			return EDApi.loadData(pluginName, key);
		}

		static setData(pluginName, key, data) {
			EDApi.saveData(pluginName, key, data);
		}

		static getInternalInstance(node) {
			if (!(node instanceof Element)) return undefined;
			return node[Object.keys(node).find(k => k.startsWith("__reactInternalInstance"))];
		}

		static showToast(content, options = {}) {
			if (!document.querySelector(".toasts")) {
				const toastWrapper = document.createElement("div");
				toastWrapper.classList.add("toasts");
				const boundingElement = document.querySelector(".chat-3bRxxu form, #friends, .noChannel-Z1DQK7, .activityFeed-28jde9");
				toastWrapper.style.setProperty("left", boundingElement ? boundingElement.getBoundingClientRect().left + "px" : "0px");
				toastWrapper.style.setProperty("width", boundingElement ? boundingElement.offsetWidth + "px" : "100%");
				toastWrapper.style.setProperty("bottom", (document.querySelector(".chat-3bRxxu form") ? document.querySelector(".chat-3bRxxu form").offsetHeight : 80) + "px");
				document.querySelector(".app").appendChild(toastWrapper);
			}
			const {type = "", icon = true, timeout = 3000} = options;
			const toastElem = document.createElement("div");
			toastElem.classList.add("toast");
			if (type) toastElem.classList.add("toast-" + type);
			if (type && icon) toastElem.classList.add("icon");
			toastElem.innerText = content;
			document.querySelector(".toasts").appendChild(toastElem);
			setTimeout(() => {
				toastElem.classList.add("closing");
				setTimeout(() => {
					toastElem.remove();
					if (!document.querySelectorAll(".toasts .toast").length) document.querySelector(".toasts").remove();
				}, 300);
			}, timeout);
		}

		static findModule(filter, silent = true) {
			for (const i in req.c) {
				if (req.c.hasOwnProperty(i)) {
					const m = req.c[i].exports;
					if (m && m.__esModule && m.default && filter(m.default)) return m.default;
					if (m && filter(m))	return m;
				}
			}
			if (!silent) console.warn("%c[EnhancedDiscord] %c[Modules]", "color: red;", "color: black", `Could not find module ${module}.`);
			return null;
		}

		static findAllModules(filter) {
			const modules = [];
			for (const i in req.c) {
				if (req.c.hasOwnProperty(i)) {
					const m = req.c[i].exports;
					if (m && m.__esModule && m.default && filter(m.default)) modules.push(m.default);
					else if (m && filter(m)) modules.push(m);
				}
			}
			return modules;
		}

		static findModuleByProps(...props) {
			return EDApi.findModule(module => props.every(prop => module[prop] !== undefined));
		}

		static findModuleByDisplayName(name) {
			return EDApi.findModule(module => module.displayName === name);
		}

		static monkeyPatch(what, methodName, options) {
			const {before, after, instead, once = false, silent = false, force = false} = options;
			const displayName = options.displayName || what.displayName || what.name || what.constructor.displayName || what.constructor.name;
			if (!silent) console.log("patch", methodName, "of", displayName); // eslint-disable-line no-console
			if (!what[methodName]) {
				if (force) what[methodName] = function() {};
				else return console.error(methodName, "does not exist for", displayName); // eslint-disable-line no-console
			}
			const origMethod = what[methodName];
			const cancel = () => {
				if (!silent) console.log("unpatch", methodName, "of", displayName); // eslint-disable-line no-console
				what[methodName] = origMethod;
			};
			what[methodName] = function() {
				const data = {
					thisObject: this,
					methodArguments: arguments,
					cancelPatch: cancel,
					originalMethod: origMethod,
					callOriginalMethod: () => data.returnValue = data.originalMethod.apply(data.thisObject, data.methodArguments)
				};
				if (instead) {
					const tempRet = EDApi.suppressErrors(instead, "`instead` callback of " + what[methodName].displayName)(data);
					if (tempRet !== undefined) data.returnValue = tempRet;
				}
				else {
					if (before) EDApi.suppressErrors(before, "`before` callback of " + what[methodName].displayName)(data);
					data.callOriginalMethod();
					if (after) EDApi.suppressErrors(after, "`after` callback of " + what[methodName].displayName)(data);
				}
				if (once) cancel();
				return data.returnValue;
			};
			what[methodName].__monkeyPatched = true;
			what[methodName].displayName = "patched " + (what[methodName].displayName || methodName);
			what[methodName].unpatch = cancel;
			return cancel;
		}

		static testJSON(data) {
			try {
				JSON.parse(data);
				return true;
			}
			catch (err) {
				return false;
			}
		}

		static suppressErrors(method, description) {
			return (...params) => {
				try { return method(...params);	}
				catch (e) { console.error("Error occurred in " + description, e); }
			};
		}

		static formatString(string, values) {
			for (const val in values) {
				string = string.replace(new RegExp(`\\{\\{${val}\\}\\}`, "g"), values[val]);
			}
			return string;
		}
	};
	console.info("Polyfilled EDApi");
})();

module.exports = new Plugin({
	name: "EDApi Polyfill",
	author: "jakuski",
	description: "Polyfills the new shared BD/ED api from Zere's BD plugin loading PR, this plugin will be rendered useless once that pull request is merged.",
	color: "beige",
	load () {},
	unload () {
		delete window.EDApi;
		delete window.BdApi;
	}
});