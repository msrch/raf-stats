(function (window, document) {
    'use strict';
    
    var RAF = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || false;
    
    var old_APP = typeof window.RAFstats !== 'undefined' ? window.RAFstats : false,
        active_APP;
    
    var NOW = function () {
        return (new Date()).getTime();
    };

    var APP = {
            initialised: false,
            touch_support: ('ontouchstart' in window || 'onmsgesturechange' in window),
            settings: {
                width: 150,
                height: 50
            },
            stats: null,
            display: null,
            view: 0,
            layouts: ['viewFps', 'viewMs', 'viewAll', 'viewSimple'],
            getFrame: function () {
                
                RAF(function () {

                    if (APP.initialised) {
                        APP.stats.nextFrame();
                        APP.drawLayout();
                        APP.getFrame();
                    }
                });
            },
            drawLayout: function () {
                
                APP.display[APP.layouts[APP.view]]();
            },
            behaviour: {
                
                swipe_diff: 25,
                swipe: false,
                active: false,
                pos_x: 0,
                pos_y: 0,
                
                action: function (diff_x, diff_y, swipe) {
                    
                    var swipe_diff = APP.behaviour.swipe_diff;
                    
                    if (swipe) {
                        diff_x += swipe_diff;
                        diff_y += swipe_diff;
                    }
                    
                    if (diff_x > swipe_diff || diff_y > swipe_diff) {
                        
                        if (diff_x > diff_y) {
                            APP.api.toggleSides();
                        } else {
                            APP.api.reset();
                        }
                        
                    } else {
                        APP.api.nextView();
                    }
                },
                
                handleEvent: function (ev) {
                    
                    var self = APP.behaviour,
                        diff_x,
                        diff_y,
                        touch;
                    
                    var pos_x, pos_y;
                    
                    if (ev.type === 'touchstart' || ev.type === 'touchleave' || ev.type === 'touchcancel' || ev.type === 'touchend') {
                        touch = ev.touches[0] || ev.changedTouches[0];
                        pos_x = touch.pageX;
                        pos_y = touch.pageY;
                    } else {
                        pos_x = ev.clientX;
                        pos_y = ev.clientY;
                    }
                    
                    if (ev.type === 'mousedown' || ev.type === 'touchstart') {
                        
                        self.pos_x = pos_x;
                        self.pos_y = pos_y;
                        self.active = true;
                        
                    } else {

                        if (ev.type === 'mouseout' || ev.type === 'touchleave' || ev.type === 'touchcancel') {
                            self.swipe = true;
                        }

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
            
            api: {
                
                init: function () {
                    
                    var addEvent = function (name) {
                        APP.display.canvas.addEventListener(name, APP.behaviour, false);
                    };
                    
                    if (!APP.initialised) {
                        
                        APP.display = new Display(APP.settings.width, APP.settings.height);
                        
                        if (APP.display.supported) {

                            if (APP.layouts.length > 1) {
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
                            }

                            APP.stats = new Stats(APP.settings.width);
                            APP.initialised = true;
                            APP.getFrame();
                            return true;
                        }
                    }
                    return false;
                },
                
                nextView: function () {

                    return APP.view = APP.view + 1 >= APP.layouts.length ? 0 : APP.view + 1;
                },
                
                toggleSides: function () {

                    if (APP.initialised) {
                        
                        APP.display.canvas.style.right = APP.display.canvas.style.right === 'auto' ? 0 : 'auto';
                        APP.display.canvas.style.left = APP.display.canvas.style.left === 'auto' ? 0 : 'auto';
                        return true;
                    }
                    return false;
                },
                
                reset: function () {

                    if (APP.initialised) {
                        APP.stats = new Stats(APP.settings.width);
                        return true;
                    } else {
                        return APP.api.init();
                    }
                },

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
            
            // Reset vals for next second

            this.fps_calc_seconds = 0;
            this.fps_calc_frames = 0;
        }
        
        // Update time of this frame
        this.time_now = time_now;
    };

    Stats.prototype.calcMsStats = function (num) {
        
        if (num > this.ms_min) {
            this.ms_min = num;
        }
        
        if (num < this.ms_max) {
            this.ms_max = num;
        }
        
        this.ms_avg = Math.round(this.ms_total / this.ms_count);
    };

    Stats.prototype.calcFpsStats = function (num) {
        
        if (num > this.fps_max) {
            this.fps_max = num;
        }
        
        if (num < this.fps_min) {
            this.fps_min = num;
        }
        
        this.fps_avg = Math.round(this.fps_total / this.fps_count);
    };

    Stats.prototype.storeMs = function (num) {

        this.ms_history.push(num);
        
        if (this.ms_history.length > this.history_max) {
            this.ms_history.shift();
        }
    };

    Stats.prototype.storeFps = function (num) {

        this.fps_history.push(num);
        
        if (this.fps_history.length > this.history_max) {
            this.fps_history.shift();
        }
    };

    var Graph = function (width, height, left, bottom, top_val, limit_good, limit_warning, limit_poor, logic_invert) {

        this.width = width;
        this.height = height;
        this.bottom = bottom;
        this.left = left;
        this.limit_good = limit_good;
        this.limit_warning = limit_warning;
        this.limit_poor = limit_poor;
        this.scale = height / top_val;
        this.logic_invert = typeof logic_invert !== 'undefined';
    };
    
    Graph.colors = {
        excellent: '#0BE400',
        good: '#0DAC05',
        warning: '#d88c08',
        poor: '#d80808'
    };

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

        for (i = len - 1, x = this.width; i >= i_end; i -= 1, x -= 1) {

            value = dataset[i];

            r_x = this.left + x - 1;
            r_h = Math.round(value * this.scale);

            if (r_h <= 0) r_h = 1;
            if (r_h > this.height) r_h = this.height;

            r_y = APP.settings.height - this.bottom - r_h;

            ctx.beginPath();
            ctx.rect(r_x, r_y, r_w, r_h);
            ctx.fillStyle = this.getColor(value);
            ctx.fill();
        }
    };

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
    
    Display.settings = {
        color : {
            bg: 'rgba(0,0,0,0.85)',
            value: 'white',
            nfo: '#999999'
        },
        font: 'sans-serif',
        char: {
            max: '\u25B2',
            min: '\u25BC',
            avg: '\u2605'
        }
    };
    
    Display.prototype.clear = function () {
        var ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.beginPath();
        ctx.rect(0, 0, this.canvas.width, this.canvas.height);
        ctx.fillStyle = this.constructor.settings.color.bg;
        ctx.fill();
    };

    Display._fps_refresh = null;
    Display.FpsGraph = new Graph(APP.settings.width, APP.settings.height - 20, 0, 0, 70, 60, 30, 25);
    
    Display.prototype.viewFps = function () {
        
        var ctx = this.ctx,
            self = this.constructor,
            color = self.settings.color,
            char = self.settings.char,
            font = self.settings.font,
            fps_refresh = self._fps_refresh;
        
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

    Display.MsGraph = new Graph(APP.settings.width, APP.settings.height - 20, 0, 0, 100, 18, 34, 40, true);

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

    Display._half_gutter = 2;
    Display._half_width = Math.round((APP.settings.width - Display._half_gutter) / 2);
    Display._half_2nd_col_x = Display._half_width + Display._half_gutter;

    Display.AllFpsGraph = new Graph(Display._half_width, APP.settings.height - 20, 0, 0, 70, 60, 30, 25);
    Display.AllMsGraph = new Graph(Display._half_width, APP.settings.height - 20, Display._half_2nd_col_x, 0, 100, 18, 34, 40, true);

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
    
    Display.prototype.destroy = function () {
        this.canvas.remove();
    };

    if (RAF === false) {
        alert('You browser doesn\'t support requestAnimationFrame!');
    } else {
        
        if (old_APP === false) {
            window.RAFstats = active_APP = APP.api;
        } else {
            active_APP = old_APP;
        }
        
        if (!active_APP.initialised) {
            active_APP.init();
        }
    }

}(window, document));
