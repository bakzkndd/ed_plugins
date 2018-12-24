const Plugin = require("../plugin");

const funcArray = [
	"isMP",
	"createArgumentListener",
	"removeArgumentListener",
	"perfWrap",
	"findCSSModule"
];

const col = {
	blue: "#3fa5c3",
	red: "#D42A5A",
	green: "#5AD42A",
	pink: "#D42AAF"
};

let lastArgListener;

const log = msg => console.log(`%c[PluginDev] ${msg}`, "color:"+col.blue);
log.ac = (funcName, msg) => console.log(`%c[PluginDev] [captureArgs] [${funcName}] ${msg}`, "color:"+col.blue);

module.exports = new Plugin({
	name: "Plugin Dev",
	description: "A plugin which adds a few global functions to ease development of your own plugins.",
	color: "#3fa5c3",
	load () {

		//
		// Check if a module is monkeyPatched
		// Use the same way as findModule
		// e.g.: isMP('sendMessage') will check findModule('sendMessage').sendMessage
		// e.g.: isMP('sendMessage','deleteMessage') will check findModule('sendMessage').deleteMessage
		//

		window.isMP = (Module, func) => {
			if (!func) func = Module;
			if (findModule(Module)[func].__monkeyPatched === true) return true;
			else return false;
		};

		//
		// Capture args
		// Monkey patch a module and log its arguments when its fired by the client.
		// e.g.: captureArgs('sendMessage', 'sendMessage') will be identical to monkeyPatch( findModule('sendMessage'), 'sendMessage', <loggerMagic>)
		// This also supports the 1 arg method (demonstrated in the isMonkeyPatched comments)
		//

		window.createArgumentListener = (Module, func) => {
			if (!func) func = Module;
			const foundModule = findModule(Module, true);
			if (!foundModule) return console.log(`%c[PluginDev] [argumentListener] Unable to find module ${Module}`, "color:"+col.red);
			if (window.isMP(Module, func)) return log.ac(`Module ${Module} is already monkeyPatched. Aborting...`);
			const thiss = {mod: Module, func: func};
			lastArgListener = thiss;
			monkeyPatch( foundModule, func, function () {
				const info = thiss;
				this.__argumentListener = true;
				const args = arguments[0].methodArguments;
				console.groupCollapsed(`%c[PluginDev] [argumentListener] [${info.mod} - ${info.func}] Function has been fired by the client, view arguments below.`, "color:"+col.blue);
				let argnumb = 1;
				for (const arg of args) {
					console.log(`%cArgument ${argnumb}:`,"color:"+col.pink, arg);
					argnumb++;
				}
				console.groupEnd();

				arguments[0].callOriginalMethod(...args);
			});

			console.log(`%c[PluginDev] [argumentListener] [${thiss.mod} - ${thiss.func}] Argument listener created.`, "color:"+col.green);
		};

		window.removeArgumentListener = (Module, func) => {
			if (!Module) {
				if (!lastArgListener) return console.log("%c[PluginDev] [removeArgumentListener] Unable to remove last argument listener because none have been made.", "color:"+col.red);
			}
		};

		window.perfWrap = (Module, func) => {
			monkeyPatch(Module, func, ({callOriginalMethod: method}) => {
				const t0 = performance.now();
				const data = method();
				const t1 = performance.now();

				console.log(`Took ${(t1 - t0).toFixed(4)} milliseconds to fire ${method.name}`);
				return data;
			});
		};

		window.findCSSModule = className => {
			return EDApi.findAllModules(m => {
				if (typeof m !== "object" || m.constructor === window.constructor) return;
				const res = Object.values(m).find(c => c === className);
				if (res) return res;
			});
		};

		window.findCSSModuleRe = className => {
			const re = new RegExp(_.escapeRegExp(className));
			return EDApi.findAllModules(m => {
				if (typeof m !== "object" || m.constructor === window.constructor) return;
				const res = Object.values(m).find(c => {
					if (typeof c !== "string") return;
					return re.test(c);
				});
				if (res) return res;
			});
		}
	},
	unload () {
		for (const func of funcArray) {
			delete window[func];
		}
	}
});