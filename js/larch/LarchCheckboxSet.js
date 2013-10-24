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
     * Field type representing a set of checkboxes
     *
     * DOM
     *
     * <div class='larch-checkbox-set'>
     *     <div class='menu'>
     *         <div class='larch-checkbox larch'>
     *             <div class='control'>
     *                 <div class='checkbox'></div>
     *             </div>
     *             <span class='label'>Label</span>
     *         </div>
     *         <div class='larch-checkbox larch'>
     *             <div class='control'>
     *                 <div class='checkbox'></div>
     *             </div>
     *             <span class='label'>Label</span>
     *         </div>
     *     </div>
     * </div>
     */
    var LarchCheckboxSet = larch.register_type('larch-checkbox-set', function(options) {

        var o, self, base_fn, internal, elements, fn, handlers;

        o = $.extend({
            orientation: larch.orientations.VERTICAL
        }, options);

        o.multi = true;
        o.item_class = larch.markup.CHECKBOX;

        self = new BaseBooleanFieldSet(o);

        base_fn = {
        };

        fn = {
            init: function() {
            },

            set_val: function(val, silent) {
                var vals, $items, $to_select;
                vals = $.isArray(val) ? val : [val];
                $items = self.menu_container.get_items(true);
                $to_select = $();
                $.each(vals, function(i, v) {
                    var $item = $items.filter('[data-value=' + v + ']');
                    if ($item.length == 1) {
                        $to_select = $to_select.add($item);
                    }
                });
                self.menu_container.select($to_select, silent);
            },
            get_val: function() {
                var $selected;
                $selected = self.menu_container.get_selected();
                return $.map($.makeArray($selected), function(item, i) {
                    return larch.get_val_for_element($(item));
                });
            },
            is_blank: function() {
                return (self.get_val().length > 0) ? false : true;
            }
        };

        self.type = 'LarchCheckboxSet';

        self.set_val = fn.set_val;
        self.get_val = fn.get_val;
        self.is_blank = fn.is_blank;

        fn.init();

        return self;
    });

    return LarchCheckboxSet;

});