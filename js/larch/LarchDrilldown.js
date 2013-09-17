define([
    'jquery',
    'larch',
    'larch/BaseField',
    'larch/MenuContainer'
], function(
    $,
    larch,
    BaseField,
    MenuContainer) {
    'use strict';

    var dd_markup = {
        CURRENT_ANCESTOR: 'state-current-ancestor',
        FLAG_TO_SHOW:     'state-should-show',
        FLAG_TO_HIDE:     'state-should-hide'
    };

    var ancestor_css_regex = new RegExp('\\b'+dd_markup.CURRENT_ANCESTOR+'-\\S+', 'g');

    /*
     * Field type representing a drilldown.
     *
     * DOM
     *
     * <div class='larch-drilldown larch'>
     *     <div class='menu'>
     *         <span class='item' data-value=''>...</span> 
     *     </div>
     * </div>
     */
    var LarchDrilldown = larch.register_type('larch-drilldown', function(options) {

        var o, self, base_fn, internal, elements, fn, handlers;

        o = $.extend({
            slide_up_speed: 250,
            slide_down_speed: 250,
            start_with_root_collapsed: true
        }, options);

        self = new BaseField(o);

        base_fn = {
            destroy: $.proxy(self.destroy, self)
        };

        internal = {
            is_root_collapsed: o.start_with_root_collapsed ? true : false
        };

        elements = {
        };

        self.menu_container = new MenuContainer({
            $e: self.$e,
            item_class: larch.markup.ITEM,
            auto_handle_item_click: false,
            closeable: false
        });

        fn = {
            init: function() {
                fn.init_menu_key_events();

                larch.ensure_tabindex(self.$e);

                self.$e.on('click', '.' + larch.markup.ITEM, handlers.item_click);
                self.$e.on('change', handlers.change);
            },
            destroy: function() {
                base_fn.destroy();
                larch.remove_ensured_tabindex(self.$e);
                self.$e.off('click', '.' + larch.markup.ITEM, handlers.item_click);
                self.$e.off('change', handlers.change);
                self.menu_container.destroy();
            },

            init_menu_key_events: function() {
                var key_handlers = {};

                key_handlers[larch.key_codes.ENTER] = function(e, d) {
                    var $highlighted;
                    $highlighted = self.menu_container.get_highlighted();
                    if ($highlighted.length == 1) {
                        $highlighted.click();
                    }
                };

                key_handlers[larch.key_codes.ESCAPE] = function(e, d) {
                    if (!internal.is_root_collapsed) {
                        self.menu_container.get_items(true).filter('[data-level=0]').click();
                    }
                };

                self.menu_container.attach_custom_key_events(key_handlers);
                self.menu_container.attach_arrow_key_events();
            },

            update: function($items, $selected) {
                var node, path, ancestors, $to_show, $to_hide, $root, root_val;

                $items.addClass(dd_markup.FLAG_TO_HIDE).removeClass(dd_markup.FLAG_TO_SHOW);
                $items.removeClass(dd_markup.CURRENT_ANCESTOR).removeClass(function(i, css) {
                    return (css.match (ancestor_css_regex) || []).join(' ');
                });

                $root = $items.filter('[data-level=0]');
                root_val = $root.data('value');

                ancestors = [];
                node = $selected.data();

                if (node.level > 0) {
                    ancestors.push($root);
                }

                if (node.path) {
                    path = node.path.split(',');

                    $.each(path, function(i, value) {
                        var $item;
                        if (i == path.length - 1) {
                            return;
                        }
                        $item = $items.filter('[data-value="' + value +'"]').filter('[data-parent="' + (i > 0 ? path[i - 1] : root_val) + '"]');
                        ancestors.push($item);
                    });
                }

                // flag the ancestors
                $.each(ancestors, function(i, $item) {
                    $item.removeClass(dd_markup.FLAG_TO_HIDE).addClass(dd_markup.FLAG_TO_SHOW + ' ' + dd_markup.CURRENT_ANCESTOR + ' ' + dd_markup.CURRENT_ANCESTOR+'-'+(i));
                });
                // flag the selected item
                $selected.removeClass(dd_markup.FLAG_TO_HIDE).addClass(dd_markup.FLAG_TO_SHOW);

                // flag the direct children
                $items.filter('[data-parent="' + node.value + '"][data-level=' + (node.level + 1) +']').removeClass(dd_markup.FLAG_TO_HIDE).addClass(dd_markup.FLAG_TO_SHOW);

                if (!internal.is_root_collapsed) {
                    $to_show = $items.filter('.' + dd_markup.FLAG_TO_SHOW);
                    $to_hide = $items.filter('.' + dd_markup.FLAG_TO_HIDE);

                    $to_show.slideDown(o.slide_down_speed);
                    $to_hide.slideUp(o.slide_up_speed);
                }
            },

            set_val: function(val, silent) {
                var $items, $current;

                $items = self.menu_container.get_items(true);
                if (val) {
                    $current = $items.filter('[data-path="' + val +'"]');
                } else {
                    $current = $items.filter('[data-level=0]');
                }

                if ($current.length == 1) {
                    if ($current.data('level') > 0) {
                        internal.is_root_collapsed = false;
                    }
                    self.menu_container.select($current, silent);
                    if (silent === true) {
                        fn.update($items, $current);
                    }
                }

                return self;
            },
            get_val: function() {
                var $selected;
                $selected = self.menu_container.get_selected();
                if ($selected.length == 1) {
                    return $selected.data('path');
                }
            },

            is_blank: function() {
                return self.get_val() ? true : false;
            }
        };

        handlers = {
            item_click: function(e, d) {
                var $item, is_root;
                $item = $(this);
                is_root = $item.data('level') === 0;
                if (is_root) {
                    if (internal.is_root_collapsed) {
                        internal.is_root_collapsed = false;
                        self.menu_container.get_items(true).filter('.' + dd_markup.FLAG_TO_SHOW).slideDown(o.slide_down_speed);
                    } else {
                        if ($item.hasClass(larch.markup.CURRENT)) {
                            internal.is_root_collapsed = true;
                            self.menu_container.get_items(true).filter(':visible').not('[data-level=0]').slideUp(o.slide_up_speed);
                        }
                        self.menu_container.select($item);
                    }
                } else {
                    self.menu_container.select($item);
                }
            },
            change: function(e, d) {
                if (d && d.$item) {
                    fn.update(self.menu_container.get_items(true), d.$item);
                }
            }
        };

        self.type = 'LarchDrilldown';

        self.destroy = fn.destroy;
        self.set_val = fn.set_val;
        self.get_val = fn.get_val;
        self.is_blank = fn.is_blank;

        fn.init();

        return self;
    });

    return LarchDrilldown;
});
