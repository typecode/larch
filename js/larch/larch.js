define(['jquery'], function($) {
    'use strict';

    var larch = {};

    var field_constructors = {};

    /*
     * Register a Larch field constructor that should correspond to a given
     * CSS class name. If an entry for the class name already exists, it will
     * be overwritten.
     */
    larch.register_type = function(css_class, constructor) {
        field_constructors[css_class] = constructor;
        constructor.CSS_CLASS = css_class;
        return constructor;
    };

    /*
     * Given a jQuery element $e that represents a single field, returns
     * user defined options that should be merged with the options passed
     * to the constructor when instantiating the field. These options are
     * obtained by parsing the data-options attribute of the element as
     * JSON. If no options exist, an empty object is returned.
     * This is intended as a convenience for defining simple options directly
     * in the template markup. Because these options are parsed as JSON,
     * they cannot include functions, etc, so this approach is limited.
     */
    larch.get_options_for_element = function($e) {
        return $e.data('options') || {};
    };

    /*
     * Given a jQuery element $e that represents a single field, returns
     * the constructor needed to instantiate a corresponding Larch field.
     * Returns undefined if a suitable constructor is not found.
     * If the element has multiple CSS classes that correspond to Larch
     * field constructors, than the first constructor found will be returned.
     */
    larch.get_constructor_for_element = function($e) {
        var css_classes, i, constructor;
        css_classes = $e.attr('class').split(/\s+/);
        for (i = 0; i < css_classes.length; i += 1) {
            constructor = field_constructors[css_classes[i]];
            if (constructor) {
                return constructor;
            }
        }
    };

    /*
     * Instantiate a new Larch field. The constructor that's used is determined
     * by inspecting the CSS class names on the jQuery object options.$e or 
     * $(options.selector).
     * options are merged into the result of calling larch.get_options_for_element 
     * on the options.$e or $(options.selector) element, and passed through
     * to the constructor.
     */
    larch.new_instance = function(options) {
        var $e, o, constructor;
        $e = (options.$e ? options.$e : $(options.selector));
        options.$e = $e;
        o = $.extend(larch.get_options_for_element($e), options);
        constructor = larch.get_constructor_for_element($e);
        return constructor ? new constructor(o) : null;
    };

    /*
     * Given a jQuery element $e that represents a single field or a component
     * within a field (like a menu item, label, etc), return a string to use
     * as that element's display text. This will be the element's 'display' data
     * if present, otherwise the result of calling .text() on $e.
     */
    larch.get_display_for_element = function($e) {
        var text;
        text = $e.data('display');
        if (!text) {
            text = $e.text();
        }
        return text;
    };

    /*
     * Return a value that is ssociated with a component represented by
     * jQuery object $e. This is a convenience for retrieving values
     * associated with Larch select options, autocomplete items, etc.
     */
    larch.get_val_for_element = function($e) {
        return $e.data('value');
    };

    /*
     * Holds css class names that are common accross Larch components.
     */
    larch.markup = {
        // components
        LARCH:        'larch',
        CHECKBOX:     'larch-checkbox',
        RADIO:        'larch-radio',
        CONTROL:      'control',
        DISPLAY:      'display',
        BLANK_UI:     'blank-ui',
        PLACEHOLDER:  'placeholder',
        LABEL:        'label',
        MENU:         'menu',
        ITEM:         'item',
        STICKY:       'sticky',
        TOOLTIP:      'tooltip',
        ICON:         'icon',
        AUTOCOMPLETE: 'autocomplete',
        FORM_SUBMIT:  'larch-form-submit',

        // states
        INSTATIATED:  'state-instatiated',
        FOCUS:        'state-focus',
        CURRENT:      'state-current',
        HIGHLIGHT:    'state-highlight',
        OPEN:         'state-open',
        DISABLED:     'state-disabled',
        BLANK:        'state-blank',
        VALID:        'state-valid',
        INVALID:      'state-invalid',
        LOADING:      'state-loading'
    };

    /*
     * Holds event type names that are common across Larch components.
     */
    larch.event_types = {
        OPEN:               'larch-event-open',
        CLOSE:              'larch-event-close',
        VALIDATION_CHANGE:  'larch-event-validation-change',
        ENABLED_CHANGE:     'larch-event-enabled-change',
        RESET:              'larch-event-reset'
    };

    /*
     * Holds key codes of non-alphanumeric keys.
     */
    larch.key_codes = {
        BACKSPACE: 8,
        CAPS_LOCK: 20,
        COMMA: 188,
        CONTROL: 17,
        DELETE: 46,
        DOWN: 40,
        END: 35,
        ENTER: 13,
        ESCAPE: 27,
        HOME: 36,
        INSERT: 45,
        LEFT: 37,
        NUMPAD_ADD: 107,
        NUMPAD_DECIMAL: 110,
        NUMPAD_DIVIDE: 111,
        NUMPAD_ENTER: 108,
        NUMPAD_MULTIPLY: 106,
        NUMPAD_SUBTRACT: 109,
        PAGE_DOWN: 34,
        PAGE_UP: 33,
        PERIOD: 190,
        RIGHT: 39,
        SHIFT: 16,
        SPACE: 32,
        TAB: 9,
        UP: 38
    };

    /*
     * Holds possible Larch field orientations.
     */
    larch.orientations = {
        VERTICAL:   'vertical',
        HORIZONTAL: 'horizontal'
    };

    var ENSURED_TABINDEX_ATTR = 'data-ensured-tabindex';

    /*
     * Adds a tabindex attribute to the element represented by $e
     * in case it does not already have one. This can be used to
     * make an element focussable.
     */
    larch.ensure_tabindex = function($e) {
        if (typeof $e.attr('tabindex') === 'undefined') {
            $e.attr('tabindex', 0);
            $e.attr(ENSURED_TABINDEX_ATTR, true);
        }
    };

    /*
     * Removes a tabindex property from the element represented by $e
     * if and only if it was added by larch.ensure_tabindex
     */
    larch.remove_ensured_tabindex = function($e) {
        if ($e.attr(ENSURED_TABINDEX_ATTR)) {
            $e.removeAttr('tabindex');
            $e.removeAttr(ENSURED_TABINDEX_ATTR);
        }
    };

    /*
     * Provides very basic interpolation on a string str,
     * replacing % characters with values (in order) from
     * the array args.
     */
    larch.interpolate_str = function(str, args) {
        var i;
        if (args && args.length) {
            for (i = 0; i < args.length; i += 1) {
                str = str.replace('%', args[i]);
            }
        }
        return str;
    };

    return larch;

});