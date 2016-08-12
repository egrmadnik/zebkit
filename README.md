
![ScreenShot](http://repo.zebkit.org/zebkit.logo.png)

## Requirements 

Zebkit works in MS Internet Explorer 9+, MS Edge, FireFox 3+, Safari 5+, Google Chrome. It should support iOS 7+ and Android 4+ mobile browsers.

To build the package install nodejs. To generate zebkit website install jekyll (https://jekyllrb.com/). 

## Installation 

```bash
    $ npm install
```

## Building

To build Java Script packages:
```bash
   $ gulp
```

To build web site:
```bash
   $ jekyll build -d web -s src/jekyll/ 
```

## Run http server 

```bash
   $ gulp http
```

Open "http://localhost:8090/web/about.html" in a browser.
