# Tagr - Create your own tags!
### Example:
![Example](https://vgy.me/B6m4YU.png)
### How 2 Use

The plugin generates a JSON config file located within your plugins directory where it stores the plugin's settings called `_tagr_config.json`.

Inside are 3 main properties, `prefix`, `suffix`, and `tags`. Assuming you know english, you should know what each of these do. Incase you don't here's how they work:
#### `prefix`:
When using a tag, your tag "identifier" must be after this, e.g. with the default config `/hello` is a working tag, because its prefixed with `/` which is the default prefix
#### `suffix`:
When using a tag, your tag "identifier" must be before this, with the default config, there is no suffix supplied, however if you were to set it to something like `\`, `/hello` would no longer work but `/hello\` would.
#### `tags`:
These are your actual tags, the key (text prior to the semicolon) is your identifier and is what will call your tag, the contents after, is the text that prefix + suffix + key will be replaced with.

## I added new tags but they aren't working!
Reload discord.
## Helpo i got unexpected token error
<sup>**cause:** you're an idiot and don't know how to write JSON

*Example config*
```json
{
  "prefix":"@",
  "suffix":"",
  "tags": {
    "b1nzy": "<@80351110224678912>"
  }
}
```
Basic rules of json:
- Any values prior to the last value must end with a comma `,`
- Strings (text) must always be within quotes, either `""` or `''`
- Only exceptions to the rule above are booleans, arrays and objects but you won't be needing those here.
