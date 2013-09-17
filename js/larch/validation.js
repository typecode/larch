define(['jquery', 'larch'], function($, larch) {
    'use strict';

    var validation = {};

    validation.ANONYMOUS_ERROR_MESSAGE = '(annonymous error)';

    validation.states = {
        UNDETERMINED: 'undetermined',
        VALID:        'valid',
        INVALID:      'invalid'
    };

    /*
     * A field validator is any object with an 'validate' function
     * and an optional 'name' and 'error_message' string. When a field
     * is being validated, the 'validate' function of all validators
     * associated with it is called, and passed as the first argument
     * the field instance. If the validator determines that the field
     * is not in a valid state, 'validate()' should return false.
     * If the validator does supply 'error_message', then that will be
     * used to explain why the field failed its 'validate' test.
     *
     * DummyFieldValidator is a constructor for a field validator whose
     * 'validate' function always returns true. It's provided just as a
     * reference for what a field validator might look like, and for
     * testing purposes.
     */
    validation.DummyFieldValidator = function() {
        this.name = 'dummy';
        this.validate = function(field) {
            return true;
        };
        this.error_message = 'Invalid';
    };

    /*
     * Cache of field validator objects, mapping unique names to validators.
     * This is used to store existing validators so they can be retrieved
     * and shared across fields.
     */
    validation.field_validators = {};

    /*
     * Regular expressions used by some of the builtin field validators
     * to test values.
     */
    validation.patterns = {
        EMAIL:          /^[a-zA-Z0-9\+._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
        URL:            /^((ht|f)tps?:\/\/)?[a-zA-Z0-9-\.]+\.[a-zA-Z]{2,4}\/?([^\s<>\%"\,\{\}\\|\\\^\[\]`]+)?$/,
        NO_SPACES:      /^[\S]*$/,
        ALPHA_NUMERIC:  /^\s*[a-z\d\.]+([a-z\d\.]*\.|\s*\-\s*[a-z\d\.]+)?(\s+[a-z\d\.]+(\.|\s*\-\s*[a-z\d\.]+)?)*\s*$/i
    };

    /*
     * The factory contains functions and error message templates used to create
     * builtin validator objects. The reason for doing it this way is that
     * some validator's 'validate' functions need to depend on parameters. For
     * example, a min_length validator's 'validate' function depends on what
     * the actual minimum length is. Creating a min_length validator through
     * the factory allows you to get a 'validate' function for a specific
     * length.
     * These factory objects are used to create validators from strings,
     * via validation.get_or_create_fv()
     */
    validation.fv_factory = {
        pattern: {
            create: function(pattern, modifiers) {
                var re = new RegExp(pattern, modifiers);
                return function(field, aux_data) {
                    var val = field.get_val();
                    if (val) {
                        return re.test(val);
                    }
                };
            }
        },
        required: {
            create: function() {
                return function(field, aux_data) {
                    return !(field.is_blank());
                };
            },
            msg_tmpl: 'This is a required field'
        },
        no_spaces: {
            create: function() {
                return function(field, aux_data) {
                    var val = field.get_val();
                    return val ? validation.patterns.NO_SPACES.test(val) : true;
                };
            },
            msg_tmpl: 'This must not have any spaces'
        },
        alphanumeric: {
            create: function() {
                return function(field, aux_data) {
                    var val = field.get_val();
                    return !(val && !validation.patterns.ALPHA_NUMERIC.test(val));
                };
            },
            msg_tmpl: 'This must consist of only numbers and letters'
        },
        email: {
            create: function() {
                return function(field, aux_data) {
                    var val = field.get_val();
                    return !(val && !validation.patterns.EMAIL.test(val));
                };
            },
            msg_tmpl: 'This must be an Email address'
        },
        url: {
            create: function() {
                return function(field, aux_data) {
                    var val = field.get_val();
                    return !(val && !validation.patterns.URL.test(val));
                };
            },
            msg_tmpl: 'This must be a URL'
        },
        date: {
            create: function() {
                return function(field, aux_data) {
                    var val = field.get_val();
                    return !(val && /Invalid|NaN/.test(new Date(val).toString()));
                };
            },
            msg_tmpl: 'This must be a date'
        },
        min_length: {
            create: function(min) {
                min = min * 1;
                return function(field, aux_data) {
                    var val = field.get_val();
                    return !(val && val.length < min);
                };
            },
            msg_tmpl: 'This must be at least % characters'
        },
        max_length: {
            create: function(max) {
                max = max * 1;
                return function(field, aux_data) {
                    var val = field.get_val();
                    return !(val && val.length > max);
                };
            },
            msg_tmpl: 'This cannot exceed % characters'
        },
        number: {
            create: function() {
                return function(field, aux_data) {
                    var val = field.get_val() * 1;
                    return !(isNaN(val));
                };
            },
            msg_tmpl: 'This must be a number'
        },
        number_range: {
            create: function(low, high) {
                low = low * 1;
                high = high * 1;
                return function(field, aux_data) {
                    var val = field.get_val() * 1;
                    return (!isNaN(val) && val >= low && val <= high);
                };
            },
            msg_tmpl: 'This must be within the range of % to %'
        },
        matches_field: {
            create: function(name) {
                return function(field, aux_data) {
                    var val;
                    if (aux_data && aux_data.fields[name]) {
                        val = field.get_val();
                        if (val && val != aux_data.fields[name].get_val()) {
                            return false;
                        }
                    }
                };
            },
            msg_tmpl: 'This does not match %'
        }
    };

    validation.register_fv_factory = function(name, factory_object) {
        validation.fv_factory[name] = factory_object;
    };

    /*
     * Produces a field validator object based off of a single string argument.
     * If an entry for the string already exists in the field validators cache,
     * that validator is returned. Otherwise, a new validator is created and
     * added to the cache.
     *
     * The string arg used to create a validator has up to 3 parts: a name, 
     * optional (comma-seperated) args for the factory object that creates 
     * the validator, and an optional error message template.
     *
     * validation.get_or_create_fv('required')
     * validation.get_or_create_fv('required==This is a required field')
     * validation.get_or_create_fv('min_length=5')
     * validation.get_or_create_fv('number_range=2,4=must be between % and %')
     */
    validation.get_or_create_fv = function(str) {
        var parts, name, args, msg_tmpl, validator;

        if (validation.field_validators[str]) {
            return validation.field_validators[str];
        }

        // TODO: splitting on "=" and "," to determine validator name and args
        // is problematic when used with the pattern validator, if the regex
        // needs to contain "=" or "," characters

        parts = str.split('=');
        name = parts[0];
        args = parts[1] ? parts[1].split(',') : [];
        msg_tmpl = parts[2] ? parts[2] : validation.fv_factory[name].msg_tmpl;

        validator = {
            name: name,
            validate: validation.fv_factory[name].create.apply(validation.fv_factory, args)
        };

        if (msg_tmpl) {
            validator.error_message = larch.interpolate_str(msg_tmpl, args);
        }

        validation.field_validators[str] = validator;
        return validator;
    };

    /*
     *
     */
    validation.deserialize_field_validators = function(str) {
        var validators = [];
        if (typeof str === 'string') {
            $.each(str.split('|'), function(i, s) {
                var validator = validation.get_or_create_fv(s);
                if (validator) {
                    validators.push(validator);
                }
            });
        }
        return validators;
    };

    return validation;

});