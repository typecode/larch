define([
    'jquery',
    'larch/core'
], function(
    $,
    larch) {
    'use strict';

    var buttons = {};

    buttons.markup = {
        ACTION: 'action',
        DISABLED: larch.markup.DISABLED
    };

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

    return buttons;

});