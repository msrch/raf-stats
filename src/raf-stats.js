(function (window, document) {
    'use strict';
    
    /**
     * Get requestAnimationFrame function if available.
     * @type {function|boolean}
     */
    var RAF = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || false;

    /**
     * Check if script is already present.
     * @type {object|boolean}
     */
    var old_APP = typeof window.RAFstats !== 'undefined' ? window.RAFstats : false;

    /**
     * Reference for the APP in use - old or this one.
     * (set at the end of the script)
     */
    var active_APP;

    /**
     * Short-hand for microtime.
     * @returns {number} Current date and time in milliseconds
     */
    var NOW = function () {
        return (new Date()).getTime();
    };

    /**
     * Main application object.
     * 
     * Contains main interactive behaviour.
     * API interface set in here.
     */
    var APP = {

        /**
         * Is application initialised - flag.
         * @type {boolean}
         */
        initialised: false,

        /**
         * Check if touch is available.
         * @type {boolean}
         */
        touch_support: ('ontouchstart' in window || 'onmsgesturechange' in window),

        /**
         * Main dimensions settings.
         * @type {object}
         */
        settings: {

            /**
             * Monitor width (in px).
             * @type {number}
             */
            width: 150,

            /**
             * Monitor height (in px).
             * @type {number}
             */
            height: 50
        },

        /**
         * Holds instance of Stats class.
         * @type {null|object}
         */
        stats: null,

        /**
         * Holds instance of Dispaly class.
         * @type {null|object}
         */
        display: null,

        /**
         * Active view id.
         * @type {number}
         */
        view: 0,

        /**
         * List of available views in Display class.
         * @type {array}
         */
        layouts: ['viewFps', 'viewMs', 'viewAll', 'viewSimple'],

        /**
         * Request animation loop function.
         */
        getFrame: function () {
            
            // Add raf callback
            
            RAF(function () {

                // Run only if application is running
                
                if (APP.initialised) {
                    
                    APP.stats.nextFrame();
                    APP.drawLayout();
                    APP.getFrame();
                }
            });
        },

        /**
         * Draw selected view.
         */
        drawLayout: function () {
            
            // View is executed as a function in Display class
            
            APP.display[APP.layouts[APP.view]]();
        },

        /**
         * Interactive behaviour of the application.
         * @type {object}
         */
        behaviour: {

            /**
             * Minimum distance (in px) needed to do swipe gesture.
             * @type {number}
             */
            swipe_diff: 25,

            /**
             * Is swipe gesture - flag.
             * @type {boolean}
             */
            swipe: false,

            /**
             * Action started - flag. 
             * @type {boolean}
             */
            active: false,

            /**
             * Mouse/touch X position at the beginning of the action.
             * @type {number}
             */
            pos_x: 0,

            /**
             * Mouse/touch Y position at the beginning of the action.
             * @type {number}
             */
            pos_y: 0,

            /**
             * Execute action based on the gesture.
             * @param diff_x {number}
             * @param diff_y {number}
             * @param swipe {boolean}
             */
            action: function (diff_x, diff_y, swipe) {
                
                var swipe_diff = APP.behaviour.swipe_diff;
                
                // If swipe add min swipe value - triggers swipe
                
                if (swipe) {
                    diff_x += swipe_diff;
                    diff_y += swipe_diff;
                }
                
                // Check if gesture position difference is swipe
                
                if (diff_x > swipe_diff || diff_y > swipe_diff) {
                    
                    if (diff_x > diff_y) {
                        
                        // Horizontal swipe - toggle monitor position (left-right)
                        
                        APP.api.toggleSides();
                    } else {
                        
                        // Vertical swipe - reset stats
                        
                        APP.api.reset();
                    }
                    
                } else {
                    
                    // If not swipe then trigger click event - display next view
                    
                    APP.api.nextView();
                }
            },

            /**
             * Special event for handling all event types.
             * @param ev {object}
             */
            handleEvent: function (ev) {
                
                var self = APP.behaviour,
                    diff_x,
                    diff_y,
                    pos_x,
                    pos_y,
                    touch;
                
                // Check if event is type of touch or mouse and set coordinate variables
                
                if (ev.type === 'touchstart' || ev.type === 'touchleave' || ev.type === 'touchcancel' || ev.type === 'touchend') {
                    
                    // Get first touch event from touch list
                    
                    touch = ev.touches[0] || ev.changedTouches[0];
                    
                    // Touch event - set coordinate variables
                    
                    pos_x = touch.pageX;
                    pos_y = touch.pageY;
                    
                } else {
                    
                    // Mouse event - set coordinate variables
                    
                    pos_x = ev.clientX;
                    pos_y = ev.clientY;
                }
                
                // Start of the event (all other events are considered as the end in this case)
                
                if (ev.type === 'mousedown' || ev.type === 'touchstart') {
                    
                    // Save start coordinates
                    
                    self.pos_x = pos_x;
                    self.pos_y = pos_y;
                    
                    self.active = true;
                    
                } else {
                    
                    // At event end check if gesture left the monitor element - considered as swipe

                    if (ev.type === 'mouseout' || ev.type === 'touchleave' || ev.type === 'touchcancel') {
                        
                        self.swipe = true;
                    }

                    // Only if gesture is still in progress - calc distance and pass it to process
                    
                    if (self.active) {
                        
                        diff_x = Math.abs(self.pos_x - pos_x);
                        diff_y = Math.abs(self.pos_y - pos_y);
                        self.action(diff_x, diff_y, self.swipe);
                        self.active = false;
                    }
                    
                    self.swipe = false;
                }
                
                ev.stopPropagation();
                ev.preventDefault();
            }
        },

        /**
         * Application API interface.
         * @type {object}
         */
        api: {

            /**
             * Initialise this aplication.
             * @returns {boolean}
             */
            init: function () {

                /**
                 * Event listener short-hand.
                 * Bind event by name to monitor (canvas) element.
                 * Event types are handled by special object APP.behaviour.
                 * @param name
                 */
                var addEvent = function (name) {
                    
                    APP.display.canvas.addEventListener(name, APP.behaviour, false);
                };
                
                if (!APP.initialised) {
                    
                    // Add new Display class (creates canvas etc.)
                    
                    APP.display = new Display(APP.settings.width, APP.settings.height);
                    
                    if (APP.display.supported) {

                        addEvent('mousedown');
                        addEvent('mouseup');
                        addEvent('mouseout');
                        APP.display.canvas.style.cursor = 'pointer';
                        
                        if (APP.touch_support) {

                            addEvent('touchstart');
                            addEvent('touchleave');
                            addEvent('touchcancel');
                            addEvent('touchend');
                        }

                        // Add new Stats object (calculates stats and keep history)
                        
                        APP.stats = new Stats(APP.settings.width);
                        
                        // Set as initialised and start request animation frame loop
                        
                        APP.initialised = true;
                        APP.getFrame();
                        return true;
                    }
                }
                
                return false;
            },

            /**
             * Loops/toggles through different views.
             * @returns {number}
             */
            nextView: function () {

                return APP.view = APP.view + 1 >= APP.layouts.length ? 0 : APP.view + 1;
            },

            /**
             * Toggle position of the monitor/canvas between top-left and top-right.
             * @returns {boolean}
             */
            toggleSides: function () {

                if (APP.initialised) {
                    
                    APP.display.canvas.style.right = APP.display.canvas.style.right === 'auto' ? 0 : 'auto';
                    APP.display.canvas.style.left = APP.display.canvas.style.left === 'auto' ? 0 : 'auto';
                    return true;
                }
                
                return false;
            },

            /**
             * Resets application stats.
             * (if application on initialised then do it)
             * @returns {boolean}
             */
            reset: function () {

                if (APP.initialised) {
                    APP.stats = new Stats(APP.settings.width);
                    Display._fps_refresh = null;
                    return true;
                } else {
                    return APP.api.init();
                }
            },

            /**
             * Stop application, reset all stats and removed monitor/canvas.
             * @returns {boolean}
             */
            destroy: function () {
                if (APP.initialised) {
                    APP.stats = null;
                    APP.display.destroy();
                    APP.display = null;
                    APP.initialised = false;
                    return true;
                }
                return false;
            }
        }
    };

    /**
     * Stats class - calculates fps and ms statistics.
     * @param history {number} History array span.
     * @constructor
     */
    var Stats = function (history) {
        
        this.history_max = history;
        this.fps = 0;
        this.fps_min = Infinity;
        this.fps_max = 0;
        this.fps_avg = 0;
        this.fps_total = 0;
        this.fps_count = 0;
        this.fps_calc_seconds = 0;
        this.fps_calc_frames = 0;
        this.fps_history = [];
        this.ms = 0;
        this.ms_min = 0;
        this.ms_max = Infinity;
        this.ms_avg = 0;
        this.ms_total = 0;
        this.ms_count = 0;
        this.ms_history = [];
        this.time_now = NOW();
    };

    /**
     * Calculate and store this frame stats.
     */
    Stats.prototype.nextFrame = function () {
        
        var time_now = NOW(),
            time_diff = time_now - this.time_now;
        
        // Calculate ms

        this.ms = time_diff;
        this.ms_total += time_diff;
        this.ms_count += 1;
        this.storeMs(time_diff);
        this.calcMsStats(time_diff);
        
        // Calculate fps
        
        this.fps_calc_seconds += time_diff;
        this.fps_calc_frames += 1;
        
        if (this.fps_calc_seconds >= 1000) {
            
            this.fps = this.fps_calc_frames;
            this.fps_total += this.fps_calc_frames;
            this.fps_count += 1;
            this.storeFps(this.fps_calc_frames);
            this.calcFpsStats(this.fps_calc_frames);
            
            // Reset values for next second

            this.fps_calc_seconds = 0;
            this.fps_calc_frames = 0;
        }
        
        // Update time of this frame
        
        this.time_now = time_now;
    };

    /**
     * Calculate min, max and average ms.
     * @param num {number}
     */
    Stats.prototype.calcMsStats = function (num) {
        
        if (num > this.ms_min) {
            this.ms_min = num;
        }
        
        if (num < this.ms_max) {
            this.ms_max = num;
        }
        
        this.ms_avg = Math.round(this.ms_total / this.ms_count);
    };

    /**
     * Calculate min, max and average fps.
     * @param num {number}
     */
    Stats.prototype.calcFpsStats = function (num) {
        
        if (num > this.fps_max) {
            this.fps_max = num;
        }
        
        if (num < this.fps_min) {
            this.fps_min = num;
        }
        
        this.fps_avg = Math.round(this.fps_total / this.fps_count);
    };

    /**
     * Save this ms in history.
     * @param num {number}
     */
    Stats.prototype.storeMs = function (num) {

        this.ms_history.push(num);
        
        if (this.ms_history.length > this.history_max) {
            this.ms_history.shift();
        }
    };

    /**
     * Save this fps in history.
     * @param num {number}
     */
    Stats.prototype.storeFps = function (num) {

        this.fps_history.push(num);
        
        if (this.fps_history.length > this.history_max) {
            this.fps_history.shift();
        }
    };

    /**
     * Graph plotter class for stats in history array.
     * @param width {number} Width of graph area.
     * @param height {number} Height of graph area.
     * @param left {number} Left position of graph area.
     * @param bottom {number} Bottom position of graph area.
     * @param top_val {number} Top value for the graph values.
     * @param limit_good {number} Limit value for graph color.
     * @param limit_warning {number} Limit value for graph color.
     * @param limit_poor {number} Limit value for graph color.
     * @param logic_invert {boolean} If true reversed logic is applied - higher values are worse and lower values are better.
     * @constructor
     */
    var Graph = function (width, height, left, bottom, top_val, limit_good, limit_warning, limit_poor, logic_invert) {

        this.width = width;
        this.height = height;
        this.bottom = bottom;
        this.left = left;
        this.limit_good = limit_good;
        this.limit_warning = limit_warning;
        this.limit_poor = limit_poor;
        
        // Calculate scale factor for values based on the top value and graph height
        
        this.scale = height / top_val;
        
        // Set invert login flag - attribute is optional
        
        this.logic_invert = (typeof logic_invert !== 'undefined' && logic_invert === true);
    };

    /**
     * Colors for different limit types.
     * @type {{excellent: string, good: string, warning: string, poor: string}}
     */
    Graph.colors = {
        
        // Lime
        
        excellent: '#0BE400',
        
        // Green
        
        good: '#0DAC05',
        
        // Orange
        
        warning: '#d88c08',
        
        // Red
        
        poor: '#d80808'
    };

    /**
     * Returns color based on passed value and limits.
     * (handles also inverted scoring)
     * @param value {number}
     * @returns {string} Hexdec color
     */
    Graph.prototype.getColor = function (value) {
        
        var color = this.constructor.colors;

        if (this.logic_invert) {

            if (value > this.limit_poor) {
                return color.poor;
            } else if (value <= this.limit_good) {
                return color.excellent;
            } else if (value <= this.limit_warning) {
                return color.good;
            } else if (value <= this.limit_poor) {
                return color.warning;
            }

        } else {

            if (value < this.limit_poor) {
                return color.poor;
            } else if (value < this.limit_warning) {
                return color.warning;
            } else if (value < this.limit_good) {
                return color.good;
            } else {
                return color.excellent;
            }
        }
    };

    /**
     * Draw the graph.
     * @param ctx {object} Canvas context object.
     * @param dataset {array} History of values.
     */
    Graph.prototype.render = function (ctx, dataset) {

        var len = dataset.length,
            i_end = len - this.width < 0 ? 0 : len - this.width,
            r_w = 1,
            r_x,
            r_y,
            r_h,
            value,
            i,
            x;

        // Loops through the dataset - limit loop by graph width
        
        for (i = len - 1, x = this.width; i >= i_end; i -= 1, x -= 1) {

            value = dataset[i];

            // Calculate dimensions fot the value bar
            
            r_x = this.left + x - 1;
            r_h = Math.round(value * this.scale);

            if (r_h <= 0) r_h = 1;
            if (r_h > this.height) r_h = this.height;

            r_y = APP.settings.height - this.bottom - r_h;

            // Draw bar for this value
            
            ctx.beginPath();
            ctx.rect(r_x, r_y, r_w, r_h);
            ctx.fillStyle = this.getColor(value);
            ctx.fill();
        }
    };

    /**
     * Display class.
     * Creates canvas element and place it in the page.
     * Contains views for the monitor.
     * @param width {number}
     * @param height {number}
     * @constructor
     */
    var Display = function (width, height) {

        var body = document.querySelector('body'),
            canvas = document.createElement('canvas');

        if (!canvas.getContext) {
            
            this.supported = false;
            alert('You browser doesn\'t support canvas!');
            
        } else {
            
            canvas.width = width;
            canvas.height = height;
            canvas.display = 'block';
            canvas.style.position = 'fixed';
            canvas.style.top = 0;
            canvas.style.right = 0;
            canvas.style.left = 'auto';
            canvas.style.zIndex = 999999999;

            body.appendChild(canvas);

            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');

            this.supported = true;
        }
    };

    /**
     * Display general settings
     * @type {{color: {bg: string, value: string, nfo: string}, font: string, char: {max: string, min: string, avg: string}}}
     */
    Display.settings = {
        
        color : {
            bg: 'rgba(0,0,0,0.85)',
            value: 'white',
            nfo: '#999999'
        },
        
        font: 'sans-serif',
        
        char: {
            
            // Arrow up char
            
            max: '\u25B2',
            
            // Star char
            
            min: '\u25BC',
            
            // Arrow down char
            
            avg: '\u2605'
        }
    };

    /**
     * Clear the canvas and set the background
     */
    Display.prototype.clear = function () {
        
        var ctx = this.ctx;
        
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.beginPath();
        ctx.rect(0, 0, this.canvas.width, this.canvas.height);
        ctx.fillStyle = this.constructor.settings.color.bg;
        ctx.fill();
    };

    /**
     * Internally use to keep track of current fps and update only when new fps value is added (not at every frame).
     * @type {null|number}
     */
    Display._fps_refresh = null;

    /**
     * Set Graph instance for the FPS view.
     * @type {Graph}
     */
    Display.FpsGraph = new Graph(APP.settings.width, APP.settings.height - 20, 0, 0, 70, 60, 30, 25);

    /**
     * Display view - FPS.
     * Full width graph, current fps, max fps, min fps and average fps.
     */
    Display.prototype.viewFps = function () {
        
        var ctx = this.ctx,
            self = this.constructor,
            color = self.settings.color,
            char = self.settings.char,
            font = self.settings.font,
            fps_refresh = self._fps_refresh;
        
        // Re-render canvas only on new fps value
        
        if (fps_refresh !== APP.stats.fps_count) {
            
            fps_refresh = APP.stats.fps_count;

            this.clear();

            ctx.font = 'bold 9px ' + font;
            ctx.textAlign = 'left';
            ctx.fillStyle = color.value;
            ctx.fillText(APP.stats.fps + ' fps', 5, 12);
            
            ctx.font = '9px ' + font;
            ctx.textAlign = 'right';
            ctx.fillStyle = color.nfo;
            ctx.fillText(char.max + APP.stats.fps_max + '  ' + char.avg + APP.stats.fps_avg + '  ' + char.min + (APP.stats.fps_min === Infinity ? 0 : APP.stats.fps_min), this.canvas.width - 5, 12);
            
            self.FpsGraph.render(ctx, APP.stats.fps_history);
        }
    };

    /**
     * Set Graph instance for the MS view.
     * @type {Graph}
     */
    Display.MsGraph = new Graph(APP.settings.width, APP.settings.height - 20, 0, 0, 100, 18, 34, 40, true);

    /**
     * Display view - MS (ms delay between frames).
     * Full width graph, current ms, max ms, min ms and average ms.
     */
    Display.prototype.viewMs = function () {

        var ctx = this.ctx,
            self = this.constructor,
            color = self.settings.color,
            char = self.settings.char,
            font = self.settings.font;
        
        this.clear();

        ctx.font = 'bold 9px ' + font;
        ctx.textAlign = 'left';
        ctx.fillStyle = color.value;
        ctx.fillText(APP.stats.ms + ' ms', 5, 12);

        ctx.font = '9px ' + font;
        ctx.textAlign = 'right';
        ctx.fillStyle = color.nfo;
        ctx.fillText(char.max + (APP.stats.ms_max === Infinity ? 0 : APP.stats.ms_max) + '  ' + char.avg + APP.stats.ms_avg + '  ' + char.min + APP.stats.ms_min, this.canvas.width - 5, 12);

        self.MsGraph.render(ctx, APP.stats.ms_history);
    };

    /**
     * Display half layout - gutter value
     * @type {number}
     */
    Display._half_gutter = 2;

    /**
     * Display half layout - with of the half
     * @type {number}
     */
    Display._half_width = Math.round((APP.settings.width - Display._half_gutter) / 2);

    /**
     * Display half layout - X position of the 2nd half
     * @type {number}
     */
    Display._half_2nd_col_x = Display._half_width + Display._half_gutter;

    /**
     * Set Graph instance for the ALL view - FPS half graph.
     * @type {Graph}
     */
    Display.AllFpsGraph = new Graph(Display._half_width, APP.settings.height - 20, 0, 0, 70, 60, 30, 25);

    /**
     * Set Graph instance for the ALL view - MS half graph.
     * @type {Graph}
     */
    Display.AllMsGraph = new Graph(Display._half_width, APP.settings.height - 20, Display._half_2nd_col_x, 0, 100, 18, 34, 40, true);

    /**
     * Display view - ALL - split view for FPS and MS.
     * Half width fps graph, current fps, average fps, half width ms graph, current ms and average ms.
     */
    Display.prototype.viewAll = function () {

        var ctx = this.ctx,
            self = this.constructor,
            color = self.settings.color,
            char = self.settings.char,
            font = self.settings.font;

        this.clear();
        ctx.clearRect(self._half_width, 0, self._half_gutter, this.canvas.height);

        ctx.font = 'bold 9px ' + font;
        ctx.textAlign = 'left';
        ctx.fillStyle = color.value;
        ctx.fillText(APP.stats.fps + ' fps', 5, 12);
        ctx.fillText(APP.stats.ms + ' ms', self._half_2nd_col_x + 5, 12);
        
        ctx.font = '9px ' + font;
        ctx.textAlign = 'right';
        ctx.fillStyle = color.nfo;
        ctx.fillText(char.avg + APP.stats.fps_avg, self._half_width - 5, 12);
        ctx.fillText(char.avg + APP.stats.ms_avg, this.canvas.width - 5, 12);

        self.AllFpsGraph.render(ctx, APP.stats.fps_history);
        self.AllMsGraph.render(ctx, APP.stats.ms_history);
    };

    /**
     * Display view - SIMPLE - split view for FPS and MS values in colored block reflecting the performance.
     * Current fps, average fps, current ms and average ms.
     */
    Display.prototype.viewSimple = function () {

        var ctx = this.ctx,
            self = this.constructor,
            color = self.settings.color,
            char = self.settings.char,
            font = self.settings.font,
            half_center = Math.round(self._half_width / 2);

        this.clear();
        ctx.clearRect(self._half_width, 0, self._half_gutter, this.canvas.height);

        ctx.beginPath();
        ctx.rect(0, 0, self._half_width, APP.settings.height);
        ctx.fillStyle = self.AllFpsGraph.getColor(APP.stats.fps);
        ctx.fill();

        ctx.beginPath();
        ctx.rect(self._half_2nd_col_x, 0, self._half_width, APP.settings.height);
        ctx.fillStyle = self.AllMsGraph.getColor(APP.stats.ms);
        ctx.fill();

        ctx.font = 'bold 28px ' + font;
        ctx.textAlign = 'center';
        ctx.fillStyle = color.value;
        ctx.fillText(APP.stats.fps, half_center, 32);
        ctx.fillText(APP.stats.ms, self._half_2nd_col_x + half_center, 32);

        ctx.font = '9px ' + font;
        ctx.fillText(char.avg + APP.stats.fps_avg + ' fps', half_center, 44);
        ctx.fillText(char.avg + APP.stats.ms_avg + ' ms', self._half_2nd_col_x + half_center, 44);
    };

    /**
     * Remove canvas from the DOM.
     */
    Display.prototype.destroy = function () {
        this.canvas.remove();
    };

    // Check if request animation frame feature is available
    
    if (RAF === false) {
        
        alert('You browser doesn\'t support requestAnimationFrame!');
        
    } else {
        
        // Use existing or this APP as an active object and expose public API interface
        
        if (old_APP === false) {
            window.RAFstats = active_APP = APP.api;
        } else {
            active_APP = old_APP;
        }
        
        // If not running start app
        
        if (!active_APP.initialised) {
            active_APP.init();
        }
    }

}(window, document));
