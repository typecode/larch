define([
    // field types
    'larch/LarchInput',
    'larch/LarchTagInput',
    'larch/LarchRadioSet',
    'larch/LarchCheckboxSet',
    'larch/LarchCheckbox',
    'larch/LarchSelect',
    'larch/LarchHidden',

    // extensions
    'larch/Autocomplete'
], function(
    LarchInput,
    LarchTagInput,
    LarchRadioSet,
    LarchCheckboxSet,
    LarchCheckbox,
    LarchSelect,
    LarchHidden,
    Autocomplete) {
    'use strict';

    /*
     * Requiring this module effectively loads the all the core
     * Larch field types and extensions, which is useful when
     * using larch.new_instance (from larch/core) to instantiate a group
     * of fields (since larch.new_instance will only detect the right
     * type of field if that field's module has already been required).
     */

     var library = {
        types: {},
        extensions: []
     };

     $.each(arguments, function(i, object) {
        if (!object) {
            return true;
        } else if (object.type) {
            library.types[object.type] = object;
        } else {
            library.extensions.push(object);
        }
     });

     return library;

});