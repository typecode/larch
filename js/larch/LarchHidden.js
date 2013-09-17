define([
    'jquery',
    'larch',
    'larch/BaseField'
], function(
    $,
    larch,
    BaseField) {
    'use strict';

    /*
     * Field type representing a hidden input.
     *
     * DOM
     *
     * <div class='larch-hidden larch'>
     *     <input type='hidden'>
     * </div>
     */
    var LarchHidden = larch.register_type('larch-hidden', function(options) {

        var o, self, base_fn, internal, elements, fn, handlers;

        o = $.extend({
        }, options);

        self = new BaseField(o);

        base_fn = {
        };

        internal = {
            original_val: null
        };

        elements = {
            input: self.$e.children('input[type=hidden]')
        };

        fn = {
            init: function() {
                internal.original_val = self.get_val();
            },

            set_val: function(val, silent) {
                var old_val;
                old_val = self.get_val();
                elements.input.val(val);
                if (silent !== true) {
                    if (old_val != val) {
                        elements.input.trigger('change');
                    }
                }
                return self;
            },
            get_val: function() {
                return elements.input.val();
            },
            reset: function(silent) {
                if (internal.original_val) {
                    self.set_val(internal.original_val, silent);
                }
                self.trigger(larch.event_types.RESET);
                return self;
            },

            set_enabled: function() { return self; },
            focus: function() { return self; },
            _handle_focus: $.noop,
            _handle_blur: $.noop
        };

        handlers = {
        };

        self.type = 'LarchHidden';

        self.set_val = fn.set_val;
        self.get_val = fn.get_val;
        self.reset = fn.reset;
        self.set_enabled = fn.set_enabled;
        self.focus = fn.focus;

        self._handle_focus = fn._handle_focus;
        self._handle_blur = fn._handle_blur;

        fn.init();

        return self;
    });

    return LarchHidden;
});
