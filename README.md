# raf-stats

#### Request Animation Frame performance monitor written in JavaScript using HTML5 Canvas

It will provide you an information box with statistisc. This will help you to monitor performance of you site based on `requestAnimationFrame` feature.

### Statistics

By default 4 different views/modes are embedded in this app. It should be easy to create a new custom views.

* **FPS monitor**   
  Displays current FPS, ▲highest value, ▼lowest value and ★average value.   
  ![FPS chart](http://msrch.github.io/raf-stats/imgs/monitor-view-fps.png)
* **MS monitor**   
  Displays current MS, ▲highest value, ▼lowest value and ★average value.   
  ![MS chart](http://msrch.github.io/raf-stats/imgs/monitor-view-ms.png)
* **FPS and MS split monitor**   
  Displays current FPS and MS and ★average values.   
  ![All chart](http://msrch.github.io/raf-stats/imgs/monitor-view-all.png)
* **Simple FPS and MS split overview**   
  Displays current FPS and MS and ★average values.   
  ![Simple chart](http://msrch.github.io/raf-stats/imgs/monitor-view-simple.png)

### Usage

You can include this script as a part of your page or you can "bookmark it" so you can run it on any site you want.

Add following code as a `URL` to your new bookmark.
```javascript
javascript:(function(){var script=document.createElement('script');script.src='https://raw.github.com/msrch/raf-stats/master/build/raf-stats.min.js';document.body.appendChild(script);}());
```

Or you can drag and drop a link from this [site](http://msrch.github.io/raf-stats/) directly to your favourites bar.

### Actions

You can run this app on desktop and also on portable devices – supports touch. There are following actions/gestures:

* **Click or touch**   
  Change to next mode/view.
* **Swipe or drag horizontally**   
  Toggle position between top-right and top-left corner of the screen.
* **Swipe or drag vertically**   
  Reset the statistics.

### API

App exists as `RAFstats` object in the global space. You can call following methods:

* **.destroy()**   
  Reset all statistics and remove the monitor from the DOM.
* **.init()**   
  Initialise the app – add canvas to the DOM and start monitoring.
* **.nextView()**   
  Switch to the next mode. It will loop through the available views.
* **.reset()**   
  Reset all statistics (keep monitoring running).
* **.toggleSides()**   
  Toggle canvas position between top-right and top-left corner.

### Notes

This app requires `canvas` and `requestAnimationFrame` support to work. Tested on latest Chrome, Firefox and iOS6.