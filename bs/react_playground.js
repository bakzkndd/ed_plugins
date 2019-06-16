/* eslint-disable indent */
const Plugin = require("../plugin");
const {
	React,
	ReactDOM,
	React: {
		createElement: e
	},
	findModuleByDisplayName
} = EDApi;

module.exports = new Plugin({
	name: "React Playground",
	author: "jakuski",
	description: "View the raw markdown of a message.",
	color: "purple",
	config: {},
	load() {},
	unload() {},
	PlaygroundComponent: class extends React.Component {
		constructor(props) {
			super(props);

			this.getRandomQuote = this.getRandomQuote.bind(this);
			this.updateQuote = this.updateQuote.bind(this);
			this.updateCard = this.updateCard.bind(this);

			this.state = {
				quote: this.getRandomQuote(),
				cardType: "cardPrimary"
			}
		}
		getRandomQuote() {
			const quoteArr = this.props.quotes;
			return quoteArr[Math.floor(Math.random() * quoteArr.length)];
		}
		updateQuote() {
			this.setState({
				quote: this.getRandomQuote()
			})
		}
		getRandomCardType() {
			const arr = Object.values(module.exports.DiscordComponents.Card.Types)
			return arr[Math.floor(Math.random() * arr.length)];
		}
		updateCard() {
			this.setState({
				cardType: this.getRandomCardType()
			})
		}
		render() {
			const {
				DiscordComponents,
				Button
			} = module.exports;


			return e(DiscordComponents.Card, {
				type: this.state.cardType,
				body: [ // this is really poorly done by discord and the body should be taken as children and not props. THIS IS NOT A EXAMPLE OF GOOD REACT. NOR IS ANY PART OF DISCORD.
					e("pre", {
							style: {
								whiteSpace: "pre-wrap"
							}
						},
						"React is working !",
						e("div", {
							style: {
								marginBottom: "10px"
							}
						}),
						this.state.quote,
						e("div", {
							style: {
								marginBottom: "10px"
							}
						}),
						e(DiscordComponents.Flex, null,
							e(Button, {
								grow: true,
								look: "filled",
								color: "brand",
								size: "small",
								onClick: this.updateQuote
							}, "Change Quote"),
							e("div", {
								style: {
									marginRight: "5px"
								}
							}),
							e(Button, {
								grow: true,
								look: "filled",
								color: "brand",
								size: "small",
								onClick: this.updateCard
							}, "Change Card Look")
						))
				]
			})
		}
	},
	// just a list of components you can fuck with
	DiscordComponents: {
		Textbox: EDApi.findModuleByDisplayName("TextInput"),
		Select: EDApi.findModuleByDisplayName("SelectTempWrapper"),
		Switch: EDApi.findModuleByDisplayName("SwitchItem"),
		RadioGroup: EDApi.findModuleByDisplayName("RadioGroup"),
		Divider: EDApi.findModuleByDisplayName("FormDivider"),
		Title: EDApi.findModuleByDisplayName("FormTitle"),
		Text: EDApi.findModuleByDisplayName("FormText"),
		Icon: EDApi.findModuleByDisplayName("Icon"),
		LoadingSpinner: EDApi.findModuleByDisplayName("Spinner"),
		Card: EDApi.findModuleByDisplayName("FormNotice"),
		Flex: EDApi.findModuleByDisplayName("Flex")
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
	},
	mountReactComponent() {
		let el;

		try {
			el = document.getElementById(`${module.exports.id || "react-playground"}-react-container`);
			ReactDOM.render(e(module.exports.PlaygroundComponent, {
				quotes: [
					// https://www.goodreads.com/quotes -> JSON.stringify(Array.from(document.querySelector(".quotes").querySelectorAll(".quote")).map(el => el.querySelector(".quoteText").innerText), null, 4)
					"“Don't cry because it's over, smile because it happened.”\n― Dr. Seuss",
					"“I'm selfish, impatient and a little insecure. I make mistakes, I am out of control and at times hard to handle. But if you can't handle me at my worst, then you sure as hell don't deserve me at my best.”\n― Marilyn Monroe",
					"“Be yourself; everyone else is already taken.”\n― Oscar Wilde",
					"“Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.”\n― Albert Einstein",
					"“So many books, so little time.”\n― Frank Zappa",
					"“Be who you are and say what you feel, because those who mind don't matter, and those who matter don't mind.”\n― Bernard M. Baruch",
					"“A room without books is like a body without a soul.”\n― Marcus Tullius Cicero",
					"“You've gotta dance like there's nobody watching,\nLove like you'll never be hurt,\nSing like there's nobody listening,\nAnd live like it's heaven on earth.”\n― William W. Purkey",
					"“You know you're in love when you can't fall asleep because reality is finally better than your dreams.”\n― Dr. Seuss",
					"“You only live once, but if you do it right, once is enough.”\n― Mae West",
					"“Be the change that you wish to see in the world.”\n― Mahatma Gandhi",
					"“In three words I can sum up everything I've learned about life: it goes on.”\n― Robert Frost",
					"“If you want to know what a man's like, take a good look at how he treats his inferiors, not his equals.”\n― J.K. Rowling, Harry Potter and the Goblet of Fire",
					"“Don’t walk in front of me… I may not follow\nDon’t walk behind me… I may not lead\nWalk beside me… just be my friend”\n― Albert Camus",
					"“No one can make you feel inferior without your consent.”\n― Eleanor Roosevelt, This is My Story",
					"“Friendship ... is born at the moment when one man says to another \"What! You too? I thought that no one but myself . . .”\n― C.S. Lewis, The Four Loves",
					"“If you tell the truth, you don't have to remember anything.”\n― Mark Twain",
					"“A friend is someone who knows all about you and still loves you.”\n― Elbert Hubbard",
					"“I've learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.”\n― Maya Angelou",
					"“Always forgive your enemies; nothing annoys them so much.”\n― Oscar Wilde",
					"“To live is the rarest thing in the world. Most people exist, that is all.”\n― Oscar Wilde",
					"“Live as if you were to die tomorrow. Learn as if you were to live forever.”\n― Mahatma Gandhi",
					"“Darkness cannot drive out darkness: only light can do that. Hate cannot drive out hate: only love can do that.”\n― Martin Luther King Jr., A Testament of Hope: The Essential Writings and Speeches",
					"“I am so clever that sometimes I don't understand a single word of what I am saying.”\n― Oscar Wilde, The Happy Prince and Other Stories",
					"“Without music, life would be a mistake.”\n― Friedrich Nietzsche, Twilight of the Idols",
					"“To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.”\n― Ralph Waldo Emerson",
					"“Here's to the crazy ones. The misfits. The rebels. The troublemakers. The round pegs in the square holes. The ones who see things differently. They're not fond of rules. And they have no respect for the status quo. You can quote them, disagree with them, glorify or vilify them. About the only thing you can't do is ignore them. Because they change things. They push the human race forward. And while some may see them as the crazy ones, we see genius. Because the people who are crazy enough to think they can change the world, are the ones who do.”\n― Rob Siltanen",
					"“We accept the love we think we deserve.”\n― Stephen Chbosky, The Perks of Being a Wallflower",
					"“Insanity is doing the same thing, over and over again, but expecting different results.”\n― Narcotics Anonymous",
					"“I believe that everything happens for a reason. People change so that you can learn to let go, things go wrong so that you appreciate them when they're right, you believe lies so you eventually learn to trust no one but yourself, and sometimes good things fall apart so better things can fall together.”\n― Marilyn Monroe"
				]
			}), el);
		} catch (e) {
			console.error("Unable to mount react component:", e);
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
					if (!removal) console.warn("Attempted to unmount react component however unsucessful. ");
				}
			}
		});

		removalObserver.observe(document.body, {
			subtree: true,
			childList: true
		});
	},
	generateSettings() {
		setTimeout(this.mountReactComponent, 5);
		return `<div id="${module.exports.id || "react-playground"}-react-container"></div>`;
	}
});