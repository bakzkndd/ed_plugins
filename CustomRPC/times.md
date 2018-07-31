# Settings times in Custom RPC

Custom RPC uses the [ms](https://www.npmjs.com/package/ms) node module to convert human readable times to programatically useful data.

## Elapsing time:
With Custom RPC, setting time to elapse is as easy as simply ticking the elapse time checkbox and the time on your RPC will elapse.

**Note**: If you provide a time to countdown to; the countdown will override any elapsing time. Do not use both at the same time.

## Counting down time:
Examples of parsable data: <br>
```js
'2 days'    =>   172800000
'1d'        =>   86400000
'10h'       =>   36000000
'2.5 hrs'   =>   9000000
'2h'        =>   7200000
'1m'        =>   60000
'5s'        =>   5000
'1y'        =>   31557600000
```
Only the formats above are available to enter. Any invalid inputs will be presented with an error.
