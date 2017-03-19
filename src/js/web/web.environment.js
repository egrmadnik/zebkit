(function() {
    'use strict';

    var zebkitEnvironment = function() {
        var pkg = {};

        function $sleep() {
            var r = new XMLHttpRequest(),
                t = (new Date()).getTime().toString(),
                i = window.location.toString().lastIndexOf("?");
            r.open('GET', window.location + (i > 0 ? "&" : "?") + t, false);
            r.send(null);
        }

        function $Request() {
            this.responseText = this.statusText = "";
            this.onreadystatechange = this.responseXml = null;
            this.readyState = this.status = 0;
        }

        $Request.prototype.open = function(method, url, async, user, password) {
            var pu = zebkit.Path.parseURL(url);
            if (location.protocol.toLowerCase() === "file:" ||
                (pu !== null && pu.host !== null && pu.host.toLowerCase() === location.host.toLowerCase()))
            {
                this._request = new XMLHttpRequest();
                this._xdomain = false;

                var $this = this;
                this._request.onreadystatechange = function() {
                    $this.readyState = $this._request.readyState;
                    if ($this._request.readyState === 4) {
                        $this.responseText = $this._request.responseText;
                        $this.responseXml  = $this._request.responseXml;
                        $this.status     = $this._request.status;
                        $this.statusText = $this._request.statusText;
                    }

                    if ($this.onreadystatechange) {
                        $this.onreadystatechange();
                    }
                };

                return this._request.open(method, url, (async !== false), user, password);
            } else {
                this._xdomain = true;
                this._async = (async === true);
                this._request = new XDomainRequest();
                return this._request.open(method, url);
            }
        };

        $Request.prototype.send = function(data) {
            if (this._xdomain) {
                var originalReq = this._request,
                    $this       = this;

                //!!!! handler has to be defined after
                //!!!! open method has been called and all
                //!!!! four handlers have to be defined
                originalReq.ontimeout = originalReq.onprogress = function () {};

                originalReq.onerror = function() {
                    $this.readyState = 4;
                    $this.status = 404;
                    if ($this._async && $this.onreadystatechange) {
                        $this.onreadystatechange();
                    }
                };

                originalReq.onload  = function() {
                    $this.readyState = 4;
                    $this.status = 200;

                    if ($this._async && $this.onreadystatechange) {
                        $this.onreadystatechange(originalReq.responseText, originalReq);
                    }
                };

                //!!! set time out zero to prevent data lost
                originalReq.timeout = 0;

                if (this._async === false) {
                    originalReq.send(data);

                    while (this.status === 0) {
                        pkg.$sleep();
                    }

                    this.readyState = 4;
                    this.responseText = originalReq.responseText;

                } else {
                    //!!!  short timeout to make sure bloody IE is ready
                    setTimeout(function () {
                       originalReq.send(data);
                    }, 10);
                }
            }
            else  {
                return this._request.send(data);
            }
        };

        $Request.prototype.abort = function(data) {
            return this._request.abort();
        };

        $Request.prototype.setRequestHeader = function(name, value) {
            if (this._xdomain) {
                if (name === "Content-Type") {
                    //!!!
                    // IE8 and IE9 anyway don't take in account the assignment
                    // IE8 throws exception every time a value is assigned to
                    // the property
                    // !!!
                    //this._request.contentType = value;
                    return;
                } else {
                    throw new Error("Method 'setRequestHeader' is not supported for " + name);
                }
            } else {
                this._request.setRequestHeader(name, value);
            }
        };

        $Request.prototype.getResponseHeader = function(name) {
            if (this._xdomain) {
                throw new Error("Method is not supported");
            }
            return this._request.getResponseHeader(name);
        };

        $Request.prototype.getAllResponseHeaders = function() {
            if (this._xdomain) {
                throw new Error("Method is not supported");
            }
            return this._request.getAllResponseHeaders();
        };

        pkg.getHttpRequest = function() {
            if (typeof XMLHttpRequest !== "undefined") {
                var r = new XMLHttpRequest();

                if (zebkit.isFF) {
                    r.__send = r.send;
                    r.send = function(data) {
                        // !!! FF can throw NS_ERROR_FAILURE exception instead of
                        // !!! returning 404 File Not Found HTTP error code
                        // !!! No request status, statusText are defined in this case
                        try { return this.__send(data); }
                        catch(e) {
                            if (!e.message || e.message.toUpperCase().indexOf("NS_ERROR_FAILURE") < 0) {
                                // exception has to be re-instantiate to be Error class instance
                                throw new Error(e.toString());
                            }
                        }
                    };
                }
                return ("withCredentials" in r) ? r  // CORS is supported out of box
                                                : new $Request(); // IE
            }
            throw new Error("Archaic browser detected");
        };

        pkg.parseXML = function(s) {
            function rmws(node) {
                if (node.childNodes !== null) {
                    for (var i = node.childNodes.length; i-- > 0;) {
                        var child= node.childNodes[i];
                        if (child.nodeType === 3 && child.data.match(/^\s*$/)) {
                            node.removeChild(child);
                        }

                        if (child.nodeType === 1) {
                            rmws(child);
                        }
                    }
                }
                return node;
            }

            if (typeof DOMParser !== "undefined") {
                return rmws((new DOMParser()).parseFromString(s, "text/xml"));
            } else {
                for (var n in { "Microsoft.XMLDOM":0, "MSXML2.DOMDocument":1, "MSXML.DOMDocument":2 }) {
                    var p = null;
                    try {
                        p = new ActiveXObject(n);
                        p.async = false;
                    } catch (e) {
                        continue;
                    }

                    if (p === null) {
                        throw new Error("XML parser is not available");
                    }
                    p.loadXML(s);
                    return p;
                }
            }
            throw new Error("No XML parser is available");
        };

        /**
         * Loads an image by the given URL.
         * @param  {String|HTMLImageElement} img an image URL or image object
         * @param  {Function} ready a call back method to be notified when the image has been completely
         * loaded or failed. The method gets three parameters

            - an URL to the image
            - boolean loading result. true means success
            - an image that has been loaded

        * @example
            // load image
            zebkit.web.$loadImage("test.png", function(path, result, image) {
                if (result === false) {
                    // handle error
                    ...
                }
            });
         * @return {HTMLImageElement}  an image
         * @for  zebkit.web
         * @method  loadImage
         */
        pkg.loadImage = function(ph, fireError) {
            if (arguments.length < 2) {
                fireError = true;
            }

            var img = null;
            if (ph instanceof Image) {
                img = ph;
            } else {
                img = new Image();
                img.crossOrigin = '';
                img.crossOrigin ='anonymous';
                img.src = ph;
            }

            return new zebkit.DoIt(function() {
                if (img.complete === true && img.naturalWidth !== 0) {
                    return img;
                } else {
                    var pErr  = img.onerror,
                        pLoad = img.onload,
                        $this = this,
                        join  = this.join();

                    img.onerror = function(e) {
                        img.onerror = null;

                        if (fireError === true) {
                            var err = new Error("Image '" + ph + "' cannot be loaded " + e);
                            $this.error(err);
                        } else {
                            join.call($this, img, false);
                        }

                        if (pErr != null) {
                            img.onerror = pErr;
                            pErr.call(this, e);
                        }
                    };

                    img.onload  = function(e) {
                        img.onload = null;
                        join.call($this, img);
                        if (pLoad != null) {
                            img.onload = pLoad;
                            pLoad.call(this, e);
                        }
                    };

                    return img;
                }
            });
        };

        pkg.parseJSON = JSON.parse;

        pkg.stringifyJSON = JSON.stringify;

        pkg.setInterval = function (cb, time) {
            return window.setInterval(cb, time);
        };

        pkg.clearInterval = function (id) {
            return window.clearInterval(id);
        };

        if (typeof window !== 'undefined') {
            var $taskMethod = window.requestAnimationFrame       ||
                              window.webkitRequestAnimationFrame ||
                              window.mozRequestAnimationFrame    ||
                              function(callback) { return setTimeout(callback, 35); };
        }

        /**
         * Request to run a method as an animation task.
         * @param  {Function} f the task body method
         * @method  animate
         * @for  zebkit.web
         */
        pkg.animate = function(f){
            return $taskMethod.call(window, f);
        };

        return pkg;
    };

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports.zebkitEnvironment = zebkitEnvironment;

        // TODO:
        // typeof the only way to make environment visible is makling it global
        // since module cannoyt be applied in the ase of browser context
        if (typeof global !== 'undefined') {
            global.zebkitEnvironment = zebkitEnvironment;
        }
    } else {
        window.zebkitEnvironment = zebkitEnvironment;
    }
})();