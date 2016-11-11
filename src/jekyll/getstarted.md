---
layout: page
title: Get started
tags: menu
---

<script type="text/javascript" src="{{site.zebkitBase}}/zebkit.js">  
</script>

In general you should just work with zebkit JS code. No HTML neither CSS manipulation is required. More over dealing with WEB specific world is against zebkit idea.  

   * **Take existent or create a new HTML:**

```html
<!DOCTYPE html>
<html>
    <head>
       ...
    </head>
    <body> ... </body>
</html>
```

   * **Add meta to HTML head tag for single page / mobile applications**  

```html
...
<meta name="viewport" 
   content="user-scalable=no,width=device-width,initial-scale=1,maximum-scale=1">
<meta name="msapplication-tap-highlight" content="no">
...
```

   * **Include zebkit JS in script section:**

```html
<html>
    <head>
        <script type="text/javascript"
                src="http://repo.zebkit.org/latest/zebkit.min.js">
        </script>
     ...
```

   * **Write application code:**

```js
// wrap zebkit code with ready method to make sure everything
// has been initialized 
zebkit.ready(function() {
    var root = new zebkit.ui.zCanvas("sample", 300, 300).root;
    root.properties({
        border:  "plain", 
        padding: 8,
        layout:  new zebkit.layout.BorderLayout(6),
        kids  : {
            "center": new zebkit.ui.TextArea("A text ... "),
            "bottom": new zebkit.ui.Button("test") 
        }
    });
});
```

   * **Enjoy the result:**

{% include zsample.html canvas_id='sample' title="Get started zebkit application" %}

<script>
zebkit.ready(function() {
    var root = new zebkit.ui.zCanvas("sample", 400, 300).root;
    root.properties({
        border:  "plain", 
        padding: 8,
        layout:  new zebkit.layout.BorderLayout(6),
        kids  : {
            "center" : new zebkit.ui.TextArea("A text ... "),
            "bottom" : new zebkit.ui.Button("test") 
        }
    });
});
</script>

### Add events handling

```js
zebkit.ready(function() {
    ...
    // find first component whose class is zebkit.ui.Button
    root.find("zebkit.ui.Button").bind(function() {
        // find first component whose class is zebkit.ui.TextArea
        // and clear it
        root.find("zebkit.ui.TextArea").setValue("");
    })
});
```


{% include zsample.html canvas_id='sample2' title="Get started zebkit application" %}

<script>
zebkit.config["zebkit.theme"] = "dark";

zebkit.ready(function() {
    var root = new zebkit.ui.zCanvas("sample2", 400, 300).root;
    root.properties({
        border:  "plain", 
        padding: 8,
        layout:  new zebkit.layout.BorderLayout(6),
        kids  : {
            "center" : new zebkit.ui.TextArea("A text ... "),
            "bottom" : new zebkit.ui.Button("test") 
        }
    });

    root.find("zebkit.ui.Button").bind(function() {
        root.find("zebkit.ui.TextArea").setValue("");
    })
});
</script>

