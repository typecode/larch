define([
    'jquery',
    'larch',
    'larch/tags',
    'larch/BaseField',
    'larch/validation',
    'larch/MenuContainer'
], function(
    $,
    larch,
    tags,
    BaseField,
    validation,
    MenuContainer) {
    'use strict';

    // Keeps track of the currently open LarchSelect instance
    var the_current_open = null;

    /*
     * Field type representing a select dropdown.
     *
     * DOM
     *
     * <div class='larch-select larch'>
     *     <div class='control'>
     *         <span class='display'></span>
     *     </div>
     *     <div class='menu'>
     *         <span class='item' data-value=''>...</span>
     *     </div>
     * </div>
     */
    var LarchSelect = larch.register_type('larch-select', function(options) {

        var o, self, base_fn, internal, elements, fn, handlers;

        o = $.extend({
            multi: false,
            default_val: null
        }, options);

        self = new BaseField(o);

        base_fn = {
            destroy: $.proxy(self.destroy, self),
            set_enabled: $.proxy(self.set_enabled, self)
        };

        internal = {
            is_multi: o.multi
        };

        elements = {
            doc: $(document),
            control: self.$e.find('> .' + larch.markup.CONTROL),
            display: self.$e.find('> .' + larch.markup.CONTROL + ' > .' + larch.markup.DISPLAY)
        };

        self.menu_container = new MenuContainer({
            $e: self.$e,
            multi: internal.is_multi
        });

        fn = {
            init: function() {
                fn.init_menu_key_events();

                larch.ensure_tabindex(self.$e);

                self.$e.on('change', handlers.change);
                self.$e.on('click', '.' + larch.markup.ITEM, handlers.item_click);

                elements.doc.on('click', handlers.doc_click);
                elements.control.on('click', '.' + tags.markup.CONTROL, handlers.tag_control_click);

                self.menu_container.on(larch.event_types.OPEN, handlers.menu_open);
                self.menu_container.on(larch.event_types.CLOSE, handlers.menu_close);

                // Silently set the current value to ensure that
                // the display is in sync
                fn.set_val(fn.get_val(), true);
            },
            destroy: function() {
                base_fn.destroy();

                larch.remove_ensured_tabindex(self.$e);

                self.$e.off('change', handlers.change);
                self.$e.off('click', '.' + larch.markup.ITEM, handlers.item_click);

                elements.doc.off('click', handlers.doc_click);
                elements.control.off('click', '.' + tags.markup.CONTROL, handlers.tag_control_click);

                self.menu_container.off(larch.event_types.OPEN, handlers.menu_open);
                self.menu_container.off(larch.event_types.CLOSE, handlers.menu_close);

                self.menu_container.destroy();
            },

            init_menu_key_events: function() {
                var key_handlers = {};

                key_handlers[larch.key_codes.ENTER] = function(e, d) {
                    if (!self.is_enabled()) {
                        return;
                    }
                    if (internal.is_multi) {
                        self.menu_container.toggle_highlighted();
                    } else {
                        if (self.menu_container.select_highlighted() === true) {
                            self.menu_container.close();
                        }
                    }
                };

                key_handlers[larch.key_codes.ESCAPE] = function(e, d) {
                    if (self.menu_container.is_open()) {
                        self.menu_container.close();
                        e.stopPropagation();
                    }
                };

                key_handlers[larch.key_codes.TAB] = function(e, d) {
                    if (self.menu_container.is_open()) {
                        self.menu_container.close();
                    }
                };

                self.menu_container.attach_custom_key_events(key_handlers);
                self.menu_container.attach_arrow_key_events();
            },

            get_placeholder_text: function() {
                var attr, text;
                attr = self.$e.attr('placeholder');
                if (attr) {
                    text = attr;
                } else {
                    text = '';
                }
                return text;
            },
            /*
             * Updates the display area of the select,
             * depending on the arg
             * If arg is a jQuery object, it is assumed to
             * be the currently selected item, and the display
             * is updated with either the value of the item's data-text
             * attribute, or the result of calling .text() on the item
             * If arg is falsey, the display is updated with a placeholder
             */
            update_display: function(arg) {
                var $item, buf, text;
                if (arg instanceof $ && arg.length) {
                    $item = arg;

                    if (internal.is_multi) {
                        text = $.map($.makeArray($item), function(it, i) {
                            return larch.get_display_for_element($(it));
                        });
                        text = tags.create_dom(text, tags.modes.DISMISSIBLE);
                    } else {
                        text = larch.get_display_for_element($item);
                    }
                    self.$e.removeClass(larch.markup.BLANK);
                    elements.display.html(text);
                    return;
                }
                if ((arg instanceof $ && !arg.length) || !arg) {
                    text = self.get_placeholder_text();
                    self.$e.addClass(larch.markup.BLANK);
                    elements.display.html(text);
                } else if (typeof arg === 'string') {
                    self.$e.addClass(larch.markup.BLANK);
                    elements.display.html(arg);
                }
            },
            set_display_str: function(str) {
                fn.update_display(str);
            },
            add_item: function($item) {
                self.menu_container.add_item($item);
                return self;
            },
            empty: function() {
                self.menu_container.empty();
                fn.update_display(false);
                return self;
            },

            set_val: function(val, silent) {
                var vals, $items, $to_select, has_val;

                has_val = false;

                if (fn.is_blank_val(val)) {
                    if (o.default_val) {
                        val = o.default_val;
                    } else {
                        self.menu_container.clear_selection(silent);
                        if (silent === true) {
                            fn.update_display(false);
                            return self;
                        }
                    }
                }

                $items = self.menu_container.get_items(true);

                if (internal.is_multi) {
                    vals = $.isArray(val) ? val : [val];
                    $to_select = $();
                    $.each(vals, function(i, v) {
                        var $item = $items.filter('[data-value="' + v + '"]');
                        if ($item.length == 1) {
                            has_val = true;
                            $to_select = $to_select.add($item);
                        }
                    });
                    self.menu_container.select($to_select, silent);
                    if (silent === true) {
                        fn.update_display($to_select);
                    }
                } else {
                    $items.each(function() {
                        var $item;
                        $item = $(this);
                        if ($item.data('value') == val) {
                            has_val = true;
                            self.menu_container.select($item, silent);
                            if (silent === true) {
                                fn.update_display($item);
                            }
                            return false;
                        }
                    });
                }

                if (!has_val && typeof val === 'string') {
                    self.menu_container.clear_selection(true);
                }

                return self;
            },
            get_val: function() {
                var $selected;
                $selected = self.menu_container.get_selected();
                if (internal.is_multi) {
                    if ($selected.length) {
                        return $.map($.makeArray($selected), function(item, i) {
                            return $(item).data('value');
                        });
                    }
                } else {
                    if ($selected.length) {
                        return $selected.data('value');
                    }
                }
                return internal.is_multi ? [] : null;
            },
            set_enabled: function(enabled) {
                if (enabled) {
                    larch.ensure_tabindex(self.$e);
                } else {
                    larch.remove_ensured_tabindex(self.$e);
                    self.menu_container.close();
                }
                return base_fn.set_enabled(enabled);
            },
            reset: function(silent) {
                if (internal.is_multi) {
                    self.set_val([], silent);
                } else {
                    self.set_val(null, silent);
                }
                self.set_valid(validation.states.UNDETERMINED, silent);
                self.set_enabled(true);
                self.trigger(larch.event_types.RESET);
                return self;
            },
            is_blank_val: function(val) {
                if (internal.is_multi) {
                    return ($.isArray(val) && !val.length);
                }
                return (typeof val === 'object' && !val);
            },
            is_blank: function() {
                return fn.is_blank_val(self.get_val());
            },
            is_multi: function() {
                return internal.is_multi;
            }
        };

        handlers = {
            change: function(e, d) {
                if (d && d.$item) {
                    fn.update_display(d.$item);
                }
            },
            doc_click: function(e, d) {
                var self_dom, control_dom;
                if (!self.$e.length || !elements.control.length) {
                    return;
                }
                if (!self.is_enabled()) {
                    return;
                }
                self_dom = self.$e[0];
                if (self_dom == e.target || $.contains(self_dom, e.target)) {
                    control_dom = elements.control[0];
                    if (control_dom == e.target|| $.contains(control_dom, e.target)) {
                        if (self.menu_container.is_open()) {
                            self.menu_container.close();
                        } else {
                            self.menu_container.open();
                        }
                    }
                } else {
                    self.menu_container.close();
                }
            },
            tag_control_click: function(e, d) {
                var $tag, text;
                if (!self.is_enabled()) {
                    return;
                }
                e.stopPropagation();
                $tag = $(this).closest('.' + tags.markup.TAG);
                text = $tag.data('value');
                tags.remove_tag($tag, function() {
                    // Sync the menu
                    self.menu_container.get_selected().each(function() {
                        var $item = $(this);
                        if (larch.get_display_for_element($item) == text) {
                            self.menu_container.toggle($item);
                            return false;
                        }
                    });
                });
            },
            item_click: function(e, d) {
                if (!internal.is_multi) {
                    self.menu_container.close();
                }
            },
            menu_open: function(e, d) {
                if (the_current_open && the_current_open != self) {
                    the_current_open.menu_container.close();
                }
                the_current_open = self;
            },
            menu_close: function(e, d) {
                if (the_current_open == self) {
                    the_current_open = null;
                }
            }
        };

        self.type = 'LarchSelect';

        self.elements = elements;

        self.destroy = fn.destroy;
        self.add_item = fn.add_item;
        self.empty = fn.empty;
        self.set_val = fn.set_val;
        self.get_val = fn.get_val;
        self.set_enabled = fn.set_enabled;
        self.reset = fn.reset;
        self.is_blank = fn.is_blank;
        self.is_multi = fn.is_multi;
        self.get_placeholder_text = fn.get_placeholder_text;
        self.set_display_str = fn.set_display_str;

        fn.init();

        return self;
    });

    return LarchSelect;
});
