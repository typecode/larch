define([
    'jquery',
    'larch'
], function(
    $,
    larch) {
    'use strict';

    var tags = {};

    tags.modes = {
        DISMISSIBLE: 'dismissible',
        TOGGLABLE:   'toggler'
    };

    tags.markup = {
        TAG:        'tag',
        DISPLAY:    'tag-' + larch.markup.DISPLAY,
        CONTROL:    'tag-' + larch.markup.CONTROL
    };

    tags.create_dom = function(text, mode) {
        var buf;
        if ($.isArray(text)) {
            buf = '';
            $.each(text, function(i, t) {
                buf += tags.create_dom(t, mode);
            });
            return buf;
        }
        return '<span class="' + tags.markup.TAG + ' ' + mode + '" data-value="' + text + '">' +
                   '<span class="' + tags.markup.DISPLAY + '">' + text + '</span>' +
                   '<span class="' + tags.markup.CONTROL + '"></span>' +
               '</span>';
    };

    tags.remove_tag = function($tag, callback) {
        $tag.fadeOut(200, function() {
            $tag.remove();
            if ($.isFunction(callback)) {
                callback();
            }
        });
    };

    return tags;

});