# Custom RPC

Allows you to push Custom RPC to your profile without additional proccesses running. Example:

![RPC Preview](https://vgy.me/B6m4YU.png)

## Editing the settings
All options for Custom RPC are found within the `EnhancedDiscord > Settings` tab in your settings.
Upon opening, you will get a page looking similar to this:

If you recieve a `Validation Error`, make sure your input matches the settings validation configuration.

### General Reference:

![General Reference](https://vgy.me/wK0ZAx.gif)

## Each setting, explained:

### App Name
This can be anything, it can be the name of your favourite game or something stupid. It does **not** have to be the name of the app the `App ID` is associated to.
#### Validation
| Required | Type | Min. Length | Max. Length |
| -------- | ---- | :-----------: | :-----------: |
| True | String | 2 | 32 |

---

### App ID
In order you to be able to get images on your RPC, (what is RPC without images, amirite?) you must provide a ID. Upon entering a app's [`Client ID`](https://vgy.me/YDtGYH.png), you can hit the `Check for Images` button which will fetch the list of assets that are available from that ID. If the app has not enabled RPC then you will recieve the `Unknown Application` error. If the app has enabled RPC but has no images, you will get a `No images found` output. 
#### Validation
| Required | Type | Min. Length | Max. Length |
| -------- | ---- | ----------- | ----------- |
| True | Number([`Snowflake`](https://discordapp.com/developers/docs/reference#snowflakes)) | 17 | 20 |

---

### Details
Will be displayed as the first line of descriptive text.
#### Validation
| Required | Type | Min. Length | Max. Length |
| -------- | ---- | :-----------: | :-----------: |
| False | String | 2 | 128 |

---

### State
Will be displayed as the second line of descriptive text.
#### Validation
| Required | Type | Min. Length | Max. Length |
| -------- | ---- | :-----------: | :-----------: |
| False | String | 2 | 128 |

---

### Small Image Key
This is your small image.
#### Validation
| Required | Type | Min. Length | Max. Length |
| -------- | ---- | :-----------: | :-----------: |
| False | String | 1 | 128 |

---

### Small Image Tooltip
This will be the tooltip text when other users hover over your small image.
#### Validation
| Required | Type | Min. Length | Max. Length |
| -------- | ---- | :-----------: | :-----------: |
| False | String | 1 | 128 |

---

### Large Image Key
This is your large image.
#### Validation
| Required | Type | Min. Length | Max. Length |
| -------- | ---- | :-----------: | :-----------: |
| False | String | 1 | 128 |

---

### Large Image Tooltip
This will be the tooltip text when other users hover over your large image.
#### Validation
| Required | Type | Min. Length | Max. Length |
| -------- | ---- | :-----------: | :-----------: |
| False | String | 1 | 128 |

---

### Party Size
Will be displayed on the second line as `<State> (<Party Size> of <Party Max>)`
#### Validation
| Required | Type | Min. Length | Max. Length |
| -------- | ---- | :-----------: | :-----------: |
| False | Number | 1 | 4 |

---

### Party Max
Will be displayed on the second line as `<State> (<Party Size> of <Party Max>)`
#### Validation
| Required | Type | Min. Length | Max. Length |
| -------- | ---- | :-----------: | :-----------: |
| False | Number | 1 | 4 |

---

### Ending Timestamp
How long to countdown for. Value must be parsable by [ms](https://github.com/jakuski/ed_plugins/blob/master/CustomRPC/times.md)
#### Validation
| Required | Type | Min. Length | Max. Length |
| -------- | ---- | :-----------: | :-----------: |
| False | String | *none* | *none* |

---

### Elapse Time
If set to true, the time display will elapse from the point the presence is pushed. Overriden if a value for Ending Timestamp is present.
#### Validation
| Required | Type | Min. Length | Max. Length |
| -------- | ---- | :-----------: | :-----------: |
| False | Boolean | ... | ... |

---
<sup><sup><sup>Writing this shit was the most painful experience of my short time on this planet.</sup></sup></sup>