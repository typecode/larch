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
     * Field type representing a text-based input. The actual form element
     * can be an <input> with type='text', or type='password', <textarea>, etc.
     *
     * DOM
     *
     * <div class='larch-input larch'>
     *     <div class='control'>
     *         <input type='text'>
     *         <div class='blank-ui'>
     *             <span class='placeholder'>Hint text</span>
     *         </div>
     *     </div>
     * </div>
     */
    var LarchInput = larch.register_type('larch-input', function(options) {

        var o, self, base_fn, internal, elements, fn, handlers;

        o = $.extend({
        }, options);

        self = new BaseField(o);

        base_fn = {
            destroy: $.proxy(self.destroy, self),
            set_enabled: $.proxy(self.set_enabled, self),
            _handle_blur: $.proxy(self._handle_blur, self)
        };

        internal = {
        };

        elements = {
            control: self.$e.children('.' + larch.markup.CONTROL),
            input: self.$e.children('.' + larch.markup.CONTROL).children('input, textarea'),
            blank_ui: null
        };

        fn = {
            init: function() {
                elements.blank_ui = fn.init_blank_ui();
                if (self._should_hide_blank_ui()) {
                    fn.hide_blank_ui();
                } else {
                    fn.show_blank_ui();
                }

                elements.input.on('focus', handlers.input_focus);
                elements.input.on('blur', handlers.input_blur);
                elements.input.on('keyup', handlers.input_keyup);
                self.$e.on('click', ('.' + larch.markup.CONTROL), handlers.control_click);
            },
            destroy: function() {
                base_fn.destroy();

                elements.input.off('focus', handlers.input_focus);
                elements.input.off('blur', handlers.input_blur);
                elements.input.off('keyup', handlers.input_keyup);
                self.$e.off('click', ('.' + larch.markup.CONTROL), handlers.control_click);
            },

            init_blank_ui: function() {
                var $ui;
                $ui = elements.control.children('.' + larch.markup.BLANK_UI);
                if ($ui.length !== 1) {
                    $ui = $();
                }
                return $ui;
            },
            show_blank_ui: function() {
                self.$e.addClass(larch.markup.BLANK);
                elements.blank_ui.fadeIn(100);
                return self;
            },
            hide_blank_ui: function() {
                self.$e.removeClass(larch.markup.BLANK);
                elements.blank_ui.hide();
                return self;
            },

            set_val: function(val, silent) {
                var old_val;
                old_val = self.get_val();
                elements.input.val(val);
                if (self._should_hide_blank_ui()) {
                    fn.hide_blank_ui();
                } else {
                    fn.show_blank_ui();
                }
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

            set_enabled: function(enabled) {
                if (enabled) {
                    elements.input.removeAttr('disabled');
                } else {
                    elements.input.attr('disabled', true);
                }
                return base_fn.set_enabled(enabled);
            },
            focus: function() {
                elements.input.focus();
                return self;
            },

            _handle_blur: function(e, d) {
                base_fn._handle_blur(e, d);
                if (self.is_blank()) {
                    fn.show_blank_ui();
                }
            },
            _handle_keyup: function(e, d) {
                if (self._should_hide_blank_ui()) {
                    fn.hide_blank_ui();
                }
            },
            _should_hide_blank_ui: function() {
                // specifically check blank state against the input element
                // instead of calling self.is_blank()
                // because subclasses (such as LarchTagInput may override
                // is_blank()) On keyup we only want to clear the hint if the
                // input has had text typed into it
                return $.trim(elements.input.val()) ? true : false;
            }
        };

        handlers = {
            input_focus: function(e, d) {
                self._handle_focus(e, d);
            },
            input_blur: function(e, d) {
                self._handle_blur(e, d);
            },
            input_keyup: function(e, d) {
                self._handle_keyup(e, d);
            },
            control_click: function(e, d) {
                if (!self.has_focus()) {
                    self.focus();
                }
            }
        };

        self.type = 'LarchInput';

        self.elements = elements;

        self.destroy = fn.destroy;
        self.set_val = fn.set_val;
        self.get_val = fn.get_val;
        self.set_enabled = fn.set_enabled;
        self.focus = fn.focus;

        self._handle_blur = fn._handle_blur;
        self._handle_keyup = fn._handle_keyup;
        self._should_hide_blank_ui = fn._should_hide_blank_ui;

        fn.init();

        return self;
    });

    return LarchInput;
});
