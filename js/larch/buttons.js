define([
    'jquery',
    'larch'
], function(
    $,
    larch) {
    'use strict';

    var buttons = {};

    /*
     * Holds css class names that are common accross buttons.
     */
    buttons.markup = {
        ACTION: 'action',
        DISABLED: larch.markup.DISABLED
    };

    /*
     * Set enabled state of a button represented by jQuery object $btn.
     */
    buttons.set_enabled = function($btn, is_enabled) {
        var was_enabled;
        was_enabled = !($btn.hasClass(buttons.markup.DISABLED));
        if (was_enabled === is_enabled) {
            return;
        }
        if (is_enabled) {
            $btn.removeClass(buttons.markup.DISABLED);
        } else {
            $btn.addClass(buttons.markup.DISABLED);
        }
    };

    /*
     * Set call to action state of a button represented by jQuery object $btn.
     */
    buttons.set_call_to_action = function($btn, is_ca) {
        var was_ca;
        was_ca = $btn.hasClass(buttons.markup.ACTION);
        if (was_ca === is_ca) {
            return;
        }
        if (is_ca) {
            $btn.addClass(buttons.markup.ACTION);
        } else {
            $btn.removeClass(buttons.markup.ACTION);
        }
    };

    /*
     * Creates an event handler function that only invokes handler if event target
     * is enabled. Optionally invoke when_disabled_handler if the evnet target is
     * disabled.
     *
     * Usage:
     * $btn.on('click', buttons.disabled_handler(function(e, d) {...}));
     */
    buttons.disabled_handler = function(handler, when_disabled_handler) {
        return function(e, d) {
            if ($(this).hasClass(buttons.markup.DISABLED)) {
                if ($.isFunction(when_disabled_handler)) {
                    return when_disabled_handler.apply(this, arguments);
                }
                e.preventDefault();
            } else {
                return handler.apply(this, arguments);
            }
        }
    };

    return buttons;

});