define([
    'jquery',
    'larch',
    'larch/BaseField'
], function(
    $,
    larch,
    BaseField) {
    'use strict';

    var LarchFile = larch.register_type('larch-file', function(options) {

        var o, self, base_fn, internal, elements, fn, handlers;

        o = $.extend({
        }, options);

        self = new BaseField(o);

        base_fn = {
            destroy: $.proxy(self.destroy, self),
            set_val: $.proxy(self.set_val, self),
            set_enabled: $.proxy(self.set_enabled, self)
        };

        internal = {
            send_clear: false
        };

        elements = {
            input: self.$e.children('.' + larch.markup.CONTROL).children('input[type=file]'),
            clear: self.$e.find('.clear-control')
        };

        fn = {
            init: function() {
                self.$e.on('change', handlers.change);
                elements.clear.on('click', handlers.clear_click);
            },
            destroy: function() {
                self.$e.off('change', handlers.change);
                elements.clear.off('click', handlers.clear_click);
                base_fn.destroy();
            },

            clear: function() {
                elements.input.wrap('<form>').closest('form')[0].reset();
                elements.input.unwrap();
                internal.send_clear = true;
                return self;
            },

            set_val: function(val, silent) {
                if (val == '') {
                    fn.clear();
                }
                return base_fn.set_val(val, silent);
            },
            get_val: function() {
                var file_list = elements.input[0].files;
                if (file_list.length) {
                    return file_list[0];
                }
                return internal.send_clear ? LarchFile.clear_val : null;
            },
            is_blank: function() {
                return elements.input[0].files.length ? false : true;
            },

            set_enabled: function(enabled) {
                if (enabled) {
                    elements.input.removeAttr('disabled');
                } else {
                    elements.input.attr('disabled', true);
                }
                return base_fn.set_enabled(enabled);
            },

            requires_formdata: function() {
                return true;
            }
        };

        handlers = {
            change: function(e, d) {
                if (e.target.files && e.target.files.length) {
                    internal.send_clear = false;
                }
            },
            clear_click: function(e) {
                e.preventDefault();
                if (!self.is_blank()) {
                    self.reset('');
                }
            }
        };

        self.type = 'LarchFile';

        self.destroy = fn.destroy;
        self.set_val = fn.set_val;
        self.get_val = fn.get_val;
        self.is_blank = fn.is_blank;
        self.set_enabled = fn.set_enabled;
        self.requires_formdata = fn.requires_formdata;

        fn.init();

        return self;
    });

    LarchFile.clear_val = '(clear)';

    return LarchFile;
});
