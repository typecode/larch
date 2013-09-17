define(['jquery', 'larch'], function($, larch) {

    'use strict';

    /*
     * Represents an element containing a menu, providing functionality
     * for adding, selecting, highlighting menu items, opening/closing
     * the menu, etc.
     * Supports both having a single item at a time being selected, or
     * allowing multiple items to be selected at once.
     *
     * DOM
     *
     * - Individual tems can be spans or divs
     * - The 'value' associated with each item is represented by a data-value
     *   attribute on the item.
     *
     * <div>
     *     <div class='menu'>
     *         <span class='item' data-value='value 1'>...</span>
     *         <div class='item' data-value='value 2'>...</div>
     *     </div>
     * </div>
     */
    var MenuContainer = function(options) {

        var o, self, internal, elements, fn, handlers;

        o = $.extend({
            $e: null,
            selector: '',
            menu_class: larch.markup.MENU,
            item_class: larch.markup.ITEM,
            auto_handle_item_click: true,
            multi: false,
            closeable: true
        }, options);

        self = this;

        internal = {
            $e: (o.$e ? o.$e : $(o.selector)),
            has_arrow_key_events: false,
            has_custom_key_events: false,
            is_multi: o.multi,
            is_closeable: o.closeable
        };

        elements = {
            menu: internal.$e.children('.' + o.menu_class)
        };

        fn = {
            init: function() {
                internal.$e.on('blur', handlers.blur);
                if (o.auto_handle_item_click) {
                    elements.menu.on('click', '.' + o.item_class, handlers.item_click);
                }
                elements.menu.on('mouseenter', '.' + o.item_class, handlers.item_mouseenter);
                elements.menu.on('mouseleave', '.' + o.item_class, handlers.item_mouseleave);
            },
            destroy: function() {
                internal.$e.off('blur', handlers.blur);
                if (o.auto_handle_item_click) {
                    elements.menu.off('click', '.' + o.item_class, handlers.item_click);
                }
                elements.menu.off('mouseenter', '.' + o.item_class, handlers.item_mouseenter);
                elements.menu.off('mouseleave', '.' + o.item_class, handlers.item_mouseleave);
                if (internal.has_arrow_key_events) {
                    fn.detach_arrow_key_events();
                }
                if (internal.has_custom_key_events) {
                    fn.detach_custom_key_events();
                }
            },

            attach_arrow_key_events: function(orientation) {
                self.$e.on('keydown', {orientation: orientation}, handlers.keydown_for_arrow_keys);
                internal.has_arrow_key_events = true;
                return self;
            },
            detach_arrow_key_events: function() {
                self.$e.off('keydown', handlers.keydown_for_arrow_keys);
                internal.has_arrow_key_events = false;
                return self;
            },
            attach_custom_key_events: function(key_handlers) {
                self.$e.on('keydown', key_handlers || {}, handlers.keydown_for_custom_keys);
                internal.has_custom_key_events = true;
                return self;
            },
            detach_custom_key_events: function(key_handlers) {
                self.$e.off('keydown', handlers.keydown_for_custom_keys);
                internal.has_custom_key_events = false;
                return self;
            },

            add_item: function($item) {
                if (typeof $item === 'string') {
                    $item = $($item);
                }
                $item.addClass(o.item_class);
                elements.menu.append($item);
                return self;
            },
            set_content: function(content) {
                if (typeof content == 'string') {
                    elements.menu.html(content);
                } else if (content instanceof $) {
                    elements.menu.empty().append(content);
                }
                return self;
            },
            empty: function() {
                elements.menu.empty();
                return self;
            },

            select: function($item, silent) {
                var $items;

                if (!internal.is_multi && $item.hasClass(larch.markup.CURRENT)) {
                    return;
                }

                $items = fn.get_items(true);
                $items.removeClass(larch.markup.CURRENT);
                $item.addClass(larch.markup.CURRENT);

                if (silent !== true) {
                    self.$e.trigger('change', {
                        $item: $item
                    });
                }

                return self;
            },
            toggle: function($item, silent) {
                $item.toggleClass(larch.markup.CURRENT);
                return fn.select(fn.get_selected(), silent);
            },
            clear_selection: function(silent) {
                fn.get_items(true).removeClass(larch.markup.CURRENT);
                if (silent !== true) {
                    self.$e.trigger('change', {});
                }
                return self;
            },
            select_highlighted: function() {
                var $highlighted;
                $highlighted = fn.get_highlighted();
                if ($highlighted.length == 1) {
                    fn.select($highlighted);
                    return true;
                }
                return false;
            },
            toggle_highlighted: function() {
                var $highlighted;
                $highlighted = fn.get_highlighted();
                if ($highlighted.length == 1) {
                    fn.toggle($highlighted);
                    return true;
                }
                return false;
            },
            highlight: function($item) {
                if ($item.hasClass(larch.markup.HIGHLIGHT)) {
                    return;
                }
                fn.get_items().removeClass(larch.markup.HIGHLIGHT);
                $item.addClass(larch.markup.HIGHLIGHT);
            },
            unhighlight: function($item) {
                if (!$item.hasClass(larch.markup.HIGHLIGHT)) {
                    return;
                }
                $item.removeClass(larch.markup.HIGHLIGHT);
            },
            move_highlight: function(towards_next) {
                var $items, $highlighted, index, $target;
                $items = fn.get_items(false);
                if (!$items.length) {
                    return;
                }
                $highlighted = fn.get_highlighted();
                if ($highlighted.length == 1) {
                    index = $items.index($highlighted);
                    if (towards_next === true) {
                        $target = $items.eq(index + 1);
                    } else {
                        $target = $items.eq(index - 1);
                    }
                }
                if (($target && $target.length !== 1) || !$target) {
                    $target = towards_next ? $items.first() : $items.last();
                }
                fn.highlight($target);
            },

            get_items: function(include_hidden) {
                var $items;
                $items = elements.menu.find('.' + o.item_class);
                if (include_hidden !== true) {
                    $items = $items.filter(function() {
                        return $(this).css('display') !== 'none';
                    });
                }
                return $items;
            },
            get_selected: function() {
                return elements.menu.find('.' + o.item_class + '.' + larch.markup.CURRENT);
            },
            get_highlighted: function() {
                return elements.menu.find('.' + o.item_class + '.' + larch.markup.HIGHLIGHT + ':visible');
            },

            open: function() {
                if (!self.$e.hasClass(larch.markup.OPEN)) {
                    self.$e.addClass(larch.markup.OPEN);
                    self.trigger(larch.event_types.OPEN);
                }
                return self;
            },
            close: function() {
                if (self.$e.hasClass(larch.markup.OPEN)) {
                    self.$e.removeClass(larch.markup.OPEN);
                    self.trigger(larch.event_types.CLOSE);
                }
                return self;
            },
            is_open: function() {
                if (!internal.is_closeable) {
                    return true;
                }
                return self.$e.hasClass(larch.markup.OPEN);
            }
        };

        handlers = {
            blur: function(e, d) {
                var $highlighted;
                $highlighted = fn.get_highlighted();
                if ($highlighted.length == 1) {
                    fn.unhighlight($highlighted);
                }
            },
            item_click: function(e, d) {
                if (internal.is_multi) {
                    fn.toggle($(this));
                } else {
                    fn.select($(this));
                }
            },
            item_mouseenter: function(e, d) {
                fn.highlight($(this));
            },
            item_mouseleave: function(e, d) {
                fn.unhighlight($(this));
            },
            keydown_for_arrow_keys: function(e, d) {
                var prevent_default, key_codes, orientation, up_key, down_key;
                prevent_default = true;
                key_codes = larch.key_codes;
                orientation = e.data.orientation || larch.orientations.VERTICAL;
                if (orientation == larch.orientations.HORIZONTAL) {
                    up_key = key_codes.LEFT;
                    down_key = key_codes.RIGHT;
                } else {
                    up_key = key_codes.UP;
                    down_key = key_codes.DOWN;
                }
                switch (e.which) {
                    case up_key:
                        if (fn.is_open()) {
                            fn.move_highlight(false);
                        } else if (fn.get_items().length) {
                            fn.open();
                        }
                        break;
                    case down_key:
                        if (fn.is_open()) {
                            fn.move_highlight(true);
                        } else if (fn.get_items().length) {
                            fn.open();
                        }
                        break;
                    default:
                        prevent_default = false;
                        break;
                }
                if (prevent_default) {
                    e.preventDefault();
                }
            },
            keydown_for_custom_keys: function(e, d) {
                if ($.isFunction(e.data[e.which])) {
                    e.data[e.which].apply(this, arguments);
                }
            }
        };

        self.$e = internal.$e;
        self.destroy = fn.destroy;
        self.attach_arrow_key_events = fn.attach_arrow_key_events;
        self.detach_arrow_key_events = fn.detach_arrow_key_events;
        self.attach_custom_key_events = fn.attach_custom_key_events;
        self.detach_custom_key_events = fn.detach_custom_key_events;
        self.add_item = fn.add_item;
        self.set_content = fn.set_content;
        self.empty = fn.empty;
        self.select = fn.select;

        if (internal.is_multi) {
            self.toggle = fn.toggle;
            self.toggle_highlighted = fn.toggle_highlighted;
        }

        self.clear_selection = fn.clear_selection;
        self.select_highlighted = fn.select_highlighted;
        self.get_items = fn.get_items;
        self.get_selected = fn.get_selected;
        self.get_highlighted = fn.get_highlighted;

        if (internal.is_closeable) {
            self.open = fn.open;
            self.close = fn.close;
        }
        self.is_open = fn.is_open;

        self.on = $.proxy(self.$e.on, self.$e);
        self.off = $.proxy(self.$e.off, self.$e);
        self.trigger = $.proxy(self.$e.trigger, self.$e);

        fn.init();
    };

    return MenuContainer;
});
