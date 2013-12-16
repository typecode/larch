define([
    'jquery',
    'larch',
    'larch/tags',
    'larch/LarchInput'
], function(
    $,
    larch,
    tags,
    LarchInput) {
    'use strict';

    /*
     * Field type representing a text-based input used to enter free-form
     * tags. Tags are generated as the user types into the input and presses
     * the comma or enter key. This field's set_val and get_val functions
     * relate to the tags, rather than the actual value of the text input.
     *
     * DOM
     *
     * <div class='larch-tag-input larch'>
     *     <div class='control'>
     *         <span class='tag dismissible'>
     *             <span class='tag-display'>Tag</span>
     *             <span class='tag-control'></span>
     *         </span>
     *         <input type='text'>
     *         <div class='blank-ui'>
     *             <span class='placeholder'>Hint text</span>
     *         </div>
     *     </div>
     * </div>
     */
    var LarchTagInput = larch.register_type('larch-tag-input', function(options) {

        var o, self, base_fn, internal, elements, fn, handlers;

        o = $.extend({
        }, options);

        self = new LarchInput(o);

        base_fn = {
            destroy: $.proxy(self.destroy, self),
            _handle_blur: $.proxy(self._handle_blur, self)
        };

        internal = {
        };

        elements = self.elements;

        fn = {
            init: function() {
                elements.input.on('keyup', handlers.input_keyup);
                elements.input.on('change', handlers.input_change);
                elements.control.on('click', '.' + tags.markup.DISPLAY, handlers.tag_display_click);
                elements.control.on('click', '.' + tags.markup.CONTROL, handlers.tag_control_click);
            },
            destroy: function() {
                base_fn.destroy();

                elements.input.off('keyup', handlers.input_keyup);
                elements.input.off('change', handlers.input_change);
                elements.control.off('click', '.' + tags.markup.DISPLAY, handlers.tag_display_click);
                elements.control.off('click', '.' + tags.markup.CONTROL, handlers.tag_control_click);
            },

            set_val: function(val, silent) {
                var vals, old_val;
                vals = $.isArray(val) ? val : [val];
                old_val = self.get_val();
                fn.get_tags().remove();
                $.each(vals, function(i, text) {
                    if (text) {
                        fn.create_tag(text);
                    }
                });
                if (silent !== true) {
                    $.each(vals, function(i, text) {
                        if (text != old_val[i]) {
                            self.trigger('change');
                            return false;
                        }
                    });
                }
            },
            get_val: function() {
                var val;
                val = [];
                fn.get_tags().each(function() {
                    val.push($(this).data('value'));
                });
                return val;
            },
            is_blank: function() {
                return fn.get_tags().length ? false : true;
            },

            get_tags: function() {
                return elements.control.find('.' + tags.markup.TAG);
            },
            create_tag: function(text) {
                if (fn.get_tags().removeClass(larch.markup.HIGHLIGHT).filter('[data-value="' + text + '"]').length === 0) {
                    elements.input.before($(tags.create_dom(text, tags.modes.DISMISSIBLE)));
                }
            },
            create_tag_from_input: function() {
                var buf, text;
                buf = elements.input.val().split(',');
                text = $.trim(buf[0]);
                if (!text && buf[1]) {
                    text = $.trim(buf[1]);
                }
                if (text) {
                    fn.create_tag(text);
                    elements.input.val('');
                    return true;
                }
                return false;
            },

            _handle_blur: function(e, d) {
                if (fn.create_tag_from_input() !== false) {
                    self.$e.trigger('change');
                }
                base_fn._handle_blur(e, d);
            }
        };

        handlers = {
            input_keyup: function(e, d) {
                var key_codes, $current_tags, $highlight_tag;
                key_codes = larch.key_codes;
                if (e.which == key_codes.COMMA || e.which == key_codes.ENTER) {
                    if (fn.create_tag_from_input() !== false) {
                        self.$e.trigger('change');
                    }
                } else if (e.which == key_codes.BACKSPACE || e.which == key_codes.DELETE) {
                    if (!elements.input.val()) {
                        $current_tags = fn.get_tags();
                        if ($current_tags.length) {
                            $highlight_tag = $current_tags.filter('.' + larch.markup.HIGHLIGHT);
                            if ($highlight_tag.length == 1) {
                                $highlight_tag.prev('.' + tags.markup.TAG).addClass(larch.markup.HIGHLIGHT);
                                tags.remove_tag($highlight_tag, function() {
                                    self.$e.trigger('change');
                                });
                            } else {
                                $current_tags.last().addClass(larch.markup.HIGHLIGHT);
                            }
                        }
                    }
                } else if (e.which == key_codes.LEFT) {
                    fn.get_tags().filter('.' + larch.markup.HIGHLIGHT).removeClass(larch.markup.HIGHLIGHT).prev('.' + tags.markup.TAG).addClass(larch.markup.HIGHLIGHT);
                } else if (e.which == key_codes.RIGHT) {
                    fn.get_tags().filter('.' + larch.markup.HIGHLIGHT).removeClass(larch.markup.HIGHLIGHT).next('.' + tags.markup.TAG).addClass(larch.markup.HIGHLIGHT);
                } else {
                    fn.get_tags().removeClass(larch.markup.HIGHLIGHT);
                }
            },
            input_change: function(e, d) {
                e.stopPropagation();
            },
            tag_control_click: function(e, d) {
                tags.remove_tag($(this).closest('.' + tags.markup.TAG), function() {
                    self.$e.trigger('change');
                });
            },
            tag_display_click: function(e, d) {
                $(this).closest('.' + tags.markup.TAG).addClass(larch.markup.HIGHLIGHT).siblings().removeClass(larch.markup.HIGHLIGHT);
            }
        };

        self.type = 'LarchTagInput';

        self.destroy = fn.destroy;
        self.set_val = fn.set_val;
        self.get_val = fn.get_val;
        self.is_blank = fn.is_blank;

        self._handle_blur = fn._handle_blur;

        fn.init();

        return self;
    });

    return LarchTagInput;


});