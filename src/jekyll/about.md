---
layout: page
title: Zebkit ?
---

Zebkit is unique UI platform that renders UI components on HTML5 Canvas element. It has minimal dependencies from WEB context and built with zebkit easy JS OOP approach. 

<script type="text/javascript" src="{{site.zebkitBase}}/zebkit.js">  
</script>

{% capture description %}
Abstract JS API, powerful OOP concept, rich UI components set is good basement for software engineering with minimal impact of typical WEB mess. 
{% endcapture %}

{% include zsample2.html canvas_id='sample1' title='Example of simple zebkit application to play video advertising' description=description %}

<br/>
Zebkit can be good alternative for development mobile, single page applications with no limitations regarding desirable UI components set. Everything can be rendered with zebkit.  

<script>
zebkit()['zebkit.theme']= "dark";

zebkit.ready(function() {
    var z = new zebra.ui.zCanvas("sample1", 450, 200);
    z.root.setLayout(new zebra.layout.BorderLayout());
    z.root.setBorder(new zebkit.ui.Border("black", 1, 6));
    z.root.setPadding(4);
    z.root.setBorder(new zebkit.ui.Border("red", 2, 6));
    z.root.setBackground("black");
    z.root.add("center", new zebkit.ui.SplitPan(
        new zebkit.ui.tree.CompTree({
            value: "Brands", 
            kids:  [  
                new zebkit.ui.ImageLabel("BMW","public/images/bmw_small.png").setPadding(4,6,4,6).setImgPreferredSize(32).setId("bmw"),
                new zebkit.ui.ImageLabel("SAAB","public/images/saab_small.png").setPadding(4,6,4,6).setImgPreferredSize(32).setId("saab"),
                new zebkit.ui.ImageLabel("Honda", "public/images/honda_small.png").setPadding(4,6,4,6).setImgPreferredSize(32).setId("honda")
            ]
        }).properties("//*", { 
              color    : "red", 
              font     : "bold"
          }).setId("tree"), 
        new zebkit.ui.StackPan(
            new zebkit.ui.VideoPan("public/images/grippen.mp4").setId("saabVideo").setVisible(false),
            new zebkit.ui.VideoPan("public/images/honda.mp4").setId("hondaVideo").setVisible(false),
            new zebkit.ui.VideoPan("public/images/bmw.mp4").setId("bmwVideo").setVisible(false),
            new zebkit.ui.Label("Select a tree item to watch video").properties({
                constraints: "usePsSize",
                id    : "label",
                color : "orange"
            })
        )
    ).setGripperLoc(150));

    z.find("#tree").bind(function selected(src) {
        z.findAll("zebkit.ui.VideoPan", function(vp) {
            vp.pause();
            vp.setVisible(false);
        });

        if (src.selected !== null && src.selected.value.id != null) {
            z.find("#label").setVisible(false);
            z.find("#"+src.selected.value.id+"Video").setVisible(true).play();
        } else {
            z.find("#label").setVisible(true);
        }
    });
});
</script>

</td>
</tr>    
</table>

![ScreenShot]( {{ site.baseurl }}public/images/overview.png)

**Easy OOP JavaScript concept** _Dart_, _CoffeeScript_, _TypeScript_ and other "intermediate" languages can be ignored thanks to zebkit easy OOP that gives power to keep code under control, increases re-usability and simplifies support. Supporting of classes and interfaces, inheritance and mixing, constructor, static context, method overriding and **true access to super context**, anonymous classes, packaging, etc. Find more details about zebkit [easy OOP following the link](../easyoop).
   
```js
var A = zebkit.Class([  // class A declaration 
    function() { ... }, // constructor
    function a() { return 1; } // declare class method "a"
]);
var B = zebkit.Class(A, [ // declare class B that inherits A 
    function() { this.$super(); }, // call super constructor
    function a() { // overriding method "a"
        return 1+this.$super(); // call method super implementation 
    }
]);

var a = new A(), // class A instantiation
    b = new B([ // customize class B instance on the fly
        function a() { return 0; }, // override method
        function b() { return 3; }  // add new method 
   ]);     
a.a();  // call "a" method => 1
b.a();  // call "a" method => 2
b.b();  // call "b" method => 3
```
   
<br/>

**Everything is rendered on canvas** Any desirable UI component can be developed with help of zebkit components model and API. Zebkit provides abstractions to make easier UI components development, components lay outing and almost eliminates dealing with CSS/DOM stuff. 

{% capture description %}
<ul>
   <li>Example of syntactic highlighting of code</li>
   <li>Example of very simple implementation of charts</li>
   <li>Example of text field rendering customization</li>    
</ul>
{% endcapture %}

{% include zsample.html canvas_id='renderingSample' title='Customized rendering' description=description%}

<script type="text/javascript">
var zebra_image = null;
zebkit.ready(function() {
    zebra_image = zebkit.web.$loadImage("public/images/zebra-pattern.png");
});

zebkit.ready(function() {
    eval(zebkit.Import("ui", "layout"));

    var ZebkitTextRender = zebkit.Class(TextRender, [
        function(t, reflection) {
            if (arguments.length === 1) {
                reflection = false;
            }
            this.$super(t);
            this.setFont("100px Futura, Helvetica, sans-serif");
            this.image = zebra_image;
            this.reflectionGap = -40;
        },

        function getLineHeight() {
            return this.hasReflection ? this.font.height*2 + this.reflectionGap : this.font.height;
        },

        function paintLine(g,x,y,line,d) {
            var gradient=g.createLinearGradient(x,y,x,y+this.font.height);
            gradient.addColorStop(0.1, '#222');
            gradient.addColorStop(0.35, '#fff');
            gradient.addColorStop(0.65, '#fff');
            gradient.addColorStop(1.0, '#000');
            g.fillStyle = gradient;
            g.fillText(this.getLine(line), x, y);
            g.fillStyle = this.pattern;
            g.fillRect(x, y,this.calcLineWidth(line),this.getLineHeight());
        },

        function paint(g,x,y,w,h,d) {
            this.pattern = g.createPattern(this.image, 'repeat');
            this.$super(g,x,y,w,h,d);
        }
    ]);

    var root = new zCanvas("renderingSample", 450, 300).root;
    root.setLayout(new BorderLayout(8));
    root.add(new TextField(new ZebkitTextRender("Zebkit ...")).properties({
        cursorView    : "red",
        curW          : 3,
        selectionColor: "gray",
        background    : "black"
    }));
    
    var SimpleChart = zebkit.Class(Panel, [
        function(fn, x1, x2, dx, col) {
            this.fn = fn;
            this.x1 = x1;
            this.x2 = x2;
            this.dx = dx;
            this.color = col;
            this.lineWidth = 4;
            this.$super();
        },

        function validate() {
            var b = this.isLayoutValid;
            this.$super();
            if (b === false)  {
                var maxy = -1000000, miny = 1000000, fy = [];
                for(var x=this.x1, i = 0; x < this.x2; x += this.dx, i++) {
                    fy[i] = this.fn(x);
                    if (fy[i] > maxy) maxy = fy[i];
                    if (fy[i] < miny) miny = fy[i];
                }

                var left = this.getLeft() + this.lineWidth,
                    top  = this.getTop() + this.lineWidth,
                    ww = this.width-left-this.getRight()-this.lineWidth*2,
                    hh = this.height-top-this.getBottom()-this.lineWidth*2,
                    cx = ww/(this.x2 - this.x1), cy = hh/ (maxy - miny),
                    t  = function (xy, ct) { return ct * xy; };

                this.gx = [ left ];
                this.gy = [ top + t(fy[0] - miny, cy) ];
                for(var x=this.x1+this.dx,i=1;i<fy.length;x+=this.dx,i++) {
                    this.gx[i] = left + t(x - this.x1, cx);
                    this.gy[i] = top  + t(fy[i] - miny, cy);
                }
            }
        },

        function paint(g) {
            g.beginPath();
            g.setColor(this.color);
            g.lineWidth = this.lineWidth;
            g.moveTo(this.gx[0], this.gy[0]);
            for(var i = 1; i < this.gx.length; i++) {
                g.lineTo(this.gx[i], this.gy[i]);
            }
            g.stroke();
        }
    ]);

    var SynRender = new zebkit.Class(TextRender, [
        function(content) {
            this.words = {};
            this.$super(content);
            this.setFont("Courier", 16);
        },

        function paintLine(g,x,y,line,d){
            var s = this.getLine(line), v = s.split(/\s/), xx = x;
            for(var i = 0; i < v.length; i++){
                var str = v[i], color = this.words[str];
                str += " ";
                g.setColor(color != null ? color : this.color);
                g.fillText(str, xx, y);
                xx += this.font.stringWidth(str);
            }
        }
    ]);

    sh = new SynRender("public class Test\nextends Object {\n    static {\n        if (a > 0) {\n            a = 10;\n        }\n    }\n}").setColor("white");
    sh.words= {"class"   : "#55DD22", "public" : "#FF7744",
               "extends" : "#FF7744", "static" : "#FF7744",
               "if"      : "#55DD22", "==":"green"          };

    var cpan = new Panel().setPreferredSize(230, 120);
    cpan.setLayout(new StackLayout());
    cpan.add(new SimpleChart(function(x) {
        return Math.cos(x) * Math.sin(x) - 2 * Math.sin(x*x);
    }, -2, 5, 0.01, "#FF7744"));
    cpan.add(new SimpleChart(function(x) {
        return Math.cos(x) * Math.sin(x) + 2 * Math.sin(x*x);
    }, -2, 1, 0.01, "#55DD22"))

    var pan = new Panel({
        layout: new FlowLayout(8),
        kids  : [ new Label(sh), cpan ]
    });
    root.add("top", pan);
});
</script>

<br/>

**DOM elements in zebkit layout** Zebkit is able to host other DOM elements in zebkit layout. Add HTML5 Canvas elements or Google map or even standard input elements. 

{% capture description %}
<ul>
   <li>Google map is in zebkit border panel</li>
   <li>Zebkit tool tip is shown every time a mouse in google map element</li>
   <li>Control google layer with zebkit combo component</li>
</ul>
{% endcapture %}


{% include zsample.html canvas_id='sampleGoogleMap' title="DOM elements integrated in zebkit layout" description=description %}

<script>
    var gmap = null;
    function initMap() {
        zebkit.ready(function() {
            eval(zebkit.Import("ui"));

            var c = new zCanvas("sampleGoogleMap", 400, 400);
            var map = new HtmlElement();
            map.setAttribute("id", "map");
            map.tooltip = new Tooltip("Zebkit Tooltip");
                                                       
            map.popup = new Menu(["Zebkit", "Context", "Menu"]);
            gmap = map.element;
            c.root.properties({
                layout : new zebkit.layout.BorderLayout(8),
                padding: 16,
                border : new Border("red", 2, 6),
                kids: {
                    center : new BorderPan("Google Map in zebkit layout", map),
                    bottom: new Combo([
                        "TERRAIN",  "ROADMAP", "SATELLITE" 
                    ]).properties({ border: new Border("red", 1, 6) })  
                }
            });

            var gmap = new google.maps.Map(gmap, {
                center: {lat: -34.397, lng: 150.644},
                scrollwheel: false,
                zoom: 8
            });

            var combo = c.find(".zebkit.ui.Combo"); 
            combo.select(1);
            combo.bind(function(src) {
                gmap.setMapTypeId(google.maps.MapTypeId[src.getValue()]);    
            });
        });
    }
</script>
<script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDHbhEB-ZtVg7-eXE1yLioDSR2MIafnsIs&callback=initMap"> </script>

<br/>

**Unification of input events** Mouse, touch screen, pen input events are caught and processed with one common approach:

```js
var root = new zebkit.ui.zCanvas(300, 300).root;
root.pointerPressed = function(e) {
    // catch and handle mouse pressed, touch etc events here
    ... 
}  
```

<br/>

**Customizable UI components shape** Zebkit is not restricted with only rectangular UI components. Outline of zebkit components can be easily  customized to have any required shape. 

{% include zsample.html canvas_id='customShapeSample' title="Custom shaped UI components" %}

<script>
zebkit.ready(function() {
    eval(zebkit.Import("ui"));
    var zcan = new zCanvas("customShapeSample", 550, 250);
    var root = new Panel(new zebkit.layout.FlowLayout("center", "center", "vertical", 16));
    zcan.root.setLayout(new zebkit.layout.FlowLayout(16));
    zcan.root.add(root);

    var RoundButton = zebkit.Interface([
        function () {
            this.setBorder({
                "pressed.over" : new RoundBorder("#AACCDD", 4),
                "pressed.out"  : new RoundBorder("black", 4),
                "over"         : new RoundBorder("orange", 4),
                "out"          : new RoundBorder("red", 4)
            });

            this.setBackground({
                "pressed.over" : "#DDFFCC",
                "pressed.out"  : "#DDFFFF",
                "over" : "red",
                "out" : "orange"
            });
        },

        function contains(x, y) {
            var a = this.width / 2, b = this.height / 2;
            x -= a;
            y  = -y + b;
            return  (x * x)/(a * a) + (y * y)/(b * b) <= 1;
        }
    ]);

    var Cloud = zebkit.Class(Shape, [
        function outline(g,x,y,w,h,d) {
            g.beginPath();
            g.moveTo(x + w * 0.2, y  +  h * 0.25);
            g.bezierCurveTo(x, y+h*0.25, x, y+h*0.75, x+w*0.2,y+ h*0.75);
            g.bezierCurveTo(x+0.1*w,y+h-1,x+0.8*w, y+h-1,x+w*0.7,y+h*0.75);
            g.bezierCurveTo(x+w-1,y+h*0.75,x+w-1,y,x+w*0.65,y + h*0.25);
            g.bezierCurveTo(x+w-1,y,x+w*0.1,y,x+w*0.2,y + h * 0.25) ;
            g.closePath();
            return true;
        }
    ]);

    var TriangleBorder = zebkit.Class(Shape, [
        function outline(g,x,y,w,h,d) {
            g.beginPath();
            x += this.width;
            y += this.width;
            w -= 2 * this.width;
            h -= 2 * this.width;
            g.moveTo(x + Math.floor(w / 2) - 1, y);
            g.lineTo(x + w - 1, y + h - 1);
            g.lineTo(x, y + h - 1);
            g.closePath();
            return true;
        }
    ]);

    var Triangle = zebkit.Interface([
        function(color) {
            this.setBorder(new TriangleBorder(arguments.length > 0 ? color : "red", 4));
        },
        function contains(x, y) {
            var w = this.width, h = this.height,
                x1 = Math.floor(w/2) - 1, x2 = w - 1, x3 = 0,
                y1 = 0, y2 = h - 1, y3 = y2,
                b1 = ((x - x2) * (y1 - y2) - (x1 - x2) * (y - y2)) < 0,
                b2 = ((x - x3) * (y2 - y3) - (x2 - x3) * (y - y3)) < 0,
                b3 = ((x - x1) * (y3 - y1) - (x3 - x1) * (y - y1)) < 0;
            return b1 == b2 && b2 == b3;
        }
    ]);

    var SimpleChart = zebkit.Class(Panel, [
        function(fn, x1, x2, dx, col) {
            this.fn = fn;
            this.x1 = x1;
            this.x2 = x2;
            this.dx = dx;
            this.color = col;
            this.lineWidth = 2;
            this.$super();
        },
        function validate() {
            var b = this.isLayoutValid;
            this.$super();
            if (b === false)  {
                var maxy = -1000000, miny = 1000000, fy = [];
                for(var x=this.x1, i = 0; x < this.x2; x += this.dx, i++) {
                    fy[i] = this.fn(x);
                    if (fy[i] > maxy) maxy = fy[i];
                    if (fy[i] < miny) miny = fy[i];
                }

                var left = this.getLeft() + this.lineWidth,
                    top  = this.getTop() + this.lineWidth,
                    ww = this.width-left-this.getRight()-this.lineWidth*2,
                    hh = this.height-top-this.getBottom()-this.lineWidth*2,
                    cx  = ww/(this.x2 - this.x1), cy = hh/ (maxy - miny);

                var t = function (xy, ct) {
                    return ct * xy;
                };

                this.gx = [ left ];
                this.gy = [ top + t(fy[0] - miny, cy) ];
                for(var x=this.x1+this.dx,i=1;i<fy.length;x+=this.dx,i++) {
                    this.gx[i] = left + t(x - this.x1, cx);
                    this.gy[i] = top  + t(fy[i] - miny, cy);
                }
            }
        },

        function paint(g) {
            g.beginPath();
            g.setColor(this.color);
            g.lineWidth = this.lineWidth;
            g.moveTo(this.gx[0], this.gy[0]);
            for(var i = 1; i < this.gx.length; i++) {
                g.lineTo(this.gx[i], this.gy[i]);
            }
            g.stroke();
        }
    ]);

    var b = new Button(new Label("Cloud button").setColor("white"));
    b.setBackground({
        "over"         : "red",
        "out"          : "orange",
        "pressed.over" : "black" 
    });
    b.setBorder(new Cloud("red", 4));
    b.setPreferredSize(140, 90);
    root.add(b);

    var b1=new Button(new ImagePan("public/images/boat.png").setPadding(6)),
        b2=new Button(new ImagePan("public/images/drop.png").setPadding(6)),
        b3=new Button(new ImagePan("public/images/bug-o.png").setPadding(6));
    b1.extend(RoundButton);
    b2.extend(RoundButton);
    b3.extend(RoundButton);
    root.add(new Panel({
        layout:new zebkit.layout.FlowLayout("center","center","horizontal", 8),
        kids  : [ b1, b2, b3 ]
    }));

    var lab = new ImageLabel("Triangle\nbutton", new ImagePan("public/images/bug-o.png").setPreferredSize(32,32));
    lab.setImgAlignment("bottom");
    lab.setPadding(14,0,0,0);
    lab.setColor("black");
    var tb = new Button(lab.setFont("bold"));
    tb.extend(Triangle);
    zcan.root.add(tb.setPreferredSize(200, 150));
});
</script>

<br/>

**JSON UI descriptive language** Zebkit supports building of UI basing on JSON description. 

```json
{ "$zebkit.ui.Panel": {
    "layout" : { "$zebkit.layout.BorderLayout" : 4 },
    "padding": 16, 
    "border" : "plain",
    "kids"   : {
        "center": {
            "$zebkit.ui.Tabs" : [],
            "kids" : {
                "TextArea" : { "$zebkit.ui.TextArea": "Text" },
                "Tree"     : { "$zebkit.ui.tree.Tree" : {
                    "value" : "Root Node",
                    "kids"  : [
                        { 
                            "value" : "Node 1",
                            "kids"  : [ 
                                "Sub node of node 1.1", 
                                "Sub node of node 1.2"
                            ] 
                        },"Node 2", "Node 3"
                    ]}
                },
                "Grid" : { "$zebkit.ui.grid.Grid" :  [
                    [  [ "Item 1",  "Item 2",  "Item 3" ],
                       [ "Item 4",  "Item 5",  "Item 6" ],
                       [ "Item 7",  "Item 8",  "Item 9" ],
                       [ "Item 10", "Item 11", "Item 12"],
                       [ "Item 13", "Item 14", "Item 15"]  ]
                ], "topCaption":[ "Head 1", "Head 2", "Head 3"]}
            }
        }
    }
}}
```

Find below run zebkit application that has been created by the JSON description shown above:

<table cellspacing="0" cellpadding="0" border="0" style="margin:0px;">
    <tr style="padding:0px;background-color:black;">
        <td align="left" 
            valign="top" 
            style="border-color:black;padding:0px;background-color:black;">

{% include zsample.html canvas_id='jsonSample' title="Custom shaped UI components" %}

</td>

<td align="left" 
    valign="top" 
    style="padding:0px;background-color:black;border-color:black;">

```js
eval(zebkit.Import("ui", "layout"));

var root = new zCanvas(300,300).root;
root.setLayout(new StackLayout());

zebkit.util.Bag().load(
    "simpleapp.json",
    function() {
       root.add(this.root);
    }
);
```

</td></tr></table>

<br/>

<script>
zebkit.ready(function() {
   eval(zebkit.Import("ui"));
   var root = new zCanvas("jsonSample", 300, 300).root;
   root.setLayout(new zebkit.layout.StackLayout());

   var bag = new zebkit.util.Bag();

   bag.load("public/js/simpleapp.json",
    function() {
        root.add(this.root);
    });
});
</script>

**More than 40 various UI components** Provided highly customizable rich set of UI components is ready for building desktop and mobile applications.    

{% include zsample.html canvas_id='sampleRichSet' title="Number of zebkit UI components"%}

<script type="text/javascript">
    zebkit.ready(function() {
       eval(zebkit.Import("ui","layout","ui.grid","ui.tree","ui.designer"));
   
       var root = new zCanvas("sampleRichSet", 650, 750).root;
       root.setLayout(new RasterLayout(true));

       root.add(new Button("Button"));
       root.add(new Button("@(public/images/bug-o.png):32x32Image\nbutton")).setLocation(30, 45);

       root.add(new Link(new zebkit.data.Text("Just a simple\nLink")).setLocation(150,30));

       root.add(new TextField("Text field").setLocation(250, 540).
           setPreferredSize(150, -1));

       var grid = new Grid([
           [   "Item 1.1", 
               "Item 1.2",
               new ImagePan("public/images/bmw_small.png", [
                   function imageLoaded() { if (grid != null) grid.vrp(); }
               ]).setPreferredSize(32, 32)
           ],
           [   "Item 2.1", 
               "Item 2.2",
               new ImagePan("public/images/saab_small.png").setPreferredSize(32,32)
           ],
       ]); 
       grid.defXAlignment = "center"; 
       grid.setUsePsMetric(true);
       grid.setCellPadding(8);

       grid.add("top", new CompGridCaption([
          "Title 1", 
          "Title 2", 
           new ImageLabel(new CompGridCaption.Link("Title 3"), 
           new ImagePan("public/images/wbug.png").setPreferredSize(24,24)).setPadding(4,4,4,8)
       ]));
       
       grid.add(new LeftCompGridCaption([ "I", "II" ]));
       
       var checks = new Panel(new FlowLayout("left", "center","vertical", 4));
       checks.add(new Checkbox("Checkbox"));
       checks.add(new Line("orange", "red").setConstraints("stretch"));
       var group = new Group(); 
       checks.add(new Radiobox("Radiobox 1", group));
       checks.add(new Radiobox("Radiobox 2", group));
       checks.setPadding(8);
       root.add(new BorderPan("Checkboxes", checks).setLocation(30, 300));        
       root.add(grid.setLocation(10,150));
  
       var tabs = new Tabs();
       tabs.setPreferredSize(360, 260);
   
       tabs.add("Scroll panel", new ScrollPan(new ImagePan("public/images/flowers2.jpg")).setAutoHide(true));
       tabs.add("Split panel", new SplitPan(
           new ImagePan("public/images/flowers3.jpg").setPadding(8), 
           new SplitPan(
               new ImagePan("public/images/flowers.jpg").setPadding(8),
               new ImagePan("public/images/landscape.jpg").setPadding(8), 
               "horizontal"
           ).setGripperLoc(100)
       ).setGripperLoc(120));
       var p = new Panel(new GridLayout(2,2,true,true).setPadding(4));
       p.add(new BorderPan("Label"));
       p.add(new BorderPan("@(public/images/honda_small.png):20x20Image label"));
       p.add(new BorderPan("Label").setAlignment("center"));
       p.add(new BorderPan("[x]Interactive Label").setOrientation("bottom").setAlignment("right"));
       tabs.add("Border panel", p);
       root.add(tabs.setLocation(290, 80));

       var mbar = new Menubar({
           "Menu Item 1" : [
               "[x]Sub Item 1",
               "-",
               "Sub Item 2",
               "Sub Item 3" ],
           "Menu Item 2" : [
               "()Sub Item 1",
               "()Sub Item 2",
               "(x)Sub Item 3" ],
           "Menu Item 3": {
               "Sub Item 1" : null,
               "Sub Item 2" : {
                   "Sub Item 1" : null,
                   "Sub Item 2" : null,
                   "Sub Item 3" : null
               }
           }
       }).setLocation(250, 0);
       root.add(mbar);

       var tree = new CompTree({
           value: "Root",
           kids: [
               "[x] Item 1",
               [ "Combo Item 1", "Combo Item 2", "Combo Item 3" ],
               {   value: "Item 2",
                   kids : [
                       "Subitem 1",
                       "[] Subitem 2",
                       "[x] Subitem 3"
                   ] 
               }
           ]
       }).setLocation(430, 510);
       tree.model.root.kids[1].value.select(0);
       root.add(tree);

       tabs.toBack();

       var ta = new TextArea("This is multi lines text in\nfully rendered in\nHTML5 Canvas\ncomponent");
       ta.setPreferredSize(170, 120);
       ta.setLocation(210, 360);
       root.add(ta);

       var toolbar = new Toolbar();
       toolbar.add(new ImagePan("public/images/bug-o.png").setPreferredSize(24, 24));
       toolbar.add(new ImagePan("public/images/drop.png").setPreferredSize(24, 24));
       toolbar.add("-");
       toolbar.add(new ImagePan("public/images/boat.png").setPreferredSize(24, 24));
       toolbar.add("-");
       toolbar.addSwitcher("On/Off");
       root.add(toolbar.setLocation(400, 360));

       var combo = zebkit.ui.$component([
           "*@(public/images/bmw.png):16x16 Item 1",
           "@(public/images/honda.png):16x16 Item 2",
           "@(public/images/saab.png):16x16 Item 3"
       ]).setPreferredSize(140, 30);

       root.add(combo.setLocation(140, 100));

       var p = new ExtendablePan.GroupPan(
           new ExtendablePan("Page 1", new Panel({
               layout: new GridLayout(3, 2, false, true).
                   setDefaultConstraints(new Constraints(
                       "stretch", "center", 4
                   )),
               padding: 8,
               background : "#202220",
               kids  : [
                   new Label("User name: "),
                   new TextField("", 8),
                   new Label("Password: "),
                   new PassTextField(""),
                   new Label(""), 
                   new Button("Save").$setConstraints(new Constraints(
                       "right", "center", 4
                   ))
               ]
           })),
           new ExtendablePan("Page 2", 
               new Panel({
                   layout : new FlowLayout("center", "center"),
                   background : "#202220",
                   kids   : [
                       new Label("No content is available")
                   ]
               })),
           new ExtendablePan("Page 3", new Label("...").setBackground("#202220"))
       ).setPreferredSize(220, 250);
       root.add(p.setLocation(10,500));

       var pt = new PassTextField("", 12, true).setHint("enter password");
       root.add(pt.setPreferredSize(150, -1).setLocation(250, 495));
       
       var desBt= new ShaperPan(
           new Checkbox("Control size\nand drag me!"));
       desBt.setLocation(450, 430);
       root.add(desBt);

       var tpLab = new Label("Move mouse in\ntool tip is shown");
       tpLab.setBorder("plain");
       tpLab.setPadding(8);
       tpLab.setFont("bold");
       tpLab.tooltip=new Tooltip("@(public/images/wbug.png):16x16Tooltip");
       root.add(tpLab.setLocation(290, 600));
   });
</script>

<br/>

**Fast and responsive UI components** that can handle tons of data. For instance find below grid component that keeps **10.000.000 (10 millions)** dynamically generated cells!  

{% include zsample.html canvas_id='sampleBigGrid' title='10.000.000 cells' %}

<script type="text/javascript">
    zebkit.ready(function() {
        eval(zebkit.Import("ui","layout","ui.grid"));
        var grid = new Grid(1000000, 10);
        grid.defXAlignment = "center";
        var titles = [];
        for(var i = 0; i < 10; i++) { titles[i] = "Title " + i; }
        grid.add("top", new GridCaption(titles));
        grid.setViewProvider(new DefViews([
            function getView(target, row, col, obj){
                this.render.setValue("Item ["+ row + "," + col +"]");
                return this.render;
            },
            function getCellColor(target, row, col) {
                return row % 2 === 0 ?  "orange" : "#ff9149"; 
            }
        ]));

        var root = new zCanvas("sampleBigGrid", 650, 400).root;
        root.setLayout(new BorderLayout());
        root.add(new ScrollPan(grid).setAutoHide(true));
    });
</script>

<br/>

**Layout management** Zebkit uses rules to order UI components intead of usin  absolute location and precise UI component sizes. New rules that are called layout managers can be easily developed for specific needs. 

   * Border Layout:

{% include zsample.html canvas_id='layoutSample1' title='Border layout' %}

   * List layout

{% include zsample.html canvas_id='layoutSample2' title='List layout' %}

   * Percentage layout

{% include zsample.html canvas_id='layoutSample3' title='Percentage layout' %}

   * Flow layout

{% include zsample.html canvas_id='layoutSample4' title='Flow layout' %}

   * Grid layout

{% include zsample.html canvas_id='layoutSample5' title='Grid layout' %}


<script type='text/javascript'>
zebkit.ready(function() {
    eval(zebkit.Import("ui", "layout"));

    var PAN = zebkit.Class(Panel, []);
    PAN.padding = 8;
    PAN.border = "plain";

    // Border layout
    var r = new zCanvas("layoutSample1", 500, 400).root;
    r.setLayout(new BorderLayout());
    r.add(new Panel({
        layout : new BorderLayout(4),
        kids   : {
            "center": new Button("CENTER"),
            "left":   new Button("LEFT"),
            "right":  new Button("RIGHT"),
            "top":    new Button("TOP"),
            "bottom": new Button("BOTTOM")
        }
    }).setPreferredSize(300, -1));

    // List layout
    var r = new zCanvas("layoutSample2", 700, 320).root;
    r.setLayout(new zebkit.layout.GridLayout(2, 2).setPadding(8));
    r.add(new PAN({
        layout : new ListLayout(8),
        kids   : [
            new Button("Stretched Item 1"),
            new Button("Stretched Item 2"),
            new Button("Stretched Item 3")
        ]
    }).setPreferredSize(320, -1));

    r.add(new PAN({
        layout : new ListLayout("center", 8),
        kids   : [
            new Button("Center aligned item 1"),
            new Button("Center aligned item 2"),
            new Button("Center aligned item 3")
        ]
    }).setPreferredSize(320, -1));

    r.add(new PAN({
        layout : new ListLayout("left", 8),
        kids   : [
            new Button("Left aligned item 1"),
            new Button("Left aligned item 2"),
            new Button("Left aligned item 3")
        ]
    }));

    r.add(new PAN({
        layout : new ListLayout("right", 8),
        kids   : [
            new Button("Right aligned item 1"),
            new Button("Right aligned item 2"),
            new Button("Right aligned item 3")
        ]
    }));

    // percentage layout
    var r = new zCanvas("layoutSample3", 700, 220).root;
    r.setLayout(new zebkit.layout.GridLayout(2, 2).setPadding(8));
    r.add(new PAN({
        layout : new PercentLayout(),
        kids   : {
           20: new Button("20%"),
           30: new Button("30%"),
           50: new Button("50%")
        }
    }).setPreferredSize(320, -1));

    r.add(new PAN({
        layout : new PercentLayout("horizontal", 2, false),
        kids   : {
           20: new Button("20%"),
           30:  new Button("30%"),
           50: new Button("50%")
        }
    }).setPreferredSize(320, -1));

    r.add(new PAN({
        layout : new PercentLayout("vertical", 2, false),
        kids   : {
           20: new Button("20%"),
           30:  new Button("30%"),
           50: new Button("50%")
        }
    }));
 
    r.add(new PAN({
        layout : new PercentLayout("vertical", 2, true),
        kids   : {
           20: new Button("20%"),
           30: new Button("30%"),
           50: new Button("50%")
        }
    }));

    // Flow layout 
    var r = new zCanvas("layoutSample4", 700, 930).root;
    r.setLayout(new GridLayout(9, 1).setPadding(8));

    r.add(new PAN({
        layout : new FlowLayout("center", "center", "vertical", 4),
        kids   : [
           new Button("VCentered"),
           new Button("VCentered"),
           new Button("VCentered")
        ]
    }).setPreferredSize(650, -1));

    r.add(new PAN({
        layout : new FlowLayout("center", "center", "horizontal", 4),
        kids   : [
           new Button("HCentered"),
           new Button("HCentered"),
           new Button("HCentered")
        ]
    }));

    r.add(new PAN({
        layout : new FlowLayout("left", "center", "horizontal", 4),
        kids   : [
           new Button("Left-Center-Hor"),
           new Button("Left-Center-Hor"),
           new Button("Left-Center-Hor")
        ]
    }));

    r.add(new PAN({
        layout : new FlowLayout("right", "center", "horizontal", 4),
        kids   : [
           new Button("Right-Center-Hor"),
           new Button("Right-Center-Hor"),
           new Button("Right-Center-Hor")
        ]
    }));

    r.add(new PAN({
        layout : new FlowLayout("right", "top", "horizontal", 4),
        kids   : [
           new Button("Right-Top-Hor"),
           new Button("Right-Top-Hor"),
           new Button("Right-Top-Hor")
        ]
    }));

    r.add(new PAN({
        layout : new FlowLayout("left", "top", "horizontal", 4),
        kids   : [
           new Button("Left-Top-Hor"),
           new Button("Left-Top-Hor"),
           new Button("Left-Top-Hor")
        ]
    }));

    r.add(new PAN({
        layout : new FlowLayout("left", "top", "vertical", 4),
        kids   : [
           new Button("Left-Top-Ver"),
           new Button("Left-Top-Ver"),
           new Button("Left-Top-Ver")
        ]
    }));

    r.add(new PAN({
        layout : new FlowLayout("right", "top", "vertical", 4),
        kids   : [
           new Button("Right-Top-Ver"),
           new Button("Right-Top-Ver"),
           new Button("Right-Top-Ver")
        ]
    }));
 
    r.add(new PAN({
        layout : new FlowLayout("right", "bottom", "vertical", 4),
        kids   : [
           new Button("Right-Bottom-Ver"),
           new Button("Right-Bottom-Ver"),
           new Button("Right-Bottom-Ver")
        ]
    }));

    var r = new zCanvas("layoutSample5", 700, 600).root;
    r.setLayout(new GridLayout(4, 2).setPadding(8));

    r.add(new PAN({
        layout : new zebkit.layout.GridLayout(2,2),
        kids   : [
            new zebkit.ui.Button("1x1"),
            new zebkit.ui.Button("1x2"),
            new zebkit.ui.Button("2x1"),
            new zebkit.ui.Button("2x2")
        ]
    }).setPreferredSize(320, 200));

    r.add(new PAN({
        layout : new zebkit.layout.GridLayout(2,2, true).setPadding(8),
        kids   : [
            new zebkit.ui.Button("1x1"),
            new zebkit.ui.Button("1x2"),
            new zebkit.ui.Button("2x1"),
            new zebkit.ui.Button("2x2")
        ]
    }));

    r.add(new PAN({
        layout : new zebkit.layout.GridLayout(2,2, true, true).setPadding(8),
        kids   : [
            new zebkit.ui.Button("1x1"),
            new zebkit.ui.Button("1x2"),
            new zebkit.ui.Button("2x1"),
            new zebkit.ui.Button("2x2")
        ]
    }));

    var ctr2 = new zebkit.layout.Constraints("center", "bottom");
    var ctr3 = new zebkit.layout.Constraints("center", "center");
    ctr2.setPadding(8);
    r.add(new PAN({
        layout : new zebkit.layout.GridLayout(2,2).setPadding(8),
        kids   : [
            new zebkit.ui.Button("1x1 bottom component").setConstraints(ctr2),
            new zebkit.ui.Button("1x2\nnew line\nnew line"),
            new zebkit.ui.Button("Centered").setConstraints(ctr3),
            new zebkit.ui.Button("2x2\n2x2\n2x2")
        ]
    }));

    var ctr = new zebkit.layout.Constraints();
    ctr.ax = "left"; ctr.ay = "top" ;
    r.add(new PAN({
        layout : new zebkit.layout.GridLayout(2,2,true, true).setPadding(8),
        kids   : [
            new zebkit.ui.Button("1x1").setConstraints(ctr),
            new zebkit.ui.Button("1x2").setConstraints(ctr),
            new zebkit.ui.Button("2x1").setConstraints(ctr),
            new zebkit.ui.Button("2x2").setConstraints(ctr)
        ]
    }).setPreferredSize(-1, 150));

    var ctr1 = new zebkit.layout.Constraints();
    var ctr2 = new zebkit.layout.Constraints();
    var ctr3 = new zebkit.layout.Constraints();
    var ctr4 = new zebkit.layout.Constraints();
    ctr1.ax = "left"; ctr1.ay = "top" ;
    ctr2.ax = "stretch"; ctr2.ay = "top" ;
    ctr3.ax = "center"; ctr3.ay = "stretch" ;
    ctr4.ax = "stretch"; ctr4.ay = "stretch";
    r.add(new PAN({
        layout : new zebkit.layout.GridLayout(2,2,true,true).setPadding(8),
        kids   : [
            new zebkit.ui.Button("1x1").setConstraints(ctr1),
            new zebkit.ui.Button("1x2").setConstraints(ctr2),
            new zebkit.ui.Button("2x1").setConstraints(ctr3),
            new zebkit.ui.Button("2x2").setConstraints(ctr4)
        ]
    }));
});
</script>
