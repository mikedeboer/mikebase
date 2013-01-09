/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true newcap: true undef: true es5: true node: true devel: true
         forin: true */
/*global define: true */

(typeof define === "undefined" ? function($) { $(require, exports, module) } : define)(function(require, exports, module, undefined) {

"use strict";

var Base = require("../index").Base;

exports["test .isPrototypeOf"] = function(assert) {
    assert.ok(Base.isPrototypeOf(Base.new()), "Base is a prototype of Base.new()");
    assert.ok(Base.isPrototypeOf(Base.extend()), "Base is a prototype of Base.extend()");
    assert.ok(Base.isPrototypeOf(Base.extend().new()), "Base is a prototoype of Base.extend().new()");
    assert.ok(!Base.extend().isPrototypeOf(Base.extend()), "Base.extend() in not a prototype of Base.extend()");
    assert.ok(!Base.extend().isPrototypeOf(Base.new()), "Base.extend() is not a prototype of Base.new()");
    assert.ok(!Base.new().isPrototypeOf(Base.extend()), "Base.new() is not a prototype of Base.extend()");
    assert.ok(!Base.new().isPrototypeOf(Base.new()), "Base.new() is not a prototype of Base.new()");
};

exports["test inheritance"] = function(assert) {
    var Parent = Base.extend({
        name: "parent",
        method: function() {
            return "hello " + this.name;
        }
    });

    assert.equal(Parent.name, "parent", "Parent name is parent");
    assert.equal(Parent.method(), "hello parent", "method works on prototype");
    assert.equal(Parent.new().name, Parent.name, "Parent instance inherits name");
    assert.equal(Parent.new().method(), Parent.method(), "method behaves the same on the prototype");
    assert.equal(Parent.extend({}).name, Parent.name, "Parent descedent inherits name");

    var Child = Parent.extend({
        name: "child"
    });
    assert.notEqual(Child.name, Parent.name, "Child overrides name");
    assert.equal(Child.new().name, Child.name, "Child instances inherit name");
    assert.equal(Child.extend().name, Child.name, "Child descendents inherit name");

    assert.equal(Child.method, Parent.method, "Child inherits method");
    assert.equal(Child.extend().method, Parent.method, "Child descendents inherit method");
    assert.equal(Child.new().method, Parent.method, "Child instances inherit method");

    assert.equal(Child.method(), "hello child", "method refers to instance property");
    assert.equal(Child.extend({
        name: "descendent"
    }).new().method(), "hello descendent", "method may be overridden");
};

exports["test prototype immutability"] = function(assert) {
    assert.throws(function() {
        Base.extend = function() {};
    }, "Base prototype is immutable");
    assert.throws(function() {
        Base.foo = "bar";
    }, "Base prototype is non-configurable");
    assert.throws(function() {
        delete Base.new;
    }, "Can't delete properties on prototype");

    var Foo = Base.extend({
        name: "hello",
        rename: function rename(name) {
            this.name = name;
        }
    });

    assert.throws(function() {
        Foo.extend = function() {}
    }, "Can't change prototype properties");
    assert.throws(function() {
        Foo.foo = "bar";
    }, "Can't add prototype properties");
    assert.throws(function() {
        delete Foo.name;
    }, "Can't remove prototype properties");
    assert.throws(function() {
        Foo.rename("new name");
    }, "Method's can't mutate prototypes");

    var Bar = Foo.extend({
        rename: function rename() {
            return this.name;
        }
    });

    assert.equal(Bar.rename(), Foo.name, "properties may be overidden on descendents");
};

exports["test instance mutability"] = function(assert) {
    var Foo = Base.extend({
        name: "foo",
        init: function init(number) {
            this.number = number;
        }
    });
    var f1 = Foo.new();
    /* V8 does not support this yet!
    assert.throws(function() {
        f1.name = "f1";
    }, "can't change prototype properties");
    */
    f1.alias = "f1";
    assert.equal(f1.alias, "f1", "instance is mutable");
    delete f1.alias;
    assert.ok(!("alias" in f1), "own properties are deletable");
    f1.init(1);
    assert.equal(f1.number, 1, "methods can mutate an instance's own properties");
};

exports["test super"] = function(assert) {
    var Foo = Base.extend({
        initialize: function Foo(options) {
            this.name = options.name;
        }
    });

    var Bar = Foo.extend({
        initialize: function Bar(options) {
            Foo.initialize.call(this, options);
            this.type = "bar";
        }
    });

    var bar = Bar.new({
        name: "test"
    });

    assert.ok(Bar.isPrototypeOf(bar), "Bar is prototype of Bar.new");
    assert.ok(Foo.isPrototypeOf(bar), "Foo is prototype of Bar.new");
    assert.ok(Base.isPrototypeOf(bar), "Base is prototype of Bar.new");
    assert.equal(bar.type, "bar", "bar initializer was called");
    assert.equal(bar.name, "test", "bar initializer called Foo initializer");
};

exports["test inheritance chain"] = function(assert) {
    // Basic test (from the documentation of Base)
    // ### Object composition ###

    var HEX = Base.extend({
       hex: function hex() {
           return "#" + this.color;
       }
    });

    var RGB = Base.extend({
       red: function red() {
           return parseInt(this.color.substr(0, 2), 16);
       },
       green: function green() {
           return parseInt(this.color.substr(2, 2), 16);
       },
       blue: function blue() {
           return parseInt(this.color.substr(4, 2), 16);
       }
    });

    var CMYK = Base.extend(RGB, {
       black: function black() {
           var color = Math.max(Math.max(this.red(), this.green()), this.blue());
           return (1 - color / 255).toFixed(4);
       },
       cyan: function cyan() {
           var K = this.black();
           return (((1 - this.red() / 255).toFixed(4) - K) / (1 - K)).toFixed(4);
       },
       magenta: function magenta() {
           var K = this.black();
           return (((1 - this.green() / 255).toFixed(4) - K) / (1 - K)).toFixed(4);
       },
       yellow: function yellow() {
           var K = this.black();
           return (((1 - this.blue() / 255).toFixed(4) - K) / (1 - K)).toFixed(4);
       }
    });

    var Color = Base.extend(HEX, RGB, CMYK, {
       initialize: function Color(color) {
           this.color = color;
       }
    });

    // ### Prototypal inheritance ###

    var Pixel = Color.extend({
       initialize: function Pixel(x, y, hex) {
           Color.initialize.call(this, hex);
           this.x = x;
           this.y = y;
       },
       toString: function toString() {
           return this.x + ":" + this.y + "@" + this.hex();
       }
    });

    var pixel = Pixel.new(11, 23, "CC3399");
    assert.equal(pixel.toString(), "11:23@#CC3399", "A pixel should be composed of Color, HEX, RGB and CMYK");

    assert.equal(pixel.red(), 204, "A pixel should be composed of RGB");
    assert.equal(pixel.green(), 51, "A pixel should be composed of RGB");
    assert.equal(pixel.blue(), 153, "A pixel should be composed of RGB");

    assert.equal(pixel.cyan(), 0.0000, "A pixel should be composed of CMYK");
    assert.equal(pixel.magenta(), 0.7500, "A pixel should be composed of CMYK");
    assert.equal(pixel.yellow(), 0.250, "A pixel should be composed of CMYK");

    // an instance of Color should contain the following objects:
    var color = Color.new("CC3399");
    assert.ok(color.hasFeature(HEX), "Check inheritance chain for HEX"); // true
    assert.ok(color.hasFeature(RGB), "Check inheritance chain for RGB"); // true
    assert.ok(color.hasFeature(CMYK), "Check inheritance chain for CMYK"); // true
    assert.ok(color.hasFeature(Color), "Check inheritance chain for Color"); // true
    assert.ok(!color.hasFeature(Pixel), "Check inheritance chain for Pixel"); // false

    // an instance of Pixel should contain the following objects:
    var pixel = Pixel.new(11, 23, "CC3399");
    assert.ok(pixel.hasFeature(HEX), "Check inheritance chain for HEX"); // true
    assert.ok(pixel.hasFeature(RGB), "Check inheritance chain for RGB"); // true
    assert.ok(pixel.hasFeature(CMYK), "Check inheritance chain for CMYK"); // true
    assert.ok(pixel.hasFeature(Color), "Check inheritance chain for Color"); // true
};

if (module == require.main)
    require("test").run(exports);

})
