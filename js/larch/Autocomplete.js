define([
    'jquery',
    'underscore',
    'larch',
    'larch/validation',
    'larch/MenuContainer'
], function(
    $,
    _,
    larch,
    validation,
    MenuContainer) {

    'use strict';

    var Autocomplete = function(options) {

        var self = this, o, internal, elements, fn, handlers;

        o = $.extend({
            src: null,
            data: null,
            param: 'query',
            manual_val: null,
            keyup_delay: 200
        }, options);

        internal = {
            field: null,
            menu_container: null,
            xhrobject: null,
            original_attr: null,
            manual_val: null,
            sticky_item_class: larch.markup.ITEM + '-' + larch.markup.STICKY
        };

        elements = {
            doc: $(document)
        };

        fn = {
            init: function(field) {
                var original_attr;

                internal.field = field;

                field.$e.addClass(larch.markup.AUTOCOMPLETE);

                internal.menu_container = new MenuContainer({
                    $e: field.$e,
                    item_class: larch.markup.ITEM
                });

                elements.doc.on('click', handlers.doc_click);
                internal.field.$e.on('keyup', handlers.keyup);
                internal.field.$e.on('change', handlers.change);

                fn.init_key_menu_events();

                if (field.autocomplete) {
                    console.warn('Autocomplete: overwriting an existing field autocomplete');
                }
                field.autocomplete = self;
                if (field.elements && field.elements.input) {
                    // prevent default browser autocomplete from interfering
                    internal.original_attr = field.elements.input.attr('autocomplete');
                    field.elements.input.attr('autocomplete', 'off');
                }

                if (o.manual_val) {
                    self.set_val(o.manual_val, true);
                }
            },
            destroy: function() {
                var field;
                field = internal.field;

                field.$e.removeClass(larch.markup.AUTOCOMPLETE);
                internal.menu_container.destroy();

                elements.doc.off('click', handlers.doc_click);
                field.$e.off('keyup', handlers.keyup);
                field.$e.off('change', handlers.change);

                delete field.autocomplete;
                if (field.elements && field.elements.input) {
                    if (internal.original_attr) {
                        field.elements.input.attr('autocomplete', internal.original_attr);
                    } else {
                        field.elements.input.removeAttr('autocomplete');
                    }
                }
            },

            init_key_menu_events: function() {
                var key_handlers = {};

                key_handlers[larch.key_codes.ENTER] = function(e, d) {
                    if (internal.menu_container.select_highlighted() === true) {
                        internal.menu_container.close();
                    }
                };

                key_handlers[larch.key_codes.ESCAPE] = function(e, d) {
                    if (internal.menu_container.is_open()) {
                        internal.menu_container.close();
                        e.stopPropagation();
                    }
                };

                key_handlers[larch.key_codes.TAB] = function(e, d) {
                    if (internal.menu_container.is_open()) {
                        internal.menu_container.close();
                    }
                };

                internal.menu_container.attach_custom_key_events(key_handlers);
                internal.menu_container.attach_arrow_key_events();
            },

            fetch: function(query) {
                var data, $item;

                if (internal.xhrobject) {
                    internal.xhrobject.abort();
                    internal.xhrobject = null;
                }

                data = $.extend({}, o.data);
                data[o.param] = query;

                internal.field.$e.addClass(larch.markup.LOADING);

                internal.xhrobject = $.ajax({
                    type: 'GET',
                    url: o.src,
                    data: data,
                    dataType: 'html',
                    success: function(d, ts, xhr) {
                        var $items, str;
                        $items = internal.menu_container.get_items(true);
                        $items.not('.' + internal.sticky_item_class).remove();
                        str = $.trim(d);
                        internal.manual_val = null;
                        if (str.length) {
                            internal.menu_container.add_item(str);
                            if (internal.field.get_val() == query) {
                                $item = fn.get_menu_item_from_val(query);
                                if ($item) {
                                    internal.menu_container.select($item, true);
                                }
                            }
                            // the field could have lost focus between the time
                            // the last keyup occurred and the ajax request
                            // actually succeeded
                            if (internal.field.has_focus()) {
                                internal.menu_container.open();
                            }
                        } else {
                            internal.menu_container.close();
                        }
                    },
                    error: function(xhr, ts, err) {
                    },
                    complete: function(xhr, ts) {
                        internal.xhrobject = null;
                        internal.field.$e.removeClass(larch.markup.LOADING);
                    }
                });
            },

            get_menu_item_from_val: function(val) {
                var $items, lowercase_val, $item;
                $items = internal.menu_container.get_items(true);
                if (!$items.length) {
                    return;
                }
                lowercase_val = val.toLowerCase();
                $items.each(function() {
                    var $it, text;
                    $it = $(this);
                    text = larch.get_display_for_element($it);
                    if (text && text.toLowerCase() == lowercase_val) {
                        $item = $it;
                        return false;
                    }
                });
                if ($item) {
                    return $item;
                }
            },

            set_val: function(val, silent) {
                if (val) {
                    internal.manual_val = val;
                } else {
                    internal.manual_val = null;
                }
                if (silent !== true) {
                    internal.field.$e.trigger('change');
                }
            },
            get_val: function() {
                var $selected;
                if (internal.manual_val) {
                    return internal.manual_val;
                }
                $selected = internal.menu_container.get_selected();
                if ($selected.length !== 1) {
                    $selected = fn.get_menu_item_from_val(internal.field.get_val());
                }
                if ($selected && $selected.length == 1) {
                    return larch.get_val_for_element($selected);
                }
                return null;
            },
            is_blank: function() {
                return typeof self.get_val() === 'string' ? false : true;
            }
        };

        handlers = {
            doc_click: function(e, d) {
                var self_dom;
                self_dom = internal.field.$e[0];
                if (!(self_dom == e.target || $.contains(self_dom, e.target))) {
                    internal.menu_container.close();
                }
            },
            keyup: _.debounce(function(e, d) {
                if (internal.field.is_blank()) {
                    internal.menu_container.clear_selection(true).close();
                } else if (
                    (e.which >= 48 && e.which <= 90) ||
                    e.which == larch.key_codes.BACKSPACE ||
                    e.which == larch.key_codes.DELETE
                ) {
                    fn.fetch(internal.field.get_val());
                }
            }, o.keyup_delay),
            change: function(e, d) {
                if (d && d.$item) {
                    internal.field.set_val(larch.get_display_for_element(d.$item), true);
                    internal.field.focus();
                    internal.menu_container.close();
                }
            }
        };

        self.init = fn.init;
        self.destroy = fn.destroy;
        self.set_val = fn.set_val;
        self.get_val = fn.get_val;
        self.is_blank = fn.is_blank;
    };

    Autocomplete.strict_autocomplete_broker = function(name) {
        return function(data, fields) {
            var field;
            field = fields[name];
            data[name] = field.autocomplete.get_val();
            return data;
        };
    };

    validation.register_fv_factory('strict_autocomplete', {
        /*
         * If the field instance has an autocomplete attached to it,
         * this validator checks to ensure that the field has a value
         * that came from the autocomplete menu. This is intended for
         * use with free form input field like LarchInput, LarchTagInput, etc
         */
        create: function() {
            return function(field) {
                if (field.autocomplete && !field.is_blank()) {
                    return !(field.autocomplete.is_blank());
                }
            };
        }
    });

    return Autocomplete;

});