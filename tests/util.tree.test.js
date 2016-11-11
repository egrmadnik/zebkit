
if (typeof(zebkit) === "undefined") {
    require("../src/js/easyoop.js");
    require("../src/js/misc/tools.js");
    require("../src/js/util.js");
    require("../src/js/layout.js");
}

var assert = zebkit.assert, Class = zebkit.Class, assertException = zebkit.assertException,
    assertNoException = zebkit.assertNoException, Listeners = zebkit.util.Listeners;

zebkit.runTests("Util",
    function test_format() {
        var s = " -- ${a} ${b}.",
            o = { a:  100, b: "abcdef", d:"b", getM: function() { return 0 }  };

        var r = zebkit.util.format(s, o);
        assert(r, " -- 100 abcdef." );

        var r = zebkit.util.format(" ${${d}} ${m} ${m}", o);
        assert(r, " abcdef 0 0");

        var r = zebkit.util.format(" ${4,0,a} ${m}", o);
        assert(r, " 0100 0");

        var r = zebkit.util.format(" ${4,a} ${2,+,m}", o, '-');
        assert(r, " -100 +0");

        var o = new Date(1999, 9, 11);
        var r = zebkit.util.format("-- ${2,month} , ${3,+,date} k ${fullYear}. ${2,kk}", o, 'x');
        assert(r, "-- x9 , +11 k 1999. xx");

        var r = zebkit.util.format(" ${4,a} ${2,+,m} ${d}", {}, '-');
        assert(r, " ---- -- -");
    },

    function test_invalidpath() {
        var treeLikeRoot = { value:"test" };

        assertException(function() {
            zebkit.util.findInTree(treeLikeRoot, "", function() {}, function() {});
        }, Error);

        assertException(function() {
            zebkit.util.findInTree(treeLikeRoot, "/", function() {}, function() {});
        }, Error);

        assertException(function() {
            zebkit.util.findInTree(treeLikeRoot, "//", function() {}, function() {});
        }, Error);

        assertException(function() {
            zebkit.util.findInTree(treeLikeRoot, "/*//", function() {}, function() {});
        }, Error);

        assertException(function() {
            zebkit.util.findInTree(treeLikeRoot, "/*/", function() {}, function() {});
        }, Error);

        assertException(function() {
            zebkit.util.findInTree(treeLikeRoot, "/Root/", function() {}, function() {});
        }, Error);

        assertException(function() {
            zebkit.util.findInTree(treeLikeRoot, "/*/", function() {}, function() {});
        }, Error);

        assertException(function() {
            zebkit.util.findInTree(treeLikeRoot, "//Root//", function() {}, function() {});
        }, Error);

        assertException(function() {
            zebkit.util.findInTree(treeLikeRoot, "Root//a", function() {}, function() {});
        }, Error);

        assertException(function() {
            zebkit.util.findInTree(treeLikeRoot, "//Root/a/", function() {}, function() {});
        }, Error);

        zebkit.util.findInTree(treeLikeRoot, "//Root/a/*", function() {}, function() {});

        zebkit.util.findInTree(treeLikeRoot, "//*[@id='dsds/sds']", function() {}, function() {});
    },

    function test_treelookup() {
        var treeLikeRoot = {
            value : "Root",
            kids : [
                { value: "Item 1", a:12 },
                { value: "Item 1", a:11 },
                {
                    value: "Item 2",
                    kids: [
                        { value: "Item 2.1", a:"aa" },
                        { value: "Item 1",   a:11 },
                        { value: "Item 2.1", c:"mm" }
                    ]
                }
            ]
        };

        var res = [],
            cmp = function(item, fragment) {
                return item.value == fragment;
            },

            collect = function(e) {
                res.push(e);
                return false;
            };


        res = [];
        zebkit.util.findInTree(treeLikeRoot, "/*/Item 1", cmp, collect);
        for (var i = 0; i < res.length; i++) {
            console.log(res[i].value);
        }

        res = [];
        zebkit.util.findInTree(treeLikeRoot, "//*", cmp, collect);
        assert(res.length, 6, "Find all children");

        res = [];
        zebkit.util.findInTree(treeLikeRoot, "/*", cmp, collect);
        assert(res.length, 3, "Find all direct children of the root");

        res = [];
        zebkit.util.findInTree(treeLikeRoot, "/*/*", cmp, collect);
        assert(res.length, 3, "Find all children second");

        res = [];
        zebkit.util.findInTree(treeLikeRoot, "/*//*", cmp, collect);
        assert(res.length, 3, "5");

        res = [];
        zebkit.util.findInTree(treeLikeRoot, "/*/*/*", cmp, collect);
        assert(res.length, 0, "6");

        res = [];
        zebkit.util.findInTree(treeLikeRoot, ".", cmp, collect);
        assert(res.length, 1, "8");
        assert(res[0].value, "Root", "9");

        res = [];
        zebkit.util.findInTree(treeLikeRoot, "/*/Item 1", cmp, collect);
        assert(res.length, 1, "10");
        assert(res[0].value, "Item 1", "11");


        res = [];
        zebkit.util.findInTree(treeLikeRoot, "/Item 1", cmp, collect);
        assert(res.length, 2);
        assert(res[0].value, "Item 1");
        assert(res[1].value, "Item 1");

        res = [];
        zebkit.util.findInTree(treeLikeRoot, "//Item 1", cmp, collect);
        assert(res.length, 3);
        assert(res[0].value, "Item 1");
        assert(res[1].value, "Item 1");
        assert(res[2].value, "Item 1");

        res = [];
        zebkit.util.findInTree(treeLikeRoot, "/Item 1/Item 1", cmp, collect);
        assert(res.length, 0);

        res = [];
        zebkit.util.findInTree(treeLikeRoot, "/Item 2/Item 1", cmp, collect);
        assert(res.length, 1);
        assert(res[0].value, "Item 1");

        res = [];
        zebkit.util.findInTree(treeLikeRoot, "/Item 1[@a=12]", cmp, collect);
        assert(res.length, 1);
        assert(res[0].value, "Item 1");
        assert(res[0].a, 12);

        res = [];
        zebkit.util.findInTree(treeLikeRoot, "/Item 1[@a=11]", cmp, collect);
        assert(res.length, 1);
        assert(res[0].value, "Item 1");
        assert(res[0].a, 11);

        res = [];
        zebkit.util.findInTree(treeLikeRoot, "//*[@a=11]", cmp, collect);
        assert(res.length, 2);

        res = [];
        zebkit.util.findInTree(treeLikeRoot, "/*[@a=11]", cmp, collect);
        assert(res.length, 1);

        res = [];
        zebkit.util.findInTree(treeLikeRoot, "//Item 1[@a=11]", cmp, collect);
        assert(res.length, 2);

        res = [];
        zebkit.util.findInTree(treeLikeRoot, "//Item 2/*[@a=11]", cmp, collect);
        assert(res.length, 1);

        res = [];
        zebkit.util.findInTree(treeLikeRoot, "//Item 2//*[@a=11]", cmp, collect);
        assert(res.length, 1);
    },

    function test_layouttree() {
        zebkit.package("test.ui", function(pkg) {
            pkg.A = zebkit.Class(zebkit.layout.Layoutable, []);
            pkg.B = zebkit.Class(pkg.A, []);
            pkg.C = zebkit.Class(zebkit.layout.Layoutable, []);
            pkg.D = zebkit.Class(pkg.C, []);
            pkg.AA = zebkit.Class(pkg.D, []);
        });

        zebkit.require("test.ui", function(pkg) {
            var r = new zebkit.layout.Layoutable();
            var a1 = new pkg.A();
            var a2 = new pkg.A();
            var a3 = new pkg.A();
            var b   = new pkg.B();
            var c1  = new pkg.C();
            var c2  = new pkg.C();
            var c3  = new pkg.C();
            var d   = new pkg.D();
            var aa  = new pkg.AA();


            a1.setId("a1_id");
            b.b_bool = true;
            aa.aa_int = 123;

            //   r
            //   \
            //   +--- b  { b_bool : true }
            //   |    +--- aa  { aa_int: 123}
            //   +--- a1 { id : 'a1_id' }
            //   +--- a2
            //   +--- c1
            //   |    +--- c2
            //   |    +--- d
            //   |    |    +--- c3
            //   |    +--- a3


            r.add(b);
            r.add(a1);
            r.add(a2);
            r.add(c1);
            c1.add(c2);
            c1.add(d);
            c1.add(a3);
            d.add(c3);
            b.add(aa);

            assert(r.find("zebkit.test.ui.A"), a1);
            assert(r.find("zebkit.test.ui.B"), b);
            assert(r.find("zebkit.test.ui.C"), c1);
            assert(r.find("zebkit.test.ui.D"), d);
            assert(r.find("zebkit.test.ui.AA"), aa);

            assert(r.find("/zebkit.test.ui.A"), a1);
            assert(r.find("/zebkit.test.ui.B"), b);
            assert(r.find("/zebkit.test.ui.C"), c1);
            assert(r.find("/zebkit.test.ui.D"), null);
            assert(r.find("/zebkit.test.ui.AA"), null);

            assert(r.find("//zebkit.test.ui.A"), a1);
            assert(r.find("//zebkit.test.ui.B"), b);
            assert(r.find("//zebkit.test.ui.C"), c1);
            assert(r.find("//zebkit.test.ui.D"), d);
            assert(r.find("//zebkit.test.ui.AA"), aa);


            assert(r.find("~zebkit.test.ui.A"), b);
            assert(r.find("~zebkit.test.ui.B"), b);
            assert(r.find("~zebkit.test.ui.C"), aa);
            assert(r.find("~zebkit.test.ui.D"), aa);
            assert(r.find("~zebkit.test.ui.AA"), aa);


            assert(r.find("//~zebkit.test.ui.A"), b);
            assert(r.find("//~zebkit.test.ui.B"), b);
            assert(r.find("//~zebkit.test.ui.C"), aa);
            assert(r.find("//~zebkit.test.ui.D"), aa);
            assert(r.find("//~zebkit.test.ui.AA"), aa);

            assert(r.find("/~zebkit.test.ui.A"), b);
            assert(r.find("/~zebkit.test.ui.B"), b);
            assert(r.find("/~zebkit.test.ui.C"), c1);
            assert(r.find("/~zebkit.test.ui.D"), null);
            assert(r.find("/~zebkit.test.ui.AA"), null);

            assert(r.find("/*//*"), aa);
            assert(r.find("/*/*"), aa);
            assert(r.find("/*/*/*"), c3);
            assert(r.find("/*/*//*"), c3);
            assert(r.find("/*//*/*"), c3);


            assert(r.find("#a1_id"), a1);
            assert(r.find("#a2_id"), null);
            assert(r.find("/*/*[@id='a1_id']"), null);
            assert(r.find("/*[@id='a1_id']"), a1);
            assert(r.find("//*[@id='a1_id']"), a1);
            assert(r.find("//zebkit.test.ui.C[@id='a1_id']"), null);
            assert(r.find("/zebkit.test.ui.C[@id='a1_id']"), null);
            assert(r.find("//zebkit.test.ui.A[@id='a1_id']"), a1);
            assert(r.find("/zebkit.test.ui.A[@id='a1_id']"), a1);
            assert(r.find("/~zebkit.test.ui.A[@id='a1_id']"), a1);
            assert(r.find("//~zebkit.test.ui.A[@id='a1_id']"), a1);

            assert(r.find("/*/zebkit.test.ui.A"), a3);
            assert(r.find("//*/zebkit.test.ui.A"), a3);
            assert(r.find("/*/~zebkit.test.ui.A"), a3);
            assert(r.find("//*/~zebkit.test.ui.A"), a3);

            assert(r.find("/*[@b_bool=false]"), null);
            assert(r.find("/*[@b_bool=true]"), b);
            assert(r.find("/zebkit.test.ui.B[@b_bool=true]"), b);
            assert(r.find("/~zebkit.test.ui.B[@b_bool=true]"), b);
            assert(r.find("/zebkit.test.ui.A[@b_bool=true]"), null);
            assert(r.find("/~zebkit.test.ui.A[@b_bool=true]"), b);
            assert(r.find("//*[@b_bool=true]"), b);
            assert(r.find("/*[@b_bool='true']"), b);


            assert(r.find("/*[@aa_int=123]"), null);
            assert(r.find("/*/*[@aa_int=123]"), aa);
            assert(r.find("/zebkit.test.ui.B/*[@aa_int=123]"), aa);
            assert(r.find("/zebkit.test.ui.B/zebkit.test.ui.AA[@aa_int=123]"), aa);
            assert(r.find("/zebkit.test.ui.B/zebkit.test.ui.A[@aa_int=123]"), null);
            assert(r.find("/zebkit.test.ui.A/zebkit.test.ui.AA[@aa_int=123]"), null);
            assert(r.find("/~zebkit.test.ui.A/zebkit.test.ui.AA[@aa_int=123]"), aa);
            assert(r.find("/~zebkit.test.ui.A/*[@aa_int=123]"), aa);
            assert(r.find("/~zebkit.test.ui.A/zebkit.test.ui.AA[@aa_int=1232]"), null);
            assert(r.find("/~zebkit.test.ui.A/~zebkit.test.ui.C[@aa_int=123]"), aa);
            assert(r.find("/~zebkit.test.ui.A/~zebkit.test.ui.D[@aa_int=123]"), aa);
            assert(r.find("/~zebkit.test.ui.B/~zebkit.test.ui.D[@aa_int=123]"), aa);
            assert(r.find("/~zebkit.test.ui.C/~zebkit.test.ui.D[@aa_int=123]"), null);
            assert(r.find("/zebkit.test.ui.B/~zebkit.test.ui.D[@aa_int=123]"), aa);
            assert(r.find("//*[@aa_int=123]"), aa);


            var res = r.findAll("//*");
            assert(res.length, 9);

            var res = r.findAll("/*");
            assert(res.length, 4);

            var res = r.findAll("/*/*");
            assert(res.length, 4);

            var res = r.findAll("/*/*/*");
            assert(res.length, 1);

            var res = r.findAll("/*//*");
            assert(res.length, 5);

            var res = r.findAll("/zebkit.test.ui.A");
            assert(res.length, 2);

            var res = r.findAll("//zebkit.test.ui.A");
            assert(res.length, 3);

            var res = r.findAll("/~zebkit.test.ui.A");
            assert(res.length, 3);

            var res = r.findAll("//~zebkit.test.ui.A");
            assert(res.length, 4);

            var res = r.findAll("/zebkit.test.ui.C/*");
            assert(res.length, 3);

            var res = r.findAll("/zebkit.test.ui.C//*");
            assert(res.length, 4);

            var res = r.findAll("/~zebkit.test.ui.C//*");
            assert(res.length, 4);

            var res = r.findAll("/~zebkit.test.ui.C");
            assert(res.length, 1);

            var res = r.findAll("//~zebkit.test.ui.C");
            assert(res.length, 5);

            var res = r.findAll("/*/*/~zebkit.test.ui.C");
            assert(res.length, 1);

            var res = r.findAll("/*/*/~zebkit.test.ui.A");
            assert(res.length, 0);
        });
    }
);








