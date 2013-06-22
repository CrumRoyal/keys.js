/**
 * @author Paul Schoenfelder
 */
(function (root, builder, undefined) {
    if (typeof exports === 'object') {
        // CommonJS Native
        exports = builder(exports);
    }
    if (typeof define === 'function') {
        // CommonJS AMD
        define(function() {
            return builder(root);
        });
    }
    else {
        // Vanilla environments (browser)
        root = builder(root);
    }
})(this, function (exports, undefined) {
    'use strict';

    exports = exports || {};

    /**
     * Debugging flag. Set to true for verbose logging.
     *
     * @global
     * @static
     */
    exports.debug = false;

    /**
     *  Polyfills and Logging
     */

    if (!Function.prototype.bind) {
        Function.prototype.bind = function(context) {
            var self = this;
            return function() {
                var args = Array.prototype.slice.call(arguments);
                return self.apply(context, args);
            };
        };
    }

    var log = (function() {
        var _log = console ? console.log.bind(console) : Function.prototype.valueOf();
        return function() {
            if (exports.debug) {
                var args = Array.prototype.slice.call(arguments);
                _log.apply(null, args);
            }
        };
    })();
    var warn = (function() {
        var _warn = console ? console.warn.bind(console) : Function.prototype.valueOf();
        return function() {
            var args  = Array.prototype.slice.call(arguments);
            _warn.apply(null, args);
        };
    })();

    if (!Array.prototype.forEach) {
        Array.prototype.forEach = function (collection, iterator, context) {
            if (!collection)
                throw new Error('forEach: Array is null or undefined.');
            if (typeof iterator !== 'function')
                throw new Error('forEach: Iterator is not callable.');

            var len        = collection.length >>> 0; // Force collection.length to int
            var index      = 0;
            context = context || null;
            while (index < len) {
                if (Object.prototype.hasOwnProperty.call(collection, index)) {
                    var val = collection[index];
                    iterator.call(context, val, index, collection);
                }
                index++;
            }
        };
    }
    if (!Array.prototype.map) {
        Array.prototype.map = function (collection, fn) {
            var results = [];
            collection.forEach(function(element, index, all) {
                results.push(fn.call(null, element, index, all));
            });
            return results;
        };
    }
    if (!Array.prototype.filter) {
        Array.prototype.filter = function (collection, predicate, context) {
            if (typeof predicate !== 'function')
                throw new Error("Predicate is not callable.");

            var results = [];
            collection.forEach(function (element, index, all) {
                if (predicate.call(context, element, index, all))
                    results.push(element);
            });
            return results;
        };
    }
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
            if (this === null) {
                throw new TypeError();
            }
            var t = Object(this);
            var len = t.length >>> 0;
            if (len === 0) {
                return -1;
            }
            var n = 0;
            if (arguments.length > 0) {
                n = Number(arguments[1]);
                if (n != n) { // shortcut for verifying if it's NaN
                    n = 0;
                } else if (n !== 0 && n != Infinity && n != -Infinity) {
                    n = (n > 0 || -1) * Math.floor(Math.abs(n));
                }
            }
            if (n >= len) {
                return -1;
            }
            var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
            for (; k < len; k++) {
                if (k in t && t[k] === searchElement) {
                    return k;
                }
            }
            return -1;
        };
    }

    /**
     * Allows you to tap into the current set of elements without affecting them
     * in any way, additionally allowing you to chain calls together with this
     * in the middle for debugging
     *
     * @memberof Array
     * @instance
     * @param {function} fn - The function to call for each element the tap encounters
     * @param {boolean} debugOnly - If true, will only execute the tap fn if debug === true, defaults to false (always on)
     */
    Array.prototype.tap = function(fn, debugOnly) {
        if (!debugOnly || exports.debug) {
            // Clone the original array to prevent tampering, and send each element to the tap
            this.slice().forEach(function(element) { fn.call(null, element); });
        }
        return this;
    };

    /**
     * Produces an array of arrays which are the result of zipping together the
     * elements of `this` and the array arguments. If any of the array arguments are
     * longer than `this`, their remaining elements will be skipped. If any of the array
     * arguments are shorter than `this`, their missing elements will be replaced with null.
     *
     * @memberOf  Array
     * @instance
     * @param {array} arrays* - A variadic number of arrays to be zipmapped
     */
    Array.prototype.zipmap = function() {
        var arrays = Array.prototype.slice.call(arguments);
        return this.map(function(element, i) {
            var others = [];
            for (var j = 0; j < arrays.length; j++) {
                var el = arrays[j] && arrays[j][i];
                others.push(el !== null && typeof el !== 'undefined' ? el : null);
            }
            return [element].concat(others);
        });
    };

    /**
     * Determine if a string ends with the provided string.
     *
     * @memberof String
     * @instance
     * @param {string} str - The string to match
     */
    String.prototype.endsWith = function(str) {
        if (this.length - str.length === this.lastIndexOf(str))
            return true;
        else return false;
    };

    /**
     * Search for the first element that matches a predicate within the collection
     * @param  {array} c - the collection to search
     * @param  {function} predicate - the predicate function to match with
     * @return {object} The first matching element or null if not found
     */
    function find (c, predicate) {
        for (var i = 0; i < c.length; i++) {
            if (predicate(c[i]))
                return c[i];
        }
        return null;
    }

    /**
     * Constructs a new instance of Key from a name and a keycode
     * @class Key
     * @classdesc Key represents the mapping between a physical key's name and it's machine code.
     *            It contains static references to all known keys, e.x. `Key.A` - and allows you
     *            to map a name or key code to one of those static instances.
     * @param {string} name - The name of the key
     * @param {number} code - The key code for the key
     */
    function Key(name, code) {
        this.name = name;
        this.code = code;

        // If a new Key is instantiated with a name that isn't
        // in the internal keymap, make sure we add it
        Key.internals.keymap[name] = Key.internals.keymap[name] || code;
    }


    /**
     * The raw map of key names to key codes. Used internally for some operations.
     * @memberOf Key
     * @name keymap
     * @type {object}
     * @static
     */
    Key.internals = {};
    Key.internals.keymap = {
        'A': 65,
        'B': 66,
        'C': 67,
        'D': 68,
        'E': 69,
        'F': 70,
        'G': 71,
        'H': 72,
        'I': 73,
        'J': 74,
        'K': 75,
        'L': 76,
        'M': 77,
        'N': 78,
        'O': 79,
        'P': 80,
        'Q': 81,
        'R': 82,
        'S': 83,
        'T': 84,
        'U': 85,
        'V': 86,
        'W': 87,
        'X': 88,
        'Y': 89,
        'Z': 90,
        '0': 48,
        '1': 49,
        '2': 50,
        '3': 51,
        '4': 52,
        '5': 53,
        '6': 54,
        '7': 55,
        '8': 56,
        '9': 57,
        'Numpad 0': 96,
        'Numpad 1': 97,
        'Numpad 2': 98,
        'Numpad 3': 99,
        'Numpad 4': 100,
        'Numpad 5': 101,
        'Numpad 6': 102,
        'Numpad 7': 103,
        'Numpad 8': 104,
        'Numpad 9': 105,
        'Multiply': 106,
        'Add': 107,
        'Subtract': 109,
        'Decimal': 110,
        'Divide': 111,
        'F1': 112,
        'F2': 113,
        'F3': 114,
        'F4': 115,
        'F5': 116,
        'F6': 117,
        'F7': 118,
        'F8': 119,
        'F9': 120,
        'F11': 122,
        'F12': 123,
        'F13': 124,
        'F14': 125,
        'F15': 126,
        'Backspace': 8,
        'Tab': 9,
        'Enter': 13,
        'SHIFT': 16,
        'CTRL': 17,
        'ALT': 18,
        'META': 91,
        'META_RIGHT': 93,
        'Caps Lock': 20,
        'Esc': 27,
        'Spacebar': 32,
        'Page Up': 33,
        'Page Down': 34,
        'End': 35,
        'Home': 36,
        'Left': 37,
        'Up': 38,
        'Right': 39,
        'Down': 40,
        'Insert': 45,
        'Delete': 46,
        'Num Lock': 144,
        'ScrLk': 145,
        'Pause/Break': 19,
        '; :': 186,
        '= +': 187,
        ',': 188,
        '- _': 189,
        '.': 190,
        '/ ?': 191,
        '` ~': 192,
        '[ {': 219,
        '\\ |': 220,
        '] }': 221,
        '" \'': 222
    };

    // Transform the internal keymap to actual static Key instances
    for (var name in Key.internals.keymap) {
        Key[name] = new Key(name, Key.internals.keymap[name]);
    }

    /**
     * Retreive a Key instance associated with the provided name
     *
     * @memberOf Key
     * @static
     * @param  {string} name - The name of the key as can be found in the keymap
     * @return {Key}
     */
    Key.fromName = function(name) {
        var result = Key[name];
        if (result && result instanceof Key) {
            return result;
        }
        else return null;
    };

    /**
     * Retrieve a Key instance associated with the provided key code
     * @param  {number} code - The key code as can be found in the keymap
     * @return {Key}
     */
    Key.fromCode = function(code) {
        for (var name in Key.internals.keymap) {
            if (Key.internals.keymap[name] === code)
                return Key[name];
        }
        return null;
    };

    /**
     * Determine if the provided key code was pressed
     *
     * @memberOf Key
     * @instance
     * @param  {number} code - The key code from e.which
     * @return {boolean}
     */
    Key.prototype.isPressed = function(code) {
        return this.code === code;
    };

    /**
     * Return true if the current Key is a meta key
     *
     * @memberOf Key
     * @return {boolean} true if the Key is one of the meta keys
     */
    Key.prototype.isMeta = function() {
        switch (this.code) {
            case Key.CTRL.code:
            case Key.SHIFT.code:
            case Key.ALT.code:
            case Key.META.code:
            case Key.META_RIGHT.code:
                return true;
            default:
                return false;
        }
    };

    /**
     * Determine if two instances of Key are equal to each other.
     * @param  {Key} key
     * @return {boolean}
     */
    Key.prototype.eq = function(key) {
        return this.code === key.code && this.name === key.name;
    };

    exports.Key = Key;


    /**
     * Creates a new Combo from a key code and array of meta key codes
     * 
     * @class
     * @classdesc Combo represents the physical combination of a single key and any meta keys
     *            that ultimately are used to trigger a keybinding. It is at the Combo level
     *            that we match a configured keybinding with the current set of pressed keys.
     *
     * @example
     *  var combo = new Combo(Key.A, [ Key.CTRL, Key.SHIFT ]);
     * 
     * @namespace Combo
     * @constructor
     * @param {Key} key - The primary Key for this Combo.
     * @param {array} meta - An array of meta Keys required for this Combo to be activated.
     */
    function Combo(key, meta) {
        var keys = null;
        if (arguments.length === 2 && meta instanceof Array) {
            keys = meta;
        }
        else if (arguments.length >= 2) {
            keys = Array.prototype.slice.call(arguments, 1);
        }
        else if (arguments.length === 1) {
            throw new Error('Combo: At least one meta key is required for a Combo');
        }
        else {
            throw new Error('Combo: Invalid number of arguments provided.');
        }

        var invalid = find(keys, function(k) {
            switch (k.code) {
                case Key.CTRL.code:
                case Key.SHIFT.code:
                case Key.ALT.code:
                case Key.META.code:
                case Key.META_RIGHT.code:
                    return false;
                default:
                    return true;
            }
        });

        if (invalid) {
            throw new Error('Combo: Attempted to create a Combo with multiple non-meta Keys. This is not supported.');
        }

        this.key   = key;
        this.ctrl  = hasKey(keys, Key.CTRL)  || key.eq(Key.CTRL);
        this.shift = hasKey(keys, Key.SHIFT) || key.eq(Key.SHIFT);
        this.alt   = hasKey(keys, Key.ALT)   || key.eq(Key.ALT);
        this.meta  = hasKey(keys, Key.META)  || hasKey(keys, Key.META_RIGHT);
        this.meta  = this.meta || (key.eq(Key.META) || key.eq(Key.META_RIGHT));

        function hasKey(collection, k) {
            return find(collection, function(x) { return k.eq(x); }) !== null;
        }
    }
    /**
     * Pretty print the Combo
     *
     * @memberOf Combo
     * @instance
     * @return {string} A string representation of the Combo
     */
    Combo.prototype.toString = function() {
        var meta = (this.ctrl  ? 'CTRL+'  : '') +
                   (this.alt   ? 'ALT+'   : '') +
                   (this.shift ? 'SHIFT+' : '') +
                   (this.meta  ? 'META+'  : '');
        if (this.key.isMeta())
            return meta.endsWith('+') ? meta.slice(0, meta.length - 1) : meta;
        else return meta + (this.key && this.key.name ? this.key.name : '');
    };
    /**
     * Serialize the Combo for persistance or transport.
     *
     * @memberOf Combo
     * @instance
     * @return {string} The Combo as a JSON string
     */
    Combo.prototype.serialize = function() {
        // TODO: Convert to JSON even if JSON object is not provided.
        if (typeof JSON === 'undefined')
            throw new Error('Your browser does not currently support JSON serialization.');
        return JSON.stringify(this);
    };
    /** 
     * Deserialize a Combo object from a JSON string.
     *
     * @memberOf Combo
     * @static
     * @param  {string} serialized - A serialized Combo object (JSON string)
     * @return {object} - The deserialized Combo as a regular object
     */
    Combo.deserialize = function(serialized) {
        // TODO: Convert from JSON even if JSON object is not provided.
        if (typeof JSON === 'undefined')
            throw new Error('Your browser does not currently support JSON deserialization.');
        // Keep in mind that when deserializing, the object no longer is an instance of Combo,
        // one still has to create a new Combo instance from the data encapsulated here.
        return JSON.parse(serialized);
    };
    /** 
     * Deep clone this Combo instance.
     *
     * @memberOf Combo
     * @instance
     * @return {Combo}
     */
    Combo.prototype.clone = function() {
        var combo   = new Combo(this.key);
        combo.ctrl  = this.ctrl;
        combo.alt   = this.alt;
        combo.shift = this.shift;
        combo.meta  = this.meta;
        return combo;
    };
    /**
     *  Create a Combo from an arbitrary object, primarily meant to be used in
     *  conjunction with Combo.deserialize to properly reify a serialized Combo
     *  object.
     *
     *  @memberOf Combo
     *  @static
     *  @param {object} obj - The anonymous object to create a Combo instance from.
     *  @return {Combo}
     */
    Combo.fromObject = function(obj) {
        if (!obj || !obj.key)
            throw new Error('Combo.fromObject: Cannot create Combo from provided object');
        // key param must be an instance of Key
        var key     = new Key(obj.key.name, obj.key.code);
        var combo   = new Combo(key);
        combo.ctrl  = obj.ctrl  || false;
        combo.alt   = obj.alt   || false;
        combo.shift = obj.shift || false;
        combo.meta  = obj.meta  || false;
        return combo;
    };
    /**
     * Given a keypress event, create a Combo that represents the set of pressed keys
     *
     * @memberOf Combo
     * @static
     * @param  {Event} e - The keypress event (could be keyup, keydown, or keypress)
     * @return {Combo}
     */
    Combo.fromEvent = function(e) {
        var key = Key.fromCode(e.which);
        var combo = new Combo(key);
        combo.shift = e.shiftKey || key.eq(Key.SHIFT);
        combo.alt   = e.altKey   || key.eq(Key.ALT);
        combo.meta  = e.metaKey  || key.eq(Key.META) || key.eq(Key.META_RIGHT);
        combo.ctrl  = e.ctrlKey  || key.eq(Key.CTRL);
        return combo;
    };
    /**
     *  Reverse of toString, you should get the original combo if you call Combo.fromString(combo.toString()).
     *  Useful for converting text inputs with Combo.toString() populated values back into actual Combo
     *  objects.
     *  
     *  @memberOf Combo
     *  @static
     *  @param {string} str - A string which represents a valid Combo
     *  @return {Combo}
     */
    Combo.fromString = function(str) {
        var parts     = str.split('+');
        if (parts.length >= 1) {
            var combo     = new Combo(Key.fromName(parts[parts.length - 1]));
            combo.ctrl    = parts.indexOf('CTRL') > -1;
            combo.alt     = parts.indexOf('ALT') > -1;
            combo.shift   = parts.indexOf('SHIFT') > -1;
            combo.meta    = parts.indexOf('META') > -1 || parts.indexOf('META_RIGHT') > -1;
            return combo;
        } else throw new Error('Combo.fromString: Invalid string');
    };
    /**
     *  Determine if this Combo is exactly equivalent to another Combo
     *
     *  @memberOf Combo
     *  @instance
     *  @param {Combo} combo - The Combo to compare
     *  @return {boolean}
     */
    Combo.prototype.eq = function (combo) {
        if (!combo || !(combo instanceof Combo))
            return false;
        else if (!this.key.eq(combo.key))
            return false;
        else if (this.shift !== combo.shift)
            return false;
        else if (this.alt !== combo.alt)
            return false;
        else if (this.ctrl !== combo.ctrl)
            return false;
        else if (this.meta !== combo.meta)
            return false;
        else return true;
    };
    /**
     *  Determine if the this Combo was pressed given another Combo representing a keypress event.
     *
     *  @memberOf Combo
     *  @instance
     *  @param {boolean} ignoreKey - Set to true if you only want to match on meta keys
     *  @return {boolean}
     */
    Combo.prototype.isMatch = function (combo, ignoreKey) {
        if (!combo)
            throw new Error('Combo.isMatch called without a combo to match against.');

        if (this.key.isMeta()) {
            if ((this.shift || this.key.eq(Key.SHIFT)) && !combo.shift)
                return false;
            if ((this.alt   || this.key.eq(Key.ALT))   && !combo.alt)
                return false;
            if ((this.ctrl  || this.key.eq(Key.CTRL))  && !combo.ctrl)
                return false;
            if ((this.meta  || this.key.eq(Key.META) || this.key.eq(Key.META_RIGHT)) && !combo.meta)
                return false;
        }
        else {
            if (!ignoreKey && !this.key.eq(combo.key)) return false;
            if (this.shift && !combo.shift) return false;
            if (this.alt   && !combo.alt)   return false;
            if (this.ctrl  && !combo.ctrl)  return false;
            if (this.meta  && !combo.meta)  return false;
        }

        return true;
    };
    /** 
     * Check if a Combo requires the presence of the provided key.
     * 
     * @memberOf Combo
     * @instance
     * @param {number} which - The key code we want to know is required or not
     * @return {boolean}
     */
    Combo.prototype.requires = function(which) {
        if (typeof which !== 'number')
            throw new Error('Combo.requires: `which` must be a keycode (number)');

        if (this.key.code === which) return true;
        else if (this.ctrl  && this.key.eq(Key.CTRL))  return true;
        else if (this.shift && this.key.eq(Key.SHIFT)) return true;
        else if (this.alt   && this.key.eq(Key.ALT))   return true;
        else if (this.meta  && (this.key.eq(Key.META) || key.eq(Key.META_RIGHT)))
            return true;
        else return false;
    };
    /**
     * Check if this Combo contains any meta keys.
     *
     * @memberOf Combo
     * @instance
     * @return {boolean}
     */
    Combo.prototype.containsMetaKeys = function() {
        return this.ctrl || this.shift || this.alt || this.meta || this.key.isMeta();
    };

    exports.Combo = Combo;

    /**
     * Creates a new instance of the Bindings manager
     * 
     * @class
     * @classdesc Bindings is responsible for managing the mapping of behavior to Combos. In addition,
     *            it is responsible for listening in on keyup/keydown events document-wide, and if a
     *            Combo is matched, execute any associated handlers while also preventing the default
     *            behavior. It allows for persistance or transport by serializing the bindings currently
     *            managed, **but not the handlers**. Deserializing an instance of Bindings requires you
     *            to re-register all handlers.
     * @example
     *   // Toggle variable
     *   var toggled = false;
     *
     *   // Initialize manager
     *   var bindings = new Bindings();
     *
     *   bindings.add('displayAlert', new Combo(Key.A, [ Key.CTRL, Key.SHIFT ]));
     *   bindings.add('toggleFlag', new Combo(Key.F, [ Key.CTRL, Key.META ]));
     *
     *   // Map behavior to the displayAlert
     *   bindings.registerHandler('displayAlert', function() { alert('Hello!'); });
     *
     *   // Map behavior to the toggleFlag binding
     *   var toggleOn  = function() { toggled = true; };
     *   var toggleOff = function() { toggled = false; };
     *   bindings.registerToggle('toggleFlag', toggleOn, toggleOff);
     *
     *   See `examples/example.html` for a live demonstration of these concepts.
     *
     * @namespace Bindings
     * @constructor
     */
    function Bindings() {
        var self = this;
        document.addEventListener('keydown', handleKeydown, true);
        document.addEventListener('keyup',   handleKeyup,   true);

        this.bindings = [];
        this.handlers = [];

        function handleKeydown(e) {
            e.stopImmediatePropagation();

            var combo = Combo.fromEvent(e);
            // Execute any matching handlers
            self.getHandlersForCombo(combo)
                .filter(function(h) { return h.eventType === 'keydown'; })
                .tap(function(h) {
                    log('Bindings.handleKeydown called for Combo: ' + combo.toString() + '. Handler `' + h.name + '` was called.');
                }, true)
                .forEach(function(h) { h.handler(); });

            return false;
        }

        function handleKeyup(e) {
            e.stopImmediatePropagation();

            var combo = Combo.fromEvent(e);
            // Execute any matching handlers
            self.getHandlersForCombo(combo)
                .filter(function(h) { return h.eventType === 'keyup'; })
                .tap(function(h) {
                    log('Bindings.handleKeyup called for Combo: ' + combo.toString() + '. Handler `' + h.name + '` was called.');
                }, true)
                .forEach(function(h) { h.handler(); });

            return false;
        }
    }

    /**
     * Fetches a binding by it's name.
     *
     * @memberOf Bindings
     * @instance
     * @param  {string} name - Name of the binding
     * @return {object} The binding, if found, otherwise null
     */
    Bindings.prototype.get = function(name) {
        return find(this.bindings, function(b) { return b.name === name; });
    };

    /**
     * Adds a new binding.
     *
     * @memberOf Bindings
     * @instance
     * @param  {string} name - The name of the binding.
     * @param  {Combo} combo - The Combo which triggers this binding.
     */
    Bindings.prototype.add = function(name, combo) {
        if (!name || !combo)
            throw new Error('Keybindings.add: Invalid arguments provided');
        if (!(combo instanceof Combo))
            throw new Error('Keybindings.add: `combo` must be an instance of Combo');

        // If the binding name already exists, overwrite it
        var binding = find(this.bindings, function(b) { return b.name === name; });
        if (binding) {
            binding.combo = combo;
            log('Bindings.add: Updated existing binding - `' + name + '` with Combo: ' + combo.toString());
        } else {
            this.bindings.push({
                name:  name,
                combo: combo
            });
            log('Bindings.add: New binding - `' + name + '` with Combo: ' + combo.toString());
        }
    };

    /**
     * Register a handler for when a Combo is executed.
     *
     * @memberOf Bindings
     * @instance
     * @param  {string} bindingName - The name of the binding to watch
     * @param  {string} eventType - Either keyup or keydown, depending on needs. Defaults to keydown.
     * @param  {function} handler - The function to call when the Combo is executed.
     */
    Bindings.prototype.registerHandler = function(bindingName, eventType, handler) {
        // Permit eventType to be omitted and defaulted to keydown
        if (arguments.length === 2 && typeof eventType === 'function') {
            handler   = eventType;
            eventType = 'keydown';
        }

        if (!bindingName || !eventType || !handler || typeof handler !== 'function')
            throw new Error('Keybindings.registerHandler: Invalid arguments provided');

        this.handlers.push({
            name:      bindingName,
            eventType: eventType,
            handler:   handler
        });
        log('Bindings.registerHandler: Handler `' + bindingName + '` registered for `' + eventType + '` events.');
    };

    /**
     * Register a toggle for when a Combo is executed.
     *
     * @memberOf Bindings
     * @instance
     * @param  {string} bindingName - The name of the binding to watch
     * @param  {function} toggleOn  - The function to execute when toggling on
     * @param  {function} toggleOff - The function to execute when toggling off
     */
    Bindings.prototype.registerToggle = function(bindingName, toggleOn, toggleOff) {
        if (arguments.length !== 3) {
            throw new Error('Keybindings.registerToggle: You must provide all three arguments to this function.');
        }

        this.handlers.push({
            name: bindingName,
            eventType: 'keydown',
            // Wrap the toggle handlers in a closure that allows us 
            // to track the current state of the toggle, and call
            // the appropriate toggle handler. Assumes 'off' state
            // by default.
            handler: (function() {
                var on = false;
                return function() {
                    var args = Array.prototype.slice.call(arguments);
                    if (on) {
                        on = false;
                        toggleOff.apply(null, args);
                    } else {
                        on = true;
                        toggleOn.apply(null, args);
                    }
                };
            })()
        });
        log('Bindings.registerToggle: Toggle `' + bindingName + '` registered.');
    };

    /**
     * Serialize the current set of bindings (not the handlers)
     *
     * @memberOf Bindings
     * @instance
     * @return {string} - The Bindings instance as a JSON encoded string
     */
    Bindings.prototype.serialize = function() {
        // TODO: Serialize bindings even if JSON object is not provided
        if (typeof JSON === 'undefined')
            throw new Error('Your browser does not support JSON serialization.');
        return JSON.stringify(this);
    };

    /**
     * Deserialize a set of bindings into the current Bindings instance
     *
     * @memberOf Bindings
     * @instance
     * @param  {string} serialized - The JSON object to deserialize
     */
    Bindings.prototype.deserialize = function(serialized) {
        // TODO: Serialize bindings even if JSON object is not provided
        if (typeof JSON === 'undefined')
            throw new Error('Your browser does not support JSON serialization.');

        var parsed = JSON.parse(serialized);
        if (!parsed || !parsed.bindings || parsed instanceof Array)
            throw new Error('Keybindings.deserialize: Unable to deserialize keybindings');

        // Deserialize bindings
        var mapped = parsed.bindings.map(function(b) {
            b.combo = Combo.fromObject(b.combo);
            return b;
        });
        this.bindings = mapped;
    };

    /**
     * Gets the set of handlers for the given Combo
     *
     * @memberOf Bindings
     * @instance
     * @param {Combo} combo - The Combo to match handlers to.
     * @param {boolean} includeMeta - Include meta-only variations of the provided Combo
     */
    Bindings.prototype.getHandlersForCombo = function(combo, includeMeta) {
        var self     = this;
        var matching = this.bindings.filter(function(binding) {
            return includeMeta ? binding.combo.isMatch(combo, true) : binding.combo.isMatch(combo);
        });
        return this.handlers.filter(function(handler) {
            return find(matching, function(b) {
                return b.name === handler.name;
            });
        });
    };

    exports.Bindings = Bindings;

    return exports;

});
