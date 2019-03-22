/* eslint-disable indent */
const Plugin = require("../plugin");
const {
	React,
	React: {
		createElement: e
	},
	findModuleByDisplayName
} = EDApi;

module.exports = new Plugin({
	name: "View Raw",
	author: "jakuski",
	description: "View the raw markdown of a message.",
	color: "purple",
	load() {
		const Button = findModule("ButtonSizes").default;
		const className = EDApi.findModule(m => m.button && m.item).item;

		monkeyPatch(findModule("MessageOptionPopout").MessageOptionPopout.prototype, "render", data => {
			const render = data.callOriginalMethod();
			render.props.children.push(e(
				Button, {
					look: Button.Looks.BLANK,
					size: Button.Sizes.NONE,
					onClick: () => this.openModal(data.thisObject.props),
					className,
					role: "menuitem"
				},
				"View Raw"
			));
			return render;
		});
	},
	unload() {
		findModule("MessageOptionPopout").MessageOptionPopout.prototype.render.unpatch();
	},
	openModal(t) {
		t.onClose();
		findModule("push").push(this.RawMessageModal, {
			data: t.message
		});
	},
	RawMessageModal: class extends React.PureComponent {
		constructor(props) {
			super(props);

			this.state = {
				copyButtonLabel: "Copy"
			};

			this.copy = this.copy.bind(this);
		}
		copy() {
			DiscordNative.clipboard.copy(this.props.data.content);

			this.setState({
				copyButtonLabel: "Copied!"
			});
			setTimeout(t => t.setState({
				copyButtonLabel: "Copy"
			}), 1500, this);
		}
		render() {
			const Modal = findModule("CloseButton");
			const Title = findModuleByDisplayName("FormTitle");
			const {
				CodeBlock,
				Button
			} = module.exports;

			return e(Modal, {
					style: {
						width: "720px"
					},
					className: "viewraw-modal"
				},
				e(Modal.Header, null,
					e(Title, {
						tag: "h4"
					}, "Raw Message"),
					e(Modal.CloseButton, {
						onClick: this.props.onClose
					})
				),
				e(Modal.Content, null,
					e(Title, null, "Viewing raw message of ", this.props.data.author.username),
					e(CodeBlock, {
						code: this.props.data.content
					}),
					e("div", {
						style: {
							marginBottom: "15px"
						}
					})
				),
				e(Modal.Footer, null,
					e(Button, {
						color: "brand",
						size: "medium",
						look: "filled",
						grow: true,
						onClick: this.copy
					}, this.state.copyButtonLabel)
				)
			);
		}
	},
	CodeBlock: class extends React.PureComponent {
		getClassNames() {
			return {
				container: findModule("headerCozyMeta").container,
				markup: findModule("markup").markup,
				code: `${findModule("scrollbarGhost").scrollbar} ${findModule("scrollbarGhost").scrollbarGhost} hljs`
			};
		}
		render() {
			const cNames = this.getClassNames();

			return e("div", {
					className: cNames.container,
					style: {
						margin: "0"
					}
				},
				e("div", {
						className: cNames.markup
					},
					e("pre", null,
						e("code", {
							className: cNames.code
						}, this.props.code)
					)
				)
			);
		}
	},
	Button: class extends React.PureComponent {
		constructor(props) {
			super(props);

			this.buttonModule = findModule("ButtonLooks");
			this.cssModule = findModule("button");
			this.constructClasses = this.constructClasses.bind(this);
		}
		constructClasses() {
			const ok = ["className", "grow", "look", "size", "hover", "color"];
			const xd = Object.keys(this.props).filter(thing => ok.includes(thing)).map(thing => {
				const prop = thing.toLowerCase();
				switch (prop) {
					case "look":
						return this.buttonModule.ButtonLooks[this.props[thing].toUpperCase()];
					case "size":
						return this.buttonModule.ButtonSizes[this.props[thing].toUpperCase()];
					case "color":
						return this.buttonModule.ButtonColors[this.props[thing].toUpperCase()];
					case "hover":
						return this.buttonModule.ButtonHovers[this.props[thing].toUpperCase()];
				}
			});

			const arr = [...xd];
			arr.push(this.cssModule.button);

			if (this.props.grow === true) arr.push(this.cssModule.grow);
			if (this.props.className) arr.push(this.props.className);

			return arr.join(" ");
		}
		render() {
			return e(
				"button",
				Object.assign({}, this.props.buttonProps, {
					className: this.constructClasses(),
					disabled: this.props.disabled,
					onClick: this.props.onClick
				}),
				e(
					"div",
					Object.assign({}, this.props.contentsProps, {
						className: this.cssModule.contents
					}),
					this.props.children
				)
			);
		}
	}
});