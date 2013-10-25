define([
    'jquery',
    'larch'
], function(
    $,
    larch) {
    'use strict';

    var tags = {};

    /*
     * Holds possible tag modes.
     */
    tags.modes = {
        DISMISSIBLE: 'dismissible',
        TOGGLABLE:   'toggler'
    };

    /*
     * Holds css class names that are common accross tags.
     */
    tags.markup = {
        TAG:        'tag',
        DISPLAY:    'tag-' + larch.markup.DISPLAY,
        CONTROL:    'tag-' + larch.markup.CONTROL
    };

    /*
     * Generate a string of HTML representing a tag element.
     */
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

    /*
     * Remove a tag, represented by jQuery object $tag, from the DOM
     * and destroy it. callback is triggered once the tag has been removed.
     */
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