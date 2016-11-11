zebkit.package("ui", function(pkg, Class) {

    var path = zebkit.config['zebkit.json'];  // fetch json configuration
    if (typeof path === "undefined") {
        var theme = zebkit.config['zebkit.theme']; // fetch theme name
        if (typeof theme === "undefined") {
            theme = "base";
        }
        // TODO: not sure theme variable is necessary
        pkg.$theme = theme;
        path = pkg.$url.join("theme/" + theme + "/zebkit.json");
    } else {
        // TODO: not sure theme variable is necessary
        pkg.$theme = null;
    }

    if (path != null) {
        pkg.load(path).catch(function(e) {
            console.log("Config JSON loading failed:" + (e.stack != null ? e.stack : e));
        });
    }

    //!!!
    // IE9 has an error: first mouse press formally pass focus to
    // canvas, but actually it doesn't get key events. To fix it
    // it is necessary to pass focus explicitly to window
    if (zebkit.isIE) {
        window.focus();
    }
});