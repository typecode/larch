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

    /*
     * Abstract field used as the base class for LarchRadioSet and
     * LarchCheckboxSet. This is only used internally.
     */
    var BaseBooleanFieldSet = function(options) {

        var o, self, base_fn, internal, elements, fn, handlers;

        o = $.extend({
            item_class: null,
            multi: false,
            orientation: larch.orientations.VERTICAL
        }, options);

        self = new BaseField(o);

        base_fn = {
            destroy: $.proxy(self.destroy, self)
        };

        self.menu_container = new MenuContainer({
            $e: self.$e,
            item_class: o.item_class,
            multi: o.multi,
            closeable: false
        });

        fn = {
            init: function() {
                fn.init_menu_key_events();
                larch.ensure_tabindex(self.$e);
                self.$e.on('change', handlers.change);
            },
            destroy: function() {
                base_fn.destroy();
                larch.remove_ensured_tabindex(self.$e);
                self.$e.off('change', handlers.change);
                self.menu_container.destroy();
            },

            init_menu_key_events: function() {
                var key_handlers = {};

                key_handlers[larch.key_codes.ENTER] = function(e, d) {
                    var fn = o.multi ? self.menu_container.toggle_highlighted : self.menu_container.select_highlighted;
                    if (fn() === true) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                };

                self.menu_container.attach_custom_key_events(key_handlers);
                self.menu_container.attach_arrow_key_events(o.orientation);
            }
        };

        handlers = {
            change: function(e, d) {
            }
        };

        self.destroy = fn.destroy;

        fn.init();

        return self;
    };

    return BaseBooleanFieldSet;

});