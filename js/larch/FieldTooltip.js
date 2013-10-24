define([
    'jquery',
    'larch',
    'larch/validation'
], function(
    $,
    larch,
    validation) {
    'use strict';

    /*
     * Very basic tooltip that can be attached to the '.control' area
     * of a Larch field, and used to display help text and/or field
     * validation errors.
     *
     * DOM
     *
     * <span class='tooltip'>
     *     <span class='default-tip'>default tip text</span>
     *     <span class='errors'>
     *         <span>A validation error</span>
     *         <span>Another validation error</span>
     *     </span>
     * </span>
     */
    var FieldTooltip = function(options) {

        var o, self, internal, elements, fn, handlers;

        o = $.extend({
            $e: null,
            selector: ''
        }, options);

        self = this;

        internal = {
            name: 'mod.FieldTooltip',
            $e: (o.$e ? o.$e : $(o.selector))
        };

        elements = {
            default_tip: internal.$e.children('.' + FieldTooltip.markup.DEFAULT_TIP),
            errors: internal.$e.children('.' + FieldTooltip.markup.ERRORS)
        };

        fn = {
            init: function() {
            },
            destroy: function() {
                self.hide();
                elements.errors.empty();
            },

            set_default_text: function(text) {
                elements.default_tip.html(text);
                return self;
            },
            set_error_text: function(text) {
                elements.errors.html(text);
                return self;
            },
            render_validation_errors: function(errors) {
                var text;
                text = '';
                $.each(errors, function(i, error_message) {
                    if (error_message == validation.ANONYMOUS_ERROR_MESSAGE) {
                        return true;
                    }
                    text += '<span>' + error_message + '</span>';
                });
                return self.set_error_text(text);
            },

            show_default: function(text) {
                if (typeof text == 'string') {
                    self.set_default_text(text);
                }
                if ($.trim(elements.default_tip.text())) {
                    internal.$e.addClass(FieldTooltip.markup.SHOW_DEFAULT).removeClass(FieldTooltip.markup.SHOW_ERRORS);
                } else {
                    self.hide();
                }
                return self;
            },
            show_errors: function(text) {
                if (typeof text == 'string') {
                    self.set_error_text(text);
                }
                if ($.trim(elements.errors.text())) {
                    internal.$e.addClass(FieldTooltip.markup.SHOW_ERRORS).removeClass(FieldTooltip.markup.SHOW_DEFAULT);
                } else {
                    self.hide();
                }
                return self;
            },
            hide: function() {
                internal.$e.removeClass(FieldTooltip.markup.SHOW_DEFAULT + ' ' + FieldTooltip.markup.SHOW_ERRORS);
                return self;
            }
        };

        self.destroy = fn.destroy;
        self.set_default_text = fn.set_default_text;
        self.set_error_text = fn.set_error_text;
        self.render_validation_errors = fn.render_validation_errors;
        self.show_default = fn.show_default;
        self.show_errors = fn.show_errors;
        self.hide = fn.hide;

        fn.init();

    };

    FieldTooltip.markup = {
        DEFAULT_TIP:  'default-tip',
        ERRORS:       'errors',

        SHOW_DEFAULT: 'state-show-default',
        SHOW_ERRORS:  'state-show-errors'
    };

    return FieldTooltip;

});