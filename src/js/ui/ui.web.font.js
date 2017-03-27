zebkit.package("ui", function(pkg, Class) {

    // TODO: dependencies from
    //    -- DOM/WEB
    //      -- createElement
    //      -- appendChild(e);
    //      -- getElementById
    //      -- document, document.body, Image

    /**
     *  @for zebkit.ui
     */
    function decodeSize(s, defaultHeight) {
        if (zebkit.isString(s)) {
            var size = Number(s);
            if (isNaN(size)) {
                var m = s.match(/^([0-9]+)(%)$/);
                if (m !== null && m[1] != null && m[2] != null) {
                    size = Math.floor((defaultHeight * parseInt(m[1], 10)) / 100);
                    return size + "px";
                }
                return /^([0-9]+)(em|px)$/.test(s) === true ? s : null;
            } else {
                if (s[0] === '+') {
                    size = defaultHeight + size;
                } else if (s[0] === '-') {
                    size = defaultHeight - size;
                }
                return size + "px";
            }
        }
        return s == null ? null : s + "px";
    }

    /**
     * This class represents a font and provides basic font metrics like height, ascent. Using
     * the class developers can compute string width.

     // plain font
     var f = new zebkit.ui.Font("Arial", 14);

     // bold font
     var f = new zebkit.ui.Font("Arial", "bold", 14);

     // defining font with CSS font name
     var f = new zebkit.ui.Font("100px Futura, Helvetica, sans-serif");

     * @constructor
     * @param {String} name a name of the font. If size and style parameters has not been passed
     * the name is considered as CSS font name that includes size and style
     * @param {String} [style] a style of the font: "bold", "italic", etc
     * @param {Integer} [size] a size of the font
     * @class zebkit.ui.Font
     */
    pkg.Font = Class([
        function(family, style, size) {
            if (arguments.length === 1) {
                this.size = decodeSize(family, this.clazz.size);
                if (this.size === null) {
                    // trim
                    family = family.trim();

                    // check if a predefined style has been used
                    if (family === "bold" || family === "italic") {
                        this.style = family;
                    } else {  // otherwise handle it as CSS-like font style
                        // try to parse font if possible
                        var re = /([a-zA-Z_\- ]+)?(([0-9]+px|[0-9]+em)\s+([,\"'a-zA-Z_ \-]+))?/,
                            m  = family.match(re);

                        if (m[4] != null) {
                            this.family = m[4].trim();
                        }

                        if (m[3] != null) {
                            this.size = m[3].trim();
                        }

                        if (m[1] != null) {
                            this.style = m[1].trim();
                        }

                        this.s = family;
                    }
                }
            } else if (arguments.length === 2) {
                this.family = family;
                this.size   = decodeSize(style, this.clazz.size);
                this.style  = this.size == null ? style : null;
            } else if (arguments.length === 3) {
                this.family = family;
                this.style  = style;
                this.size   = decodeSize(size, this.clazz.size);
            }

            if (this.size == null) {
                this.size = this.clazz.size + "px";
            }

            if (this.s === null) {
                this.s = ((this.style != null) ? this.style + " ": "") +
                         this.size + " " +
                         this.family;
            }

            var m = computeFontMetrics(this.s);

            /**
             * Height of the font
             * @attribute height
             * @readOnly
             * @type {Integer}
             */
            this.height = m.height;
            /**
             * Ascent of the font
             * @attribute ascent
             * @readOnly
             * @type {Integer}
             */
            this.ascent = m.ascent;
        },

        function $clazz() {
            // default values
            this.family = "Arial, Helvetica";
            this.style  =  null;
            this.size   =  14;

            this.entire = true;
        },

        function $prototype(clazz) {
            this.s = null;

            this.family = clazz.family,
            this.style  = clazz.style;
            this.size   = clazz.size;

            /**
             * Calculate the given string width in pixels
             * @param  {String} s a string whose width has to be computed
             * @return {Integer} a string size in pixels
             * @method stringWidth
             * @for zebkit.ui.Font
             */
            this.stringWidth = function(s) {
                if (s.length === 0) {
                    return 0;
                }

                if (pkg.Font.$fmCanvas.font !== this.s) {
                    pkg.Font.$fmCanvas.font = this.s;
                }

                return (pkg.Font.$fmCanvas.measureText(s).width + 0.5) | 0;
            };

            /**
             * Calculate the specified substring width
             * @param  {String} s a string
             * @param  {Integer} off fist character index
             * @param  {Integer} len length of substring
             * @return {Integer} a substring size in pixels
             * @method charsWidth
             * @for zebkit.ui.Font
             */
            this.charsWidth = function(s, off, len) {
                if (pkg.Font.$fmCanvas.font !== this.s) {
                    pkg.Font.$fmCanvas.font = this.s;
                }

                return ( pkg.Font.$fmCanvas.measureText(len === 1 ? s[off]
                                                                  : s.substring(off, off + len)).width + 0.5) | 0;
            };

            /**
             * Returns CSS font representation
             * @return {String} a CSS representation of the given Font
             * @method toString
             * @for zebkit.ui.Font
             */
            this.toString = function() {
                return this.s;
            };

            /**
             * Resize font and return new instance of font class with new size.
             * @param  {Integer | String} size can be specified in pixels as integer value or as
             * a percentage from the given font:
             * @return {zebkit.ui.Font} a font
             * @for zebkit.ui.Font
             * @method resize
             * @example
             *
             * ```javascript
             * var font = new zebkit.ui.Font(10); // font 10 pixels
             * font = font.resize("200%"); // two times higher font
             * ```
             */
            this.resize = function(size) {
                var nsize = decodeSize(size, this.height);
                if (nsize === null) {
                    throw new Error("Invalid font size : " + size);
                }
                return new this.clazz(this.family, this.style, nsize);
            };

            this.restyle = function(style) {
                return new this.clazz(this.family, style, this.height + "px");
            };
        }
    ]);


    function computeFontMetrics(font) {
        var res     = {},
            $fmText = pkg.Font.$fmText;

        if ($fmText.style.font !== font) {
            $fmText.style.font = font;
        }

        res.height = $fmText.offsetHeight;

        //!!!
        // Something weird is going sometimes in IE10 !
        // Sometimes the property offsetHeight is 0 but
        // second attempt to access to the property gives
        // proper result
        if (res.height === 0) {
            res.height = $fmText.offsetHeight;
        }

        res.ascent = pkg.Font.$fmImage.offsetTop - $fmText.offsetTop + 1;
        return res;
    }


    // initialize font specific structures
    var jn = zebkit.join();

    pkg.Font.$fmCanvas = document.createElement("canvas").getContext("2d");

    var e = document.getElementById("zebkit.fm");
    if (e == null) {
        e = document.createElement("div");
        e.setAttribute("id", "zebkit.fm");  // !!! position fixed below allows to avoid 1px size in HTML layout for "zebkit.fm" element
        e.setAttribute("style", "visibility:hidden;line-height:0;height:1px;vertical-align:baseline;position:fixed;");
        e.innerHTML = "<span id='zebkit.fm.text' style='display:inline;vertical-align:baseline;'>&nbsp;</span>" +
                      "<img id='zebkit.fm.image' style='width:1px;height:1px;display:inline;vertical-align:baseline;' width='1' height='1'/>";
        document.body.appendChild(e);
    }
    pkg.Font.$fmText  = document.getElementById("zebkit.fm.text");
    pkg.Font.$fmImage = document.getElementById("zebkit.fm.image");

    // the next function passed to zebkit.ready() will be blocked
    // till the picture is completely loaded
    pkg.Font.$fmImage.onload = function() {
        jn();
    };

    // set 1x1 transparent picture
    pkg.Font.$fmImage.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII%3D';

    // TODO: temporary, should be done via Implement
    //pkg.cd("..").Font = pkg.Font;
});