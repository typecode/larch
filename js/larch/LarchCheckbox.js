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
     * Field type representing a single checkbox
     * (Use LarchCheckboxSet for dealing with an array
     * of checkboxes)
     *
     * DOM
     *
     * <div class='larch-checkbox larch'>
     *     <div class='control'>
     *         <div class='checkbox'></div>
     *     </div>
     *     <span class='label'>Label</span>
     * </div>
     */
    var LarchCheckbox = larch.register_type('larch-checkbox', function(options) {

        var o, self, base_fn, internal, elements, fn, handlers;

        o = $.extend({
        }, options);

        self = new BaseField(o);

        base_fn = {
            destroy: $.proxy(self.destroy, self)
        };

        fn = {
            init: function() {
                larch.ensure_tabindex(self.$e);
                self.$e.on('click', handlers.click);
                self.$e.on('mouseenter', handlers.mouseenter);
                self.$e.on('mouseleave', handlers.mouseleave);
                self.$e.on('keydown', handlers.keydown);
            },
            destroy: function() {
                base_fn.destroy();

                larch.remove_ensured_tabindex(self.$e);
                self.$e.off('click', handlers.click);
                self.$e.off('mouseenter', handlers.mouseenter);
                self.$e.off('mouseleave', handlers.mouseleave);
                self.$e.off('keydown', handlers.keydown);
            },

            set_val: function(val, silent) {
                var old_val;
                old_val = self.get_val();

                if (val) {
                    val = true;
                    self.$e.addClass(larch.markup.CURRENT);
                } else {
                    val = false;
                    self.$e.removeClass(larch.markup.CURRENT);
                }

                if (silent !== true) {
                    if (old_val != val) {
                        self.$e.trigger('change');
                    }
                }

                return self;
            },
            get_val: function() {
                return self.$e.hasClass(larch.markup.CURRENT);
            },
            is_blank: function() {
                return self.get_val() ? false : true;
            }
        };

        handlers = {
            click: function(e, d) {
                self.set_val(!(self.get_val()));
            },
            mouseenter: function(e, d) {
                self.$e.addClass(larch.markup.HIGHLIGHT);
            },
            mouseleave: function(e, d) {
                self.$e.removeClass(larch.markup.HIGHLIGHT);
            },
            keydown: function(e, d) {
                if (e.which == larch.key_codes.ENTER) {
                    self.set_val(!(self.get_val()));
                    e.stopPropagation();
                }
            }
        };

        self.type = 'LarchCheckbox';

        self.destroy = fn.destroy;
        self.set_val = fn.set_val;
        self.get_val = fn.get_val;
        self.is_blank = fn.is_blank;

        fn.init();

        return self;
    });

    return LarchCheckbox;

});