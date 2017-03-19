zebkit.package("environment", function(pkg, Class) {
    function notImplemented(name) {
        return function() {
            throw new Error("API method '" + name + "' is not implemented");
        };
    }

    //
    //   .open(method, url, callback)
    //   .send(data)
    //   .setRequestHeader(name, value)
    //   .onreadystatechange()
    //   .status
    //   .statusText
    //   .responseText
    //
    pkg.getHttpRequest = notImplemented("getHttpRequest");

    //  String -> Object
    pkg.parseJSON      = notImplemented("parseJSON");

    //  Object -> String
    pkg.stringifyJSON  = notImplemented("stringifyJSON");


    //  (callback, int) -> int
    pkg.setInterval    = notImplemented("setInterval");


    //  int
    pkg.clearInterval  = notImplemented("setInterval");

    //  String -> DOM
    //     DOM.getElementsByTagName
    //     DOM.tagName
    //     DOM.childNodes[]
    //     DOM.nodeValue
    pkg.parseXML       = notImplemented("parseXML");


    // cb
    pkg.loadImage      = notImplemented("loadImage");

    // cb
    pkg.animate       = notImplemented("animate");
});