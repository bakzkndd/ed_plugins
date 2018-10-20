# Beta Plugin
This plugin is in the beta phase and not all features are completed. The following is on the todo list before its final release:
- Saving settings
- More friendly errors (don't just chuck them in button labels)
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

### `App Name`
This can be anything, it can be the name of your favourite game or something stupid. It does **not** have to be the name of the app the `App ID` is associated to.
### Validation
| Required | Type | Min. Length | Max. Length |
| -------- | ---- | :-----------: | :-----------: |
| True | String | 2 | 32 |

---

### `App ID`
In order you to be able to get images on your RPC, (what is RPC without images, amirite?) you must provide a ID. You can use [any App's ID](https://vgy.me/FQEft6.png) you wish. Upon entering a app's [`Client ID`](https://vgy.me/YDtGYH.png), you can hit the `Check for Images` button which will fetch the list of assets that are available from that ID. If the app has not enabled RPC then you will recieve the `No RPC app was found for this ID` error. If the app has enabled RPC but has no images, you will get a `Valid RPC app with no images` output. 
### Validation
| Required | Type | Min. Length | Max. Length |
| -------- | ---- | ----------- | ----------- |
| True | Number | *Unknown* | *Unknown* |

---

### `Details`
*Highlighted in red* <br>
![Details preview](https://vgy.me/QVO2Vh.png)
### Validation
| Required | Type | Min. Length | Max. Length |
| -------- | ---- | :-----------: | :-----------: |
| False | String | 2 | 128 |

---

### `State`
*Highlighted in green* <br>
![State preview](https://vgy.me/6OCdYt.png)
### Validation
| Required | Type | Min. Length | Max. Length |
| -------- | ---- | :-----------: | :-----------: |
| False | String | 2 | 128 |

---
