(function() {

'use strict'

    // Environment specific stuff
    var zenv = {},
        isInBrowser = typeof navigator !== "undefined",
        $global     = (typeof window !== "undefined" && window != null) ? window
                                                                        : (typeof global !== 'undefined' ? global
                                                                                                         : this);

    if (typeof zebkitEnvironment === 'function') {
        zenv = zebkitEnvironment();
    } else {
        if (typeof window !== 'undefined') {
            zenv = window;
        }
    }

    /**
     * Path utility static class
     * @constructor
     * @class zebkit.Path
     */
    function Path(url) {}

    Path.parseURL = function(url) {
        var m = url.match(/^([a-zA-Z]+\:)\/\/([^\/]*)(\/[^?]*)(\?[^?\/]*)?/);
        if (m == null) {
            return null;
        }

        var path = m[3];
        if (path !== null) {
            path = path.replace(/\/\/*/g, '/');
            path = path.substring(1);
            if (path.length > 1 && path[path.length - 1] === '/') {
                path = path.substring(0, path.length - 1);
            }
        }

        return  {
            protocol: m[1].substring(0, m[1].length - 1),
            host    : m[2],
            path    : path.length === 0 ? null : path,
            qs      : m[4] != null && m[4].length > 1 ? m[4].substring(1) : null
        };
    };

    Path.toURL = function(protocol, host, path, qs) {
        var res = protocol + "://" + (host == null ? '' : host) + "/" + path;
        if (qs != null) {
            res = res + '?' + qs;
        }
        return res;
    };

    /**
     * Get a parent URL of the URL
     * @return  {zebkit.URL} a parent URL
     * @method getParentURL
     */
    Path.getParent = function(path) {
        var url = Path.parseURL(path),
            i   = -1;

        if (url !== null) {
            if (url.path === null) {
                return null;
            } else {
                i = url.path.lastIndexOf('/');
                return (i < 0) ? null
                               : Path.toURL(url.protocol, url.host, url.path.substring(0, i), url.qs);
            }
        }

        path = path.replace(/\/\/*/g, '/');
        if (path.length > 0 && path[path.length - 1] === '/') {
            path = path.substring(0, path.length - 1);
        }

        i = path.lastIndexOf("/");
        return (i <= 0) ? null
                        : path.substring(0, i);
    };

    /**
     * Test if the given url is absolute
     * @param  {String|zebkit.URL}  u an URL
     * @return {Boolean} true if the URL is absolute
     * @method isAbsolute
     * @static
     */
    Path.isAbsolute = function(u) {
        return u[0] === '/' || /^[a-zA-Z]+\:\/\//i.test(u);
    };

    Path.isURL = function(u) {
        return /^[a-zA-Z]+\:\/\//i.test(u);
    };

    /**
     * Join the given relative path to the URL. If the passed path starts from "/" character
     * it will be joined without taking in account the URL path
     * @param  {String} p* a relative paths
     * @return {String} an absolute URL
     * @method join
     */
    Path.join = function() {
        var base = arguments[0],
            bu   = Path.parseURL(base);

        if (bu !== null) {
            base = bu.path === null ? '' : bu.path;
        }

        for(var i = 1; i < arguments.length; i++) {
            if (base.length > 1 && base[base.length - 1] !== '/') {
                base = base + "/";
            }

            var path = arguments[i];
            if (Path.isAbsolute(path)) {
                throw new Error("Absolute path '" + path + "' cannot be joined");
            } else {
                base = base + path;
            }
        }

        return bu !== null ? Path.toURL(bu.protocol, bu.host, base, bu.qs)
                           : base;
    };

    /**
     * Sequential tasks runner. Allows developers to execute number of steps (async and sync) in the
     * exact order they have been called by runner. The ideas of the runner implementation is making the
     * code more readable and plain nevertheless it includes asynchronous parts:
     * @example

            var r = new zebkit.DoIt();

            // step 1
            r.then(function() {
                // call three asynchronous HTTP GET requests to read three files
                // pass join to every async. method to be notified when the async.
                // part is completed
                asyncHttpCall("http://test.com/a.txt", this.join());
                asyncHttpCall("http://test.com/b.txt", this.join());
                asyncHttpCall("http://test.com/c.txt", this.join());
            })
            .  // step 2
            then(function(r1, r2, r3) {
                // handle completely read on previous step files
                r1.responseText  // "a.txt" file content
                r2.responseText  // "b.txt" file content
                r3.responseText  // "c.txt" file content
            })
            . // handle error
            catch(function(e) {
                // called when an exception has occurred
                ...
            });


     * @class zebkit.DoIt
     * @constructor
     */
    function DoIt(body, ignore) {
        this.recover();

        if (arguments.length === 1) {
            if (zebkit.isBoolean(body)) {
                this.$ignoreError = body;
                body = null;
            } else {
                this.then(body);
            }
        } else if (arguments.length === 2) {
            this.$ignoreError = ignore;
            this.then(body);
        }
    }

    DoIt.prototype = {
        // TODO: not stable API
        recover : function(body) {
            if (this.$error !== null) {
                var err = this.$error;
                this.$error = null;
                this.$tasks   = [];
                this.$results = [];
                this.$taskCounter = this.$level = this.$busy = 0;

                if (arguments.length === 1) {
                    body.call(this, err);
                }
            }
        },

        restart : function(showErr) {
            if (this.$error !== null) {
                this.$error = null;
            }
            this.$schedule();
        },

        /**
         * Run the given method as one of the sequential step of the runner execution.
         * @method  then
         * @param  {Function} body a method to be executed. The method can get results of previous step
         * execution as its arguments. The method is called in context of instance of a Do.
         * @chainable
         */
        then : function(body, completed) {
            var level = this.$level;  // store level then was executed for the given task
                                      // to be used to compute correct the level inside the
                                      // method below
            if (body instanceof DoIt) {

                if (body.$error !== null) {
                    this.error(body.$error);
                } else {
                    var $this = this;
                    this.then(function() {
                        var jn = $this.join();
                        body.then(function(res) {
                            if (arguments.length > 0) {
                                // also pass result to body DoIt
                                this.join.apply(this, arguments);
                            }
                        }, function() {
                            if ($this.$error === null) {
                                jn.apply($this, arguments);
                            }
                        }).catch(function(e) {
                            $this.error(e);
                        });
                    });
                }

                return this;
            } else {
                var task = function() {
                    // clean results of execution of a previous task

                    this.$busy = 0;
                    var pc = this.$taskCounter, args = null, r;

                    if (this.$error === null) {
                        args = this.$results[level];

                        this.$taskCounter    = 0;  // we have to count the tasks on this level
                        this.$level          = level + 1;
                        this.$results[level] = [];

                        // it is supposed the call is embedded with other call, no need to
                        // catch it one more time
                        if (level > 0) {
                            r = body.apply(this, args);
                        } else {
                            try {
                                r = body.apply(this, args);
                            } catch(e) {
                                this.error(e);
                            }
                        }

                        // this.$busy === 0 means we have called synchronous task
                        // and make sure the task has returned a result
                        if (this.$busy === 0 && this.$error === null && typeof r !== "undefined") {
                            this.$results[level] = [ r ];
                        }
                    }

                    if (level === 0) {
                        // zero level is responsible for handling exception
                        try {
                            this.$schedule();
                        } catch(e) {
                            this.error(e);
                        }
                    } else {
                        this.$schedule();
                    }

                    this.$level = level; // restore level
                    this.$taskCounter = pc;  // restore counter

                    // TODO: not a graceful solution. It has been done to let call "join" out
                    // outside of body. Sometimes it is required to provide proper level of
                    // execution since join calls schedule
                    if (completed != null) {
                        if (level === 0) {
                            try {
                                if (args === null) completed.call(this);
                                else               completed.apply(this, args);
                            } catch(e) {
                                this.error(e);
                            }
                        } else {
                            if (args === null) completed.call(this);
                            else               completed.apply(this, args);
                        }
                    }
                    if (args != null) args.length = 0;
                };

                if (this.$error === null) {
                    if (level === 0 && this.$busy === 0) {
                        if (this.$results[level] != null && this.$results[level].length > 0) {
                            task.apply(this, this.$results[level]);
                        } else {
                            task.call(this);
                        }
                    } else {
                        // put task in list
                        if (this.$level > 0) {
                            this.$tasks.splice(this.$taskCounter++, 0, task);
                        } else {
                            this.$tasks.push(task);
                        }
                    }
                }
            }

            if (this.$level === 0) {
                this.$schedule();
            }

            return this;
        },

        $ignored : function(e) {
            zebkit.dumpError(e);
        },

        /**
         * Fire error if something goes wrong.
         * @param  {Error} e an error
         * @method error
         */
        error : function(e, pr) {
            if (arguments.length === 0) {
                if (this.$error != null) {
                    zebkit.dumpError(e);
                }
            } else {
                if (this.$error === null) {
                    if (this.$ignoreError) {
                        this.$ignored(e);
                    } else {
                        this.$taskCounter = this.$level = this.$busy = 0;
                        this.$error   = e;
                        this.$results = [];
                    }

                    this.$schedule();
                } else {
                    if (arguments.length < 2 || pr === true) {
                        zebkit.dumpError(e);
                    }
                }
            }

            return this;
        },

        /**
         * Wait before the given runner can be called
         * @param  {zebkit.DoIt} r a runner
         * @chainable
         * @method wait
         */
        till : function(r) {
            // wait till the given DoIt is executed
            this.then(function() {
                var $this = this,
                    jn    = this.join(), // block execution of the runner
                    res   = arguments.length > 0 ? Array.prototype.slice.call(arguments) : []; // save arguments to restore it later

                // call "doit" we are waiting for
                r.then(function() {
                    if ($this.$error === null) {
                        // unblock the doit that waits for the runner we are in and
                        // restore its arguments
                        if (res.length > 0) jn.apply($this, res);
                        else                jn.call($this);

                        // preserve arguments for the next call
                        if (arguments.length > 0) {
                            this.join.apply(this, arguments);
                        }
                    }
                }).catch(function(e) {
                    // delegate error to a waiting runner
                    $this.error(e);
                });
            });

            return this;
        },

        /**
         * Returns join callback for asynchronous parts of the runner. The callback has to be requested and called by
         * an asynchronous method to inform the runner the given method is completed.
         * @return {Function} a method to notify runner the given asynchronous part has been completed. The passed
         * to the method arguments will be passed to the next step of the runner.
         * @method join
         */
        join : function() {
            // if join is called outside runner than level is set to 0
            var level = this.$level === 0 ? 0 : this.$level - 1;

            if (arguments.length > 0) {
                this.$results[level] = [];
                for(var i = 0; i < arguments.length; i++) {
                    this.$results[level][i] = arguments[i];
                }
            } else {
                // TODO: join uses busy flag to identify the result index the given join will supply
                // what triggers a potential result overwriting  problem (jn2 overwrite jn1  result):
                //    var jn1 = join(); jn1();
                //    var jn2 = join(); jn2();

                var $this = this,
                    index = this.$busy++;

                return function() {
                    if ($this.$results[level] == null) {
                        $this.$results[level] = [];
                    }

                    // since error can occur and times variable
                    // can be reset to 0 we have to check it
                    if ($this.$busy > 0) {
                        if (arguments.length > 0) {
                            $this.$results[level][index] = [];
                            for(var i = 0; i < arguments.length; i++) {
                                $this.$results[level][index][i] = arguments[i];
                            }
                        }

                        if (--$this.$busy === 0) {
                            // collect result
                            if ($this.$results[level].length > 0) {
                                var args = $this.$results[level],
                                    res  = [];

                                for(var i = 0; i < args.length; i++) {
                                    Array.prototype.push.apply(res, args[i]);
                                }
                                $this.$results[level] = res;
                            }

                            // TODO: this code can bring to unexpected scheduling for a situation when
                            // doit is still in then:
                            //    then(function () {
                            //        var jn1 = join();
                            //        ...
                            //        jn1()  // unexpected scheduling of the next then since busy is zero
                            //        ...
                            //        var jn2 = join(); // not actual
                            //    })

                            $this.$schedule();
                        }
                    }
                };
            }
        },

        /**
         * Method to catch error that has occurred during the runner sequence execution.
         * @param  {Function} callback a callback to handle the error. The method gets an error
         * that has happened as its argument
         * @chainable
         * @method catch
         */
        catch : function(body) {
            var level = this.$level;  // store level then was executed for the given task
                                      // to be used to compute correct the level inside the
                                      // method below

            var task = function() {
                // clean results of execution of a previous task

                this.$busy = 0;
                var pc = this.$taskCounter;
                if (this.$error !== null) {
                    this.$taskCounter = 0;  // we have to count the tasks on this level
                    this.$level       = level + 1;

                    try {
                        if (typeof body === 'function') {
                            body.call(this, this.$error);
                        } else if (body === null) {

                        } else {
                            zebkit.dumpError(this.$error);
                        }
                    } catch(e) {
                        this.$level       = level; // restore level
                        this.$taskCounter = pc;    // restore counter
                        throw e;
                    }
                }

                if (level === 0) {
                    try {
                        this.$schedule();
                    } catch(e) {
                        this.error(e);
                    }
                } else {
                    this.$schedule();
                }

                this.$level       = level; // restore level
                this.$taskCounter = pc;    // restore counter
            };

            if (this.$level > 0) {
                this.$tasks.splice(this.$taskCounter++, 0, task);
            } else {
                this.$tasks.push(task);
            }

            if (this.$level === 0) {
                this.$schedule();
            }

            return this;
        },

        throw : function(e) {
            return this.catch(function(e) {
                throw e;
            });
        },

        $schedule : function() {
            if (this.$tasks.length > 0 && this.$busy === 0) {
                this.$tasks.shift().call(this);
            }
        },

        end : function() {
            this.recover();
        }
    };


    /**
     * This is the core package that provides powerful easy OOP concept, packaging and number of utility methods.
     * The package has no any dependency from others zebkit packages and can be used independently. Briefly the
     * package possibilities are listed below:

       - **easy OOP concept**. Use "zebkit.Class" and "zebkit.Interface" to declare classes and interfaces

        ```JavaScript
            // declare class A
            var ClassA = zebkit.Class([
                function() {
                    ... // class constructor
                },

                // class method
                function a(p1, p2, p3) { ... }
            ]);

            var ClassB = zebkit.Class(ClassA, [
                function() {  // override constructor
                    this.$super(); // call super constructor
                },

                function a(p1, p2, p3) { // override method "a"
                    this.$super(p1, p2, p3);  // call super implementation of method "a"
                }
            ]);

            var b = new ClassB(); // instantiate classB
            b.a(1,2,3); // call "a"

            // instantiate anonymous class with new method "b" declared and
            // overridden method "a"
            var bb = new ClassB([
                function a(p1, p2, p3) { // override method "a"
                    this.$super(p1, p2, p3);  // call super implementation of method "a"
                },

                function b() { ... } // declare method "b"
            ]);

            b.a();
            b.b();
        ```

       - **Packaging**. Zebkit uses Java-like packaging system where your code is bundled in the number of hierarchical packages.

        ```JavaScript
            // declare package "zebkit.test"
            zebkit.package("test", function(pkg) {
                // declare class "Test" in the package
                pkg.Test = zebkit.Class([ ... ]);
            });

            ...
            // Later on use class "Test" from package "zebkit.test"
            zebkit.require("test", function(test) {
                var test = new test.Test();
            });
        ```

       - **Declaring number of core method and classes**

     * @class zebkit
     * @extends Package
     * @access package
     */

    //  Faster match operation analogues:
    //  Math.floor(f)  =>  ~~(a)
    //  Math.round(f)  =>  (f + 0.5) | 0
    function isString(o)  {
        return typeof o !== "undefined" && o !== null &&
              (typeof o === "string" || o.constructor === String);
    }

    function isNumber(o)  {
        return typeof o !== "undefined" && o !== null &&
              (typeof o === "number" || o.constructor === Number);
    }

    function isBoolean(o) {
        return typeof o !== "undefined" && o !== null &&
              (typeof o === "boolean" || o.constructor === Boolean);
    }

    function lookupObjValue(obj, name) {
        if (arguments.length === 1) {
            name = obj;
            obj = $global;
        }

        if (name == null || name.trim().length === 0) {
            throw new Error("Invalid field name: '" + name + "'");
        }

        var names = name.trim().split('.');
        for(var i = 0; i < names.length; i++) {
            obj = obj[names[i]];
            if (obj == null) {
                return obj;
            }
        }
        return obj;
    }

    function $ls(callback, all) {
        for (var k in this) {
            var v = this[k];
            if (this.hasOwnProperty(k) && (v instanceof Package) === false)  {
                if ((k[0] !== '$' && k[0] !== '_') || all === true) {
                    if (callback.call(this, k, this[k]) === true) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    function $lsall(fn) {
        return $ls.call(this, function(k, v) {
            if (v != null && v.clazz === zebkit.Class) {
                if (typeof v.$name === "undefined") {
                    v.$name = fn + k;
                    v.$pkg  = lookupObjValue($global, fn.substring(0, fn.length - 1));
                }
                return $lsall.call(v, v.$name + ".");
            }
        });
    }

    /**
     *  Package private class. All zebkit packages are inherits the class methods
     *  @class  Package
     *  @private
     */
    function Package(name, parent) {
        /**
         * URL the package has been loaded
         * @attribute $url
         * @readOnly
         * @type {zebkit.URL}
         */
        this.$url = null;

        /**
         * Name of the package
         * @attribute $name
         * @readOnly
         * @type {String}
         */
        this.$name  = name;
        this.config = {};
        this.$ready = new DoIt();

        /**
         * Reference to parent package
         * @attribute $parent
         * @type {Package}
         */
        this.$parent = arguments.length < 2 ? null : parent;

        if (typeof __dirname !== 'undefined') {
            this.$url = __dirname;
        } else if (typeof document !== "undefined") {
            //
            var s  = document.getElementsByTagName('script'),
                ss = s[s.length - 1].getAttribute('src'),
                i  = ss == null ? -1 : ss.lastIndexOf("/"),
                a = document.createElement('a');

            a.href = (i > 0) ? ss.substring(0, i + 1)
                             : document.location.toString();

            this.$url = a.href.toString();
        }
    }

    /**
     * Get full name of the package. Full name includes not the only the given
     * package name, but also all parent packages separated with "." character.
     * @return {String} a full package name
     * @method fullname
     */
    Package.prototype.fullname = function() {
        var n = [ this.$name ], p = this;
        while(p.$parent != null) {
            p = p.$parent;
            n.unshift(p.$name);
        }
        return n.join(".");
    };

    /**
     * Convert file like path to package relatively to the given package.
     * @return {String} path a path
     * @method cd
     */
    Package.prototype.cd = function(path) {
        if (path[0] === '/') {
            path = path.substring(1);
        }

        var paths = path.split('/'),
            pk    = this;

        for (var i = 0; i < paths.length; i++) {
            var pn = paths[i];
            if (pn === "..") {
                pk = pk.$parent;
            } else {
                pk = pk[pn];
            }

            if (pk == null) {
                throw new Error("Package path '" + path + "' cannot be resolved");
            }
        }

        return pk;
    };

    /**
     * List the package sub-packages.
     * @param  {Function} callback    callback function that gets a sub-package name and the
     * sub-package itself as its arguments
     * @param  {boolean}  [recursively]  indicates if sub-packages have to be traversed recursively
     * @method packages
     */
    Package.prototype.packages = function(callback, recursively) {
        for (var k in this) {
            var v = this[k];
            if (k !== "$parent" && this.hasOwnProperty(k) && v instanceof Package) {

                if (callback.call(this, k, v) === true) {
                    return true;
                }

                if (recursively === true) {
                    if (v.packages(callback, recursively) === true) {
                        return true;
                    }
                }
            }
        }

        return false;
    };

    Package.prototype.ls = function(cb, all) {
        return $ls.call(this, cb, all);
    };

    /**
     * Build import JS code string that can be evaluated in a local space to make visible
     * the given package or packages classes, variables and methods.
     * @example
     *
     *     (function() {
     *         // make visible variables, classes and methods declared in "zebkit.ui"
     *         // package in the method local space
     *         eval(zeblit.import("ui"));
     *
     *         // use imported from "zebkit.ui.Button" class without necessity to specify
     *         // full path to it
     *         var bt = new Button("Ok");
     *     })();
     *
     * @param {String} [pkgname]* names of packages to be imported
     * @return {String} an import string to be evaluated in a local JS space
     * @method  import
     */
    Package.prototype.import = function() {
        var code = [];
        if (arguments.length > 0) {
            for(var i = 0; i < arguments.length; i++) {
                var v = lookupObjValue(this, arguments[i]);
                if (v == null || !(v instanceof Package)) {
                    throw new Error("Package '" + arguments[i] + " ' cannot be found");
                }
                code.push(v.import());
            }

            return code.length > 0 ?  code.join(";") : null;
        } else {
            var fn = this.fullname();
            this.ls(function(k, v) {
                code.push(k + '=' + fn + '.' + k);
            });

            return code.length > 0 ?  "var " + code.join(",") + ";" : null;
        }
    };

    /**
     * Method to request sub-package or sub-packages be ready and visible in passed callback or series
     * of callback methods. The method guarantees the callbacks be called the time all zebkit data is
     * loaded and ready.
     * @param {String} [packages]* name or names of sub-packages to make visible
     * in callback method
     * @param {Function} [callback]* a method or number of methods to be called. The methods are called
     * in context of the given package and gets packages passed as first arguments
     * @method  require
     * @example
     *
     *     zebkit.require("ui", function(ui) {
     *         var b = new ui.Button("Ok");
     *         ...
     *     });
     *
     */
    Package.prototype.require = function() {
        var pkgs = [],
            i    = 0,
            fn   = arguments[arguments.length - 1];

        while (isString(arguments[i])) {
            var pkg = lookupObjValue(this, arguments[i]);
            if (pkg == null || !(pkg instanceof Package)) {
                throw new Error("Package '" + arguments[i] + "' cannot be found");
            }
            pkgs.push(pkg);
            i++;
        }

        var $this = this;
        return this.then(function() {
            fn.apply($this, pkgs);
        });
    };

    Package.prototype.then = function(f) {
        this.$ready.then(f).catch(function(e) {
            zebkit.dumpError(e)
            // re-start other waiting tasks
            this.restart();
        });
        return this;
    };

    Package.prototype.join = function() {
        return this.$ready.join.apply(this.$ready, arguments);
    };

    /**
     * Method that has to be used to declare package.
     * @param  {String}   name     a name of the package
     * @param  {Function} [callback] a call back method that is called in package context. The method has to
     * be used to populate the given package classes, interfaces and variables.
     * @example
     *     // declare package "zebkit.log"
     *     zebkit.package("log", function(pkg) {
     *         // declare the package class Log
     *         pkg.Log = zebkit.Class([
     *              function error() { ... },
     *              function warn()  { ... },
     *              function info()  { ... }
     *         ]);
     *     });
     *
     *     // later on you can use the declared package stuff as follow
     *     zebkit.require("log", function(log) {
     *         var myLog = new log.Log();
     *         ...
     *         myLog.warn("Warning");
     *     });
     *
     * @return {Package} a package
     * @method package
     * @for zebkit
     */
    Package.prototype.package = function(name, callback) {
        // no arguments than return the package itself
        if (arguments.length === 0) {
            return this;
        }

        var target = this;
        if (typeof arguments[0] !== 'function') {
            if (name == null) {
                throw new Error("Null package name");
            }

            name = name.trim();
            if (name.match(/^[a-zA-Z_][a-zA-Z0-9_]+(\.[a-zA-Z_][a-zA-Z0-9_]+)*$/) === null) {
                throw new Error("Invalid package name '" + name + "'");
            }

            var names = name.split('.');
            for(var i = 0, k = names[0]; i < names.length; i++, k = k + '.' + names[i]) {
                var n = names[i], p = target[n];
                if (typeof p === "undefined") {
                    p = new Package(n, target);
                    target[n] = p;
                } else {
                    if ((p instanceof Package) === false) {
                        throw new Error("Requested package '" + name +  "' conflicts with variable '" + n + "'");
                    }
                }
                target = p;
            }
        }

        if (typeof arguments[arguments.length - 1] === 'function') {
            var f = arguments[arguments.length - 1];

            this.then(function() {
                f.call(target, target, typeof zebkit !== 'undefined' ? zebkit.Class : null);
                $lsall.call(target, target.fullname() + "."); // resolve "clazz.$name" properties of the package classes
            });
        }

        return target;
    };

    // =================================================================================================
    //
    //   Zebkit root package declaration
    //
    // =================================================================================================
    var zebkit = new Package("zebkit");
    zebkit.environment = zenv;


    zebkit.package(function(pkg) {
        var $$$     = 11,  // hash code counter
            $caller = null; // currently called method reference

        // single method proxy wrapper
        function ProxyMethod(name, f, clazz) {
            if (typeof f.methodBody !== "undefined") {
                throw new Error("Proxy method '" + name + "' cannot be wrapped");
            }

            var a = function() {
                var cm = $caller;
                $caller = a;
                // don't use finally section it is slower than try-catch
                try {
                    var r = f.apply(this, arguments);
                    $caller = cm;
                    return r;
                } catch(e) {
                    $caller = cm;
                    console.log(name + "(" + arguments.length + ") " + (e.stack ? e.stack : e));
                    throw e;
                }
            };

            a.methodBody = f;
            a.methodName = name;
            a.boundTo    = clazz;
            return a;
        }

        // copy methods from source to destination
        function cpMethods(src, dest, clazz) {
            var overriddenAbstractMethods = 0;
            for(var name in src) {
                if (src.hasOwnProperty(name) &&
                    name   !== pkg.CNAME     &&
                    name   !== "clazz"         )
                {
                    var method = src[name];
                    if (typeof method === "function" && method !== $toString) {
                        if (name === "$prototype") {
                            method.call(dest, clazz);
                        } else {
                            var old = dest[name];

                            // TODO analyze if we overwrite existent field
                            if (old != null) {

                                // abstract method is overridden, let's skip abstract method
                                // stub implementation
                                if (method.$isAbstract === true) {
                                    overriddenAbstractMethods++;
                                    continue;
                                }

                                if (old.boundTo === clazz) {
                                    throw new Error("Method '" + name + "(...)'' bound to this class already exists");
                                }
                            }

                            if (typeof method.methodBody !== "undefined") {
                                dest[name] = ProxyMethod(name, method.methodBody, clazz);
                            } else {
                                dest[name] = ProxyMethod(name, method, clazz);
                            }

                            // save information about abstract method
                            if (method.$isAbstract === true) {
                                dest[name].$isAbstract = true;
                            }
                        }
                    }
                }
            }

            return overriddenAbstractMethods;
        }

        function $toString() {
            return this.$hash$;
        }

        // return function that is meta class
        //  instanceOf      - parent template function (can be null)
        //  templateConstructor - template function,
        //  inheritanceList     - parent class and interfaces
        function make_template(instanceOf, templateConstructor, inheritanceList) {
            // supply template with unique identifier that is returned with toString() method
            templateConstructor.$hash$   = "$zEk$" + ($$$++);
            templateConstructor.toString = $toString;
            templateConstructor.prototype.clazz = templateConstructor; // instances of the template has to point to the template as a class

            templateConstructor.clazz = templateConstructor.constructor = instanceOf;

            /**
             *  Unique string hash code.
             *  @attribute $hash$
             *  @private
             *  @type {String}
             *  @for  zebkit.Class
             *  @readOnly
             */

            /**
             * Dictionary of all inherited interfaces where key is unique interface hash code and the value
             * is interface itself.
             * @private
             * @readOnly
             * @for zebkit.Class
             * @type {Object}
             * @attribute $parents
             * @type {Object}
             */
            templateConstructor.$parents = {};

            // instances of the constructor also has to be unique
            // so force toString method population
            templateConstructor.prototype.toString    = $toString;
            templateConstructor.prototype.constructor = templateConstructor; // set constructor of instances to the template

            // setup parent entities
            if (inheritanceList != null && inheritanceList.length > 0) {
                for(var i = 0; i < inheritanceList.length; i++) {
                    var toInherit = inheritanceList[i];
                    if (toInherit == null                       ||
                        typeof toInherit        !== "function"  ||
                        typeof toInherit.$hash$ === "undefined"   )
                    {
                        throw new ReferenceError("Invalid parent class or interface:" + toInherit);
                    }

                    if (typeof templateConstructor.$parents[toInherit.$hash$] !== "undefined") {
                        throw Error("Duplicate toInherit class or interface: " + toInherit);
                    }

                    templateConstructor.$parents[toInherit.$hash$] = toInherit;

                    // if parent has own parents copy the parents references
                    for(var k in toInherit.$parents) {
                        // some interfaces like abstract can require don't be inherited in kids
                        if (toInherit.$parents[k].$lostMe !== true) {
                            if (typeof templateConstructor.$parents[k] !== "undefined") {
                                throw Error("Duplicate inherited class or interface: " + k);
                            }

                            templateConstructor.$parents[k] = toInherit.$parents[k];
                        }
                    }
                }
            }
            return templateConstructor;
        }

        pkg.dumpError = function(e) {
            if (typeof console !== "undefined" && typeof console.log !== "undefined") {
                var msg = "zebkit.err [";
                if (typeof Date !== 'undefined') {
                    var date = new Date();
                    msg = msg + date.getDate()   + "/" +
                          (date.getMonth() + 1) + "/" +
                          date.getFullYear() + " " +
                          date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
                }

                console.log(msg + "] : " + e);
                if (e == null) {
                    console.log("Unknown error");
                } else {
                    console.log((e.stack ? e.stack : e));
                }
            }
        };

        pkg.Path = Path;

        pkg.CNAME = '$';
        pkg.CDNAME = '';

        pkg.$FN = (isString.name !== "isString") ? (function(f) {  // IE stuff
                                                        if (f.$methodName == null) { // test if name has been earlier detected
                                                            var mt = f.toString().match(/^function\s+([^\s(]+)/);
                                                            f.$methodName = (mt == null) ? pkg.CDNAME
                                                                                         : (typeof mt[1] === "undefined" ? pkg.CDNAME
                                                                                                                         : mt[1]);
                                                        }
                                                        return f.$methodName;
                                                    })
                                                 : (function(f) { return f.name; });


        pkg.isIE    = isInBrowser && (Object.hasOwnProperty.call(window, "ActiveXObject") || !!window.ActiveXObject);
        pkg.isFF    = isInBrowser && window.mozInnerScreenX != null;
        pkg.isMacOS = isInBrowser && navigator.platform.toUpperCase().indexOf('MAC') !== -1;

        /**
         * Check if the given value is string
         * @param {Object} v a value.
         * @return {Boolean} true if the given value is string
         * @method isString
         * @for zebkit
         */
        pkg.isString = isString;

        /**
         * Check if the given value is number
         * @param {Object} v a value.
         * @return {Boolean} true if the given value is number
         * @method isNumber
         * @for zebkit
         */
        pkg.isNumber = isNumber;

        /**
         * Check if the given value is boolean
         * @param {Object} v a value.
         * @return {Boolean} true if the given value is boolean
         * @method isBoolean
         * @for zebkit
         */
        pkg.isBoolean = isBoolean;

        /**
         * Reference to global space.
         * @attribute $global
         * @private
         * @readOnly
         * @type {Object}
         * @for zebkit
         */
        pkg.$global = $global;


        pkg.$Map = function() {
            var Map = function() {
                this.keys   = [];
                this.values = [];
                this.size   = 0 ;
            };

            Map.prototype = {
                set : function(key, value) {
                    var i = this.keys.indexOf(key);
                    if (i < 0) {
                        this.keys.push(key);
                        this.values.push(value);
                        this.size++;
                    } else {
                       this.values[i] = value;
                    }
                    return this;
                 },

                delete: function(key) {
                    var i = this.keys.indexOf(key);
                    if (i < 0) {
                       return false;
                    }

                    this.keys.splice(i, 1);
                    this.values.splice(i, 1);
                    this.size--;
                    return true;
                },

                get : function(key) {
                    var i = this.keys.indexOf(key);
                    return i < 0 ? undefined : this.values[i];
                },

                clear : function() {
                    this.keys = [];
                    this.keys.length = 0;
                    this.values = [];
                    this.values.length = 0;
                    this.size = 0;
                },

                has : function(key) {
                    return this.keys.indexOf(key) >= 0;
                },

                forEach: function(callback, context) {
                    var $this = context == null ? this : context;
                    for(var i = 0 ; i < this.size; i++) {
                        callback.call($this, this.values[i], this.keys[i], this);
                    }
                }
            };

            return Map;
        };

        // ES6 Map is class
        if (typeof Map === 'undefined' && (typeof pkg.$global !== 'undefined' || typeof pkg.$global.Map === "undefined")) {
            pkg.$global.Map = pkg.$Map();
        }

        /**
         * Clone the given object
         * @param  {Object} obj an object to be cloned
         * @return {Object} a cloned object
         * @method  clone
         * @for  zebkit
         */
        pkg.clone = function (obj, map) {
            // clone atomic type
            if (obj == null || pkg.isString(obj) || pkg.isBoolean(obj) || pkg.isNumber(obj)) {
                return obj;
            }

            if (obj.$notClonable === true) {
                return obj;
            }

            map = map || new Map();
            var t = map.get(obj);
            if (typeof t !== "undefined") {
                return t;
            }

            // clone with provided custom "clone" method
            if (typeof obj.$clone !== "undefined") {
                return obj.$clone(map);
            }

            // clone array
            if (Array.isArray(obj)) {
                var naobj = [];

                map.set(obj, naobj);
                map[obj] = naobj;

                for(var i = 0; i < obj.length; i++) {
                    naobj[i] = pkg.clone(obj[i], map);
                }
                return naobj;
            }

            // clone class
            if (obj.clazz === pkg.Class) {
                var clazz = pkg.Class(obj, []);
                clazz.inheritProperties = true;
                return clazz;
            }

            // function cannot be cloned
            if (typeof obj === 'function' || obj.constructor !==  Object) {
                return obj;
            }

            var nobj = {};
            map.set(obj, nobj);

            // clone object fields
            for(var k in obj) {
                if (obj.hasOwnProperty(k) === true) {
                    nobj[k] = pkg.clone(obj[k], map);
                }
            }

            return nobj;
        };

        /**
         * Instantiate a new class instance of the given class with the specified constructor
         * arguments.
         * @param  {Function} clazz a class
         * @param  {Array} [args] an arguments list
         * @return {Object}  a new instance of the given class initialized with the specified arguments
         * @method newInstance
         * @for  zebkit
         */
        pkg.newInstance = function(clazz, args) {
            if (args && args.length > 0) {
                function f() {}
                f.prototype = clazz.prototype;
                var o = new f();
                clazz.apply(o, args);
                return o;
            }
            return new clazz();
        };

        /**
         * Get a property setter method if it is declared with the class of the specified object for the
         * given property. Setter is a method whose name matches the following pattern: "set<PropertyName>"
         * where the first letter of the property name is in upper case. For instance setter method for
         * property "color" has to have name "setColor".
         * @param  {Object} obj an object instance
         * @param  {String} name a property name
         * @return {Function}  a method that can be used as a setter for the given property
         * @method  getPropertySetter
         * @protected
         * @for  zebkit
         */
        pkg.getPropertySetter = function(obj, name) {
            var pi = obj.constructor.$propertyInfo;
            if (pi != null) {
                if (typeof pi[name] === "undefined") {
                    var m = obj[ "set" + name[0].toUpperCase() + name.substring(1) ];
                    pi[name] = (typeof m  === "function") ? m : null;
                }
                return pi[name];
            }

            var m = obj[ "set" + name[0].toUpperCase() + name.substring(1) ];
            return (typeof m  === "function") ? m : null;
        };

        /**
         * Populate the given target object with the properties set. The properties set
         * is a dictionary that keeps properties names and its corresponding values.
         * The method detects if a property setter method exits and call it to apply
         * the property value. Otherwise property is initialized as a field. Setter
         * method is a method that matches "set<PropertyName>" pattern.
         * @param  {Object} target a target object
         * @param  {Object} p   a properties set
         * @return {Object} an object with the populated properties set.
         * @method  properties
         * @for  zebkit
         */
        pkg.properties = function(target, p) {
            for(var k in p) {
                // skip private properties( properties that start from "$")
                if (k !== "clazz" && k[0] !== '$' && p.hasOwnProperty(k) && typeof p[k] !== "undefined" && typeof p[k] !== 'function') {
                    if (k[0] === '-') {
                        delete target[k.substring(1)];
                    } else {
                        var v = p[k],
                            m = zebkit.getPropertySetter(target, k);

                        // value factory detected
                        if (v !== null && v.$new != null) {
                            v = v.$new();
                        }

                        if (m === null) {
                            target[k] = v;  // setter doesn't exist, setup it as a field
                        } else {
                            // property setter is detected, call setter to
                            // set the property value
                            if (Array.isArray(v)) m.apply(target, v);
                            else                  m.call(target, v);
                        }
                    }
                }
            }
            return target;
        };

        function $make_proto(props, superProto) {
            if (superProto == null) {
                return function $prototype(clazz) {
                    for(var k in props) {
                        if (props.hasOwnProperty(k)) {
                            this[k] = props[k];
                        }
                    }
                };
            } else {
                return function $prototype(clazz) {
                    if (superProto != null) {
                        superProto.call(this, clazz);
                    }

                    for(var k in props) {
                        if (props.hasOwnProperty(k)) {
                            this[k] = props[k];
                        }
                    }
                };
            }
        }

        /**
         * Interface is way to share common functionality by avoiding multiple inheritance.
         * It allows developers to mix number of methods to different classes. For instance:

                // declare "I" interface that contains one method a
                var I = zebkit.Interface([
                    function a() {

                    }
                ]);

                // declare "A" class
                var A = zebkit.Class([]);

                // declare "B" class that inherits class A and mix interface "I"
                var B = zebkit.Class(A, I, []);

                // instantiate "B" class
                var b = new B();
                zebkit.instanceOf(b, I);  // true
                zebkit.instanceOf(b, A);  // true
                zebkit.instanceOf(b, B);  // true

                // call mixed method
                b.a();

         * @return {Function} an interface
         * @param {Array} [methods] list of methods declared in the interface
         * @constructor
         * @class  zebkit.Interface
         */
        pkg.Interface = make_template(null, function() {
            var $Interface = make_template(pkg.Interface, function() {
                // Clone interface  parametrized with the given properties set
                if (typeof this === 'undefined' || this.constructor !== $Interface) {  // means the method execution is not a result of "new" method
                    if (arguments.length !== 1) {
                        throw new Error("Invalid number of arguments. Properties set is expected");
                    }

                    if (arguments[0].constructor !== Object) {
                        throw new Error("Invalid argument type. Properties set is expected");
                    }

                    var clone = $Interface.$clone();
                    clone.prototype.$prototype = $make_proto(arguments[0],
                                                             $Interface.prototype.$prototype);
                    return clone;
                } else {
                    // Create a class that inherits the interface and instantiate it
                    if (arguments.length > 1) {
                        throw new Error("One or zero argument is expected");
                    }
                    return new (pkg.Class($Interface, arguments.length > 0 ? arguments[0] : []))();
                }
            }, null);

            if (arguments.length > 1) {
                throw new Error("Invalid number of arguments. List of methods or properties is expected");
            }

            // abstract method counter, not used now, but can be used in the future
            // to understand if the given class override all abstract methods (should be
            // controlled in the places of "cpMethods" call)
            $Interface.$abstractMethods = 0;

            var arg = arguments.length === 0 ? [] : arguments[0];
            if (arg.constructor === Object) {
                arg = [ $make_proto(arg, null) ];
            } else {
                if (Array.isArray(arg) === false) {
                    throw new Error("Invalid argument type. List of methods pr properties is expected");
                }
            }

            if (arg.length > 0) {
                var  proto      = $Interface.prototype,
                     isAbstract = false;

                for(var i = 0; i < arg.length; i++) {
                    var method = arg[i];

                    if (method === "abstract") {
                        isAbstract = true;
                    } else {
                        if (typeof method !== "function") {
                            throw new Error("Method is expected instead of " + method);
                        }

                        var name = pkg.$FN(method);
                        if (name === pkg.CDNAME) {
                            throw new Error("Constructor declaration is not allowed in interface");
                        }

                        if (proto[name] != null) {
                            throw new Error("Duplicated interface method '" + name + "(...)'");
                        }

                        if (name === "$clazz") {
                            method.call($Interface, $Interface);
                        } else if (isAbstract) {
                            (function(name) {
                                proto[name] = function() {
                                    throw new Error("Abstract method '" + name + "(...)' is not implemented");
                                };

                                // mark method as abstract
                                proto[name].$isAbstract = true;

                                // count abstract methods
                                $Interface.$abstractMethods++;
                            })(name);
                        } else {
                            proto[name] = method;
                        }
                    }
                }
            }

            $Interface.$clone = function() {
                var clone = pkg.Interface(); // create interface

                // clone interface level variables
                for(var k in this) {
                    if (this.hasOwnProperty(k)) {
                        clone[k] = pkg.clone(this[k]);
                    }
                }

                // copy methods from proto
                var proto = this.prototype;
                for(var k in proto) {
                    if (k !== "clazz" && proto.hasOwnProperty(k)) {
                        clone.prototype[k] = pkg.clone(proto[k]);
                    }
                }

                return clone;
            };

            // assign name
            $Interface.clazz.$name = "zebkit.Interface";
            return $Interface;
        });

        // TODO: not clear if the code should allow classes instantiation
        // (classes that inherit the abstract interface)
        var $Abstract = pkg.Interface();
        $Abstract.$lostMe  = true;
        $Abstract.$fromPkg = null;

        $Abstract.newAbstractInstance = function newAbstractInstance(clazz, args) {
            var foundClazz = null;

            function visit(target) {
                for(var k in target) {
                    if (target.hasOwnProperty(k) && k[0] !== '$') {
                        var clz = target[k];
                        if (clz != null) {
                            if (clz.clazz === zebkit.Class)  {
                                if (clz.clazz !== clazz && clz.isInherit(clazz) && clz.$isAbstract !== true) {
                                    foundClazz = clz;
                                    return true;
                                }
                            } else if (clz instanceof Package) {
                                if (visit(clz) === true) {
                                    return true;
                                }
                            }
                        }
                    }
                }

                return false;
            }

            // TODO: not very good and performance implementation
            if (this.$fromPkg !== null) {
                visit(this.$fromPkg);
            } else {
                var rp = typeof clazz.$pkg === 'undefined' ? zebkit : clazz.$pkg;
                visit(rp);
                if (foundClazz == null && rp !== zebkit) {
                    visit(zebkit);
                }
            }

            if (foundClazz !== null) {
                return pkg.newInstance(foundClazz, args);
            } else {
                if (clazz.prototype[pkg.CNAME] != null) {
                    var fakeImpl = zebkit.Class(clazz,[]);
                    return pkg.newInstance(fakeImpl, args);
                } else {
                    throw new Error("Abstract class implementation cannot be found");
                }
            }
        };

        pkg.Abstract = function(pkg) {
            if (arguments.length === 0) {
                return $Abstract;
            } else {
                var ab = $Abstract();

                if (pkg instanceof Package) {
                    ab.$fromPkg = pkg;
                } else {
                    throw new Error("Invalid lookup package '" +  pkg + "'");
                }
                return ab;
            }
        };

        /**
         * Core method method to declare a zebkit class following easy OOP approach. The easy OOP concept
         * supports the following OOP features:
         *
         *
         *  __Single class inheritance.__ Any class can extend an another zebkit class

            // declare class "A" that with one method "a"
            var A = zebkit.Class([
                function a() { ... }
            ]);

            // declare class "B" that inherits class "A"
            var B = zebkit.Class(A, []);

            // instantiate class "B" and call method "a"
            var b = new B();
            b.a();


        * __Class method overriding.__ Override a parent class method implementation

                // declare class "A" that with one method "a"
                var A = zebkit.Class([
                    function a() { ... }
                ]);

                // declare class "B" that inherits class "A"
                // and overrides method a with an own implementation
                var B = zebkit.Class(A, [
                    function a() { ... }
                ]);


        * __Constructors.__ Constructor is a method with empty name

                // declare class "A" that with one constructor
                var A = zebkit.Class([
                    function () { this.variable = 100; }
                ]);

                // instantiate "A"
                var a = new A();
                a.variable // variable is 100

        * __Static methods and variables declaration.__ Static fields and methods can be defined
            by declaring special "$clazz" method whose context is set to declared class

                var A = zebkit.Class([
                    // special method where static stuff has to be declared
                    function $clazz() {
                        // declare static field
                        this.staticVar = 100;
                        // declare static method
                        this.staticMethod = function() {};
                    }
                ]);

                // access static field an method
                A.staticVar      // 100
                A.staticMethod() // call static method

        * __Access to super class context.__ You can call method declared in a parent class

                // declare "A" class with one class method "a(p1,p2)"
                var A = zebkit.Class([
                    function a(p1, p2) { ... }
                ]);

                // declare "B" class that inherits "A" class and overrides "a(p1,p2)" method
                var B = zebkit.Class(A, [
                    function a(p1, p2) {
                        // call "a(p1,p2)" method implemented with "A" class
                        this.$super(p1,p2);
                    }
                ]);

         *
         *  One of the powerful feature of zebkit easy OOP concept is possibility to instantiate
         *  anonymous classes and interfaces. Anonymous class is an instance of an existing
         *  class that can override the original class methods with own implementations, implements
         *  own list of interfaces and methods. In other words the class instance customizes class
         *  definition for the particular instance of the class;

                    // declare "A" class
                    var A = zebkit.Class([
                        function a() { return 1; }
                    ]);

                    // instantiate anonymous class that add an own implementation of "a" method
                    var a = new A([
                        function a() { return 2; }
                    ]);
                    a.a() // return 2

         * @param {zebkit.Class} [inheritedClass] an optional parent class to be inherited
         * @param {zebkit.Interface} [inheritedInterfaces]* an optional list of interfaces for
         * the declared class to be mixed in the class
         * @param {Array} methods list of declared class methods. Can be empty array.
         * @return {Function} a class definition
         * @constructor
         * @class zebkit.Class
         */
        var mixing = pkg.$mixing = function(clazz, methods) {
            if (Array.isArray(methods) === false) {
                throw new Error("Methods array is expected (" + methods + ")");
            }

            var names = {};
            for(var i = 0; i < methods.length; i++) {
                var method     = methods[i],
                    methodName = pkg.$FN(method);

                // detect if the passed method is proxy method
                if (method.methodBody != null) {
                    throw new Error("Proxy method '" + methodName + "' cannot be mixed in a class");
                }

                // map user defined constructor to internal constructor name
                if (methodName === pkg.CDNAME) {
                    methodName = pkg.CNAME;
                } else {
                    if (methodName[0] === "$") {
                        // populate prototype fields if a special method has been defined
                        if (methodName === "$prototype") {
                            method.call(clazz.prototype, clazz);
                            if (clazz.prototype[pkg.CDNAME]) {
                                clazz.prototype[pkg.CNAME] = clazz.prototype[pkg.CDNAME];
                                delete clazz.prototype[pkg.CDNAME];
                            }
                            continue;
                        }

                        // populate class level fields if a special method has been defined
                        if (methodName === "$clazz") {
                            method.call(clazz);
                            continue;
                        }
                    }
                }

                if (names[methodName] === true) {
                    throw new Error("Duplicate declaration of '" + methodName+ "(...)' method");
                }

                var existentMethod = clazz.prototype[methodName];
                if (typeof existentMethod !== 'undefined' && typeof existentMethod !== 'function') {
                    throw new Error("'" + methodName + "(...)' method clash with a field");
                }

                // if constructor doesn't have super definition than let's avoid proxy method
                // overhead
                if (existentMethod == null && methodName === pkg.CNAME) {
                    clazz.prototype[methodName] = method;
                } else {
                    // Create and set proxy method that is bound to the given class
                    clazz.prototype[methodName] = ProxyMethod(methodName, method, clazz);
                }

                // save method we have already added to check double declaration error
                names[methodName] = true;
            }
        };

        // create Class template what means we define a function (meta class) that has to be used to define
        // Class. That means we define a function that returns another function that is a Class
        pkg.Class = make_template(null, function() {
            if (arguments.length === 0) {
                throw new Error("No class method list was found");
            }

            if (Array.isArray(arguments[arguments.length - 1]) === false) {
                throw new Error("No class methods have been passed");
            }

            if (arguments.length > 1 && typeof arguments[0] !== "function")  {
                throw new ReferenceError("Invalid parent class or interface '" + arguments[0] + "'");
            }

            var classMethods = arguments[arguments.length - 1],
                parentClass  = null,
                toInherit    = [];

            // detect parent class in inheritance list as the first argument that has "clazz" set to Class
            if (arguments.length > 0 && (arguments[0] == null || arguments[0].clazz === pkg.Class)) {
                parentClass = arguments[0];
            }

            // use instead of slice for performance reason
            for(var i = 0; i < arguments.length - 1; i++) {
                toInherit[i] = arguments[i];

                // let's make sure we inherit interface
                if (parentClass === null || i > 0) {
                    if (toInherit[i] == null) {
                        throw new ReferenceError("Undefined inherited interface [" + i + "] " );
                    } else if (toInherit[i].clazz !== pkg.Interface) {
                        throw new ReferenceError("Inherited interface is not an Interface ( [" + i + "] " + toInherit[i] + ")");
                    }
                }
            }

            // define Class (function) that has to be used to instantiate the class instance
            var classTemplate = make_template(pkg.Class, function() {
                // TODO: this unique string building takes time
                // in general this is not required except the case of tree component model and UI tree
                // component where component instance is stored as key in {} object
                this.$hash$ = "$ZkIo" + ($$$++);

                if (arguments.length > 0) {
                    var a = arguments[arguments.length - 1];

                    // anonymous is customized class instance if last arguments is array of functions
                    if (Array.isArray(a) === true && typeof a[0] === 'function') {
                        a = a[0];

                        // prepare arguments list to declare an anonymous class
                        var args = [ classTemplate ],      // first of all the class has to inherit the original class
                            k    = arguments.length - 2;

                        // collect interfaces the anonymous class has to implement
                        for(; k >= 0 && arguments[k].clazz === pkg.Interface; k--) {
                            args.push(arguments[k]);
                        }

                        // add methods list
                        args.push(arguments[arguments.length - 1]);

                        var cl = pkg.Class.apply(null, args),  // declare new anonymous class
                            // create a function to instantiate an object that will be made the
                            // anonymous class instance. The intermediate object is required to
                            // call constructor properly since we have arguments as an array
                            f  = function() {};

                        cl.$name = classTemplate.$name; // the same class name for anonymous
                        f.prototype = cl.prototype; // the same prototypes

                        var o = new f();

                        // call constructor
                        // use array copy instead of cloning with slice for performance reason
                        // (Array.prototype.slice.call(arguments, 0, k + 1))
                        args = [];
                        for (var i = 0; i < k + 1; i++) {
                            args[i] = arguments[i];
                        }
                        cl.apply(o, args);

                        // set constructor field for consistency
                        o.constructor = cl;
                        return o;
                    }
                }

                // abstract class
                var abstract = this.clazz.$parents[$Abstract];
                if (abstract != null) {
                    return abstract.newAbstractInstance(this.clazz, arguments);
                }

                // call class constructor
                var res;
                if (this[pkg.CNAME] != null) {
                    res = this[pkg.CNAME].apply(this, arguments);
                }

                return res;
            }, toInherit);

            // prepare fields that caches the class properties
            classTemplate.$propertyInfo = {};

            /**
             *  Reference to a parent class
             *  @attribute $parent
             *  @type {zebkit.Class}
             *  @protected
             *  @readOnly
             */

            // copy parents prototype methods and fields into
            // new class template
            classTemplate.$parent = parentClass;
            if (parentClass !== null) {
                for(var k in parentClass.prototype) {
                    if (parentClass.prototype.hasOwnProperty(k)) {
                        var f = parentClass.prototype[k];
                        classTemplate.prototype[k] = (f != null && f.methodBody != null) ? ProxyMethod(f.methodName, f.methodBody, f.boundTo)
                                                                                         : f;
                    }
                }
            }

            /**
             * Extend existent class instance with the given methods and interfaces
             * For example:

                var A = zebkit.Class([ // declare class A that defines one "a" method
                    function a() {
                        console.log("A:a()");
                    }
                ]);

                var a = new A();
                a.a();  // show "A:a()" message

                A.a.extend([
                    function b() {
                        console.log("EA:b()");
                    },

                    function a() {   // redefine "a" method
                        console.log("EA:a()");
                    }
                ]);

                a.b(); // show "EA:b()" message
                a.a(); // show "EA:a()" message

             * @param {zebkit.Interface} [interfaces]* interfaces to be implemented with the
             * class instance
             * @param {Array} methods list of methods the class instance has to be extended
             * with
             * @method extend
             * @for zebkit.Class
             */
            classTemplate.prototype.extend = function() {
                var clazz = this.clazz,
                    l = arguments.length,
                    f = arguments[l - 1],
                    hasArray = Array.isArray(f);

                // replace the instance class with a new intermediate class
                // that inherits the replaced class. it is done to support
                // $super method calls.
                if (this.$isExtended !== true) {
                    clazz = pkg.Class(clazz, []);
                    this.$isExtended = true;         // mark the instance as extended to avoid double extending.
                    clazz.$name = this.clazz.$name;
                    this.clazz = clazz;
                }

                if (hasArray) {
                    var init = null;
                    for(var i = 0; i < f.length; i++) {
                        var n = pkg.$FN(f[i]);
                        if (n === pkg.CDNAME) {
                            init = f[i];  // postpone calling initializer before all methods will be defined
                        } else {
                            if (typeof this[n] !== 'undefined' && typeof this[n] !== 'function') {
                                throw new Error("Method '" + n + "' clash with a property");
                            }
                            this[n] = ProxyMethod(n, f[i], clazz);
                        }
                    }

                    if (init != null) {
                        init.call(this);
                    }
                    l--;
                }

                // add new interfaces if they has been passed
                for (var i = 0; i < arguments.length - (hasArray ? 1 : 0); i++) {
                    if (arguments[i].clazz !== pkg.Interface) {
                        throw new Error("Invalid argument " + arguments[i] + " Interface is expected.");
                    }

                    var I = arguments[i];
                    if (clazz.$parents[I.$hash$] != null) {
                        throw new Error("Interface has been already inherited");
                    }

                    cpMethods(I.prototype, this, clazz);

                    clazz.$parents[I.$hash$] = I;

                    // call interface initializer
                    if (I.prototype[pkg.CNAME] != null) {
                        I.prototype[pkg.CNAME].call(this);
                    }
                }
                return this;
            };

            /**
             * Call super method implementation.
             * @param {Function} [superMethod]? optional parameter that should be a method of the class instance
             * that has to be called
             * @param {Object} [args]* arguments list to pass the executed method
             * @return {Object} return what super method returns
             * @method $super
             * @example
             *
             *    var A = zebkit.Class([
             *        function a(p) { return 10 + p; }
             *    ]);
             *
             *    var B = zebkit.Class(A, [
             *        function a(p) {
             *            return this.$super(p) * 10;
             *        }
             *    ]);
             *
             *    var b = new B();
             *    b.a(10) // return 200
             *
             * @for zebkit.Class
             */
            classTemplate.prototype.$super = function() {
               if ($caller !== null) {
                    var $s = $caller.boundTo.$parent;

                    while ($s !== null) {
                        var m = $s.prototype[$caller.methodName];
                        if (m != null) {
                            return m.apply(this, arguments);
                        }
                        $s = $s.$parent;
                    }

                    // handle method not found error
                    var cln = this.clazz && this.clazz.$name ? this.clazz.$name + "." : "";
                    throw new ReferenceError("Method '" +
                                             cln +
                                             ($caller.methodName === pkg.CNAME ? "constructor"
                                                                               : $caller.methodName) + "(" + arguments.length + ")" + "' not found");
                } else {
                    throw new Error("$super is called outside of class context");
                }
            };

            // TODO: not stable API, $super that doesn't throw exception is there is no super implementation
            classTemplate.prototype.$$super = function() {
               if ($caller !== null) {
                    var $s = $caller.boundTo.$parent;
                    while ($s !== null) {
                        var m = $s.prototype[$caller.methodName];
                        if (m != null) {
                            return m.apply(this, arguments);
                        }
                        $s = $s.$parent;
                    }
                } else {
                    throw new Error("$super is called outside of class context");
                }
            };

            /**
             * Get a first super implementation of the given method in parent classes hierarchy.
             * @param  {String} name a name of the method
             * @return {Function} a super method implementation
             * @method  $getSuper
             * @for  zebkit.Class
             */
            classTemplate.prototype.$getSuper = function(name) {
               if ($caller !== null) {
                   var $s = $caller.boundTo.$parent;
                    while ($s !== null) {
                        var m = $s.prototype[name];
                        if (m != null) {
                            return m;
                        }
                        $s = $s.$parent;
                    }
                    return null;
                }
                throw new Error("$super is called outside of class context");
            };

            classTemplate.prototype.$clone = function(map) {
                map = map || new Map();

                var f = function() {};
                f.prototype = this.constructor.prototype;
                var nobj = new f();
                map.set(this, nobj);

                for(var k in this) {
                    if (this.hasOwnProperty(k)) {
                        // obj's layout is obj itself
                        var t = map.get(this[k]);
                        if (t !== undefined) {
                            nobj[k] = t;
                        } else {
                            nobj[k] = zebkit.clone(this[k], map);
                        }
                    }
                }

                // speed up clearing resources
                map.clear();

                nobj.constructor = this.constructor;
                nobj.$hash$ = "$zObj_" + ($$$++);
                nobj.clazz = this.clazz;
                return nobj;
            };

            /**
             * The instance class.
             * @attribute clazz
             * @type {zebkit.Class}
             */
            classTemplate.prototype.clazz = classTemplate;

            // check if the method has been already defined in the class
            if (typeof classTemplate.prototype.properties === 'undefined') {
                classTemplate.prototype.properties = function(p) {
                    return pkg.properties(this, p);
                };
            }

            var lans = "Listeners are not supported";

            // check if the method has been already defined in the class
            if (typeof classTemplate.prototype.bind === 'undefined') {
                classTemplate.prototype.bind = function() {
                    if (this._ == null) {
                        throw new Error(lans);
                    }
                    return this._.add.apply(this._, arguments);
                };
            }

            // check if the method has been already defined in the class
            if (typeof classTemplate.prototype.unbind === 'undefined') {
                classTemplate.prototype.unbind = function() {
                    if (this._ == null) {
                        throw new Error(lans);
                    }
                    this._.remove.apply(this._, arguments);
                };
            }

            // copy methods from interfaces before mixing class methods
            if (toInherit.length > 0) {
                for(var i = toInherit[0].clazz === pkg.Interface ? 0 : 1; i < toInherit.length; i++) {
                    var  ic = toInherit[i];
                    cpMethods(ic.prototype, classTemplate.prototype, classTemplate);

                    // copy static fields from interface to the class
                    for(var k in ic) {
                        if (k[0] !== '$' &&
                            ic.hasOwnProperty(k) &&
                            classTemplate.hasOwnProperty(k) === false)
                        {
                            classTemplate[k] = pkg.clone(ic[k]);
                        }
                    }
                }
            }

            // add class declared methods
            mixing(classTemplate, classMethods);

            // populate static fields
            // TODO: exclude the basic static methods and static constant
            // static inheritance
            if (parentClass != null) {
                for (var key in parentClass) {
                    if (key[0] !== '$' &&
                        parentClass.hasOwnProperty(key) &&
                        classTemplate.hasOwnProperty(key) === false)
                    {
                        classTemplate[key] = pkg.clone(parentClass[key]);
                    }
                }
            }

            // add extend method later to avoid the method be inherited as a class static field
            classTemplate.extend = function() {
                var methods    = arguments[arguments.length - 1],
                    hasMethod  = Array.isArray(methods);

                // inject class
                if (hasMethod && this.$isExtended !== true) {
                    // create intermediate class
                    var srcClazz = this,
                        A = this.$parent != null ? pkg.Class(this.$parent, [])
                                                 : pkg.Class([]);

                    // copy this class prototypes methods to intermediate class A and re-define
                    // boundTo to the intermediate class A if they were bound to source class
                    // methods that have been  moved from source class to class have to be re-bound
                    // to A class
                    for(var name in this.prototype) {
                        if (this.prototype.hasOwnProperty(name) === true && name !== "clazz") {
                            var f = this.prototype[name];
                            A.prototype[name] = f != null && f.methodBody != null ? ProxyMethod(name, f.methodBody, f.boundTo)
                                                                                  : f;

                            if (A.prototype[name] != null && A.prototype[name].boundTo === this) {
                                A.prototype[name].boundTo = A;
                                if (f.boundTo === this) {
                                    f.boundTo = A;
                                }
                            }
                        }
                    }

                    this.$parent = A;
                    this.$isExtended = true;
                }

                if (hasMethod) {
                    mixing(this, methods);
                }

                // add passed interfaces
                for(var i = 0; i < arguments.length - (hasMethod ? 1 : 0); i++) {
                    var I = arguments[i];
                    if (I == null || I.clazz !== zebkit.Interface) {
                        throw new Error("Interface is expected");
                    }

                    if (this.$parents[I.$hash$] != null) {
                        throw new Error("Interface has been already inherited");
                    }

                    cpMethods(I.prototype, this.prototype, this);
                    this.$parents[I.$hash$] = I;
                }
            };

            classTemplate.isInherit = function(clazz) {
                if (this !== clazz) {
                    // detect class
                    if (clazz.clazz === this.clazz) {
                        var p = this;
                        while ((p = p.$parent) != null) {
                            if (p === clazz) {
                                return true;
                            }
                        }
                    } else { // detect interface
                        if (this.$parents[clazz] === clazz) {
                            return true;
                        }
                    }
                }
                return false;
            };

            classTemplate.clazz.$name = "zebkit.Class";

            // copy methods from interfaces
            if (toInherit.length > 0) {
                // notify inherited class and interfaces that they have been inherited with the given class
                for(var i = 0; i < toInherit.length; i++) {
                    if (toInherit[i].inheritedWidth != null) {
                        toInherit[i].inheritedWidth(classTemplate);
                    }
                }
            }

            return classTemplate;
        });

        var $cachedO = pkg.$cachedO = {},
            $cachedE = pkg.$cachedE = [];

        pkg.$cacheSize = 7777;

        /**
         * Get an object by the given key from cache (and cached it if necessary)
         * @param  {String} key a key to an object. The key is hierarchical reference starting with the global
         * name space as root. For instance "test.a" key will fetch $global.test.a object.
         * @return {Object}  an object
         * @for  zebkit
         * @private
         * @method  $cache
         */
        pkg.$cache = function(key) {
            // don't cache global objects
            if (pkg.$global[key]) {
                return pkg.$global[key];
            }

            if ($cachedO.hasOwnProperty(key) === true) {
                // read cached entry
                var e = $cachedO[key];
                if (e.i < ($cachedE.length-1)) { // cached entry is not last one

                    // move accessed entry to the list tail to increase its access weight
                    var pn = $cachedE[e.i + 1];
                    $cachedE[e.i]   = pn;
                    $cachedE[++e.i] = key;
                    $cachedO[pn].i--;
                }
                return e.o;
            }

            var ctx = pkg.$global, i = 0, j = 0;
            for( ;ctx != null; ) {
                i = key.indexOf('.', j);

                if (i < 0) {
                    ctx = ctx[key.substring(j, key.length)];
                    break;
                }

                ctx = ctx[key.substring(j, i)];
                j = i + 1;
            }

            if (ctx != null) {
                if ($cachedE.length >= pkg.$cacheSize) {
                    // cache is full, replace first element with the new one
                    var n = $cachedE[0];
                    $cachedE[0]   = key;
                    $cachedO[key] = { o: ctx, i: 0 };
                    delete $cachedO[n];
                } else {
                    $cachedO[key] = { o: ctx, i: $cachedE.length };
                    $cachedE[$cachedE.length] = key;
                }
                return ctx;
            }

            throw new Error("Reference '" + key + "' not found");
        };

        /**
         * Get class by the given class name
         * @param  {String} name a class name
         * @return {Function} a class. Throws exception if the class cannot be
         * resolved by the given class name
         * @method forName
         * @throws Error
         * @for  zebkit.Class
         */
        pkg.Class.forName = function(name) {
            return pkg.$cache(name);
        };

        /**
         * Create an instance of the class
         * @param  {String} [name]* arguments to be passed to the class constructor
         * @return {Object} an instance of the class.
         * @method newInstance
         * @for  zebkit.Class
         */
        pkg.Class.newInstance = function() {
            return pkg.newInstance(this, arguments);
        };

        /**
         * Test if the given object is instance of the specified class or interface. It is preferable
         * to use this method instead of JavaScript "instanceof" operator whenever you are dealing with
         * zebkit classes and interfaces.
         * @param  {Object} obj an object to be evaluated
         * @param  {Function} clazz a class or interface
         * @return {Boolean} true if a passed object is instance of the given class or interface
         * @method instanceOf
         * @for  zebkit
         */
        pkg.instanceOf = function(obj, clazz) {
            if (clazz != null) {
                if (obj == null || typeof obj.clazz === 'undefined') {
                    return false;
                }

                var c = obj.clazz;
                return c != null && (c === clazz || typeof c.$parents[clazz.$hash$] !== "undefined");
            }

            throw new Error("instanceOf(): null class");
        };

        /**
         * Dummy class that implements nothing but can be useful to instantiate
         * anonymous classes with some on "the fly" functionality:

            // instantiate and use zebkit class with method "a()" implemented
            var ac = new zebkit.Dummy([
                 function a() {
                    ...
                 }
            ]);

            // use it
            ac.a();

         * @constructor
         * @class zebkit.Dummy
         */
        pkg.Dummy = pkg.Class([]);

        pkg.DoIt = DoIt;
    });

    if (isInBrowser) {
        zebkit.then(function() {
            var jn        = this.join(),
                $interval = zenv.setInterval(function () {
                if (document.readyState === "complete") {
                    zenv.clearInterval($interval);
                    jn(zebkit);
                }
            }, 100);
        });
    }

    // nodejs
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = zebkit;

        // TODO: not a good pattern to touch global space, but zebkit has to be visible
        // globally
        if (typeof global !== 'undefined') {
            global.zebkit = zebkit;
        }
    } else {
        window.zebkit = zebkit;
    }

    return zebkit;
})();

