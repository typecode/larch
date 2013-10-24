define([
    'jquery',
    'larch',
    'larch/BaseBooleanFieldSet'
], function(
    $,
    larch,
    BaseBooleanFieldSet) {
    'use strict';

    /*
     * Field type representing a set of radios.
     *
     * DOM
     *
     * <div class='larch-radio-set'>
     *    <div class='menu'>
     *         <div class='larch-radio larch'>
     *             <div class='control'>
     *                 <div class='radio'></div>
     *             </div>
     *             <span class='label'>Label</span>
     *         </div>
     *         <div class='larch-radio larch'>
     *             <div class='control'>
     *                 <div class='radio'></div>
     *             </div>
     *             <span class='label'>Label</span>
     *         </div>
     *    </div>
     * </div>
     */
    var LarchRadioSet = larch.register_type('larch-radio-set', function(options) {

        var o, self, base_fn, internal, elements, fn, handlers;

        o = $.extend({
            orientation: larch.orientations.VERTICAL
        }, options);

        o.item_class = larch.markup.RADIO;

        self = new BaseBooleanFieldSet(o);

        base_fn = {
        };

        fn = {
            init: function() {
            },

            set_val: function(val, silent) {
                var $items;
                if (!val) {
                    self.menu_container.clear_selection(silent);
                    return self;
                }
                $items = self.menu_container.get_items(true);
                $items.each(function() {
                    var $item;
                    $item = $(this);
                    if ($item.data('value') == val) {
                        self.menu_container.select($item, silent);
                        return false;
                    }
                });
                return self;
            },
            get_val: function() {
                var $selected;
                $selected = self.menu_container.get_selected();
                if ($selected.length == 1) {
                    return $selected.data('value');
                }
                return '';
            }
        };

        self.type = 'LarchRadioSet';

        self.set_val = fn.set_val;
        self.get_val = fn.get_val;

        fn.init();

        return self;
    });

    return LarchRadioSet;

});