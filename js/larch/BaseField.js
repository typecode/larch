define([
    'jquery',
    'underscore',
    'larch',
    'larch/validation',
    'larch/FieldTooltip'
], function(
    $,
    _,
    larch,
    validation,
    FieldTooltip) {
    'use strict';

    /*
     * Abstract field used as the base class for all Larch field types.
     * This is only used internally to implement concrete field types.
     * Provides a lot of the core field-level management of validation,
     * extensions, tooltips, focus, etc.
     */
    var BaseField = function(options) {

        var o, self, internal, fn, handlers;

        o = $.extend({
            $e: null,
            selector: '',
            auto_validate_events: {
                undetermined: 'change',
                valid:        'change keyup',
                invalid:      'change keyup'
            }
        }, options);

        self = this;

        internal = {
            validators: {},
            errors: [],
            previous_errors: [],
            validation_namespace: _.uniqueId('.larch_validation_'),
            validation_aux_data: null,
            extensions: []
        };

        fn = {
            init: function() {
                var name;

                self.$e.addClass(larch.markup.INSTATIATED);
                self.$e.on('focus', handlers.focus);
                self.$e.on('blur', handlers.blur);
                self.$e.on(larch.event_types.RESET, handlers.reset);

                name = self.$e.attr('data-name');
                self.name = name || '(annonymous)';

                fn.init_tooltip();
                fn.update_validation_action_handlers(fn.get_validation_state());
            },
            destroy: function() {
                self.$e.removeClass(larch.markup.INSTATIATED);
                self.$e.off('focus', handlers.focus);
                self.$e.off('blur', handlers.blur);
                self.$e.off(larch.event_types.RESET, handlers.reset);
                self.$e.off(internal.validation_namespace, handlers.validation_action);
                $.each(internal.validators, function(name, validator) {
                    if ($.isFunction(validator.destroy)) {
                        validator.destroy();
                    }
                });
                self.tooltip.destroy();
                $.each(internal.extensions, function(i, extension) {
                    extension.destroy();
                });
            },
            /*
             * Add and initialize an extension for this field
             * Extensions should be applied in this way because
             * then they will be automatically destroyed when 
             * the field is destroyed.
             */
            augment: function(extension) {
                extension.init(self);
                internal.extensions.push(extension);
                return self;
            },
            set_val: function(val, silent) {
                if (silent !== true) {
                    self.trigger('change');
                }
                return self;
            },
            get_val: function() {
                return null;
            },
            set_enabled: function(enabled) {
                if (enabled) {
                    self.$e.removeClass(larch.markup.DISABLED);
                } else {
                    self.$e.addClass(larch.markup.DISABLED);
                }
                self.trigger(larch.event_types.ENABLED_CHANGE, {
                    enabled: enabled
                });
                return self;
            },
            is_enabled: function() {
                return self.$e.hasClass(larch.markup.DISABLED) ? false : true;
            },
            reset: function(silent) {
                self.set_val('', silent);
                self.set_valid(validation.states.UNDETERMINED, silent);
                self.set_enabled(true);
                self.trigger(larch.event_types.RESET);
                return self;
            },
            focus: function() {
                self.trigger('focus');
                return self;
            },
            has_focus: function() {
                return self.$e.hasClass(larch.markup.FOCUS);
            },
            is_blank: function() {
                return $.trim(self.get_val()) ? false : true;
            },
            requires_formdata: function() {
                return false;
            },

            init_tooltip: function() {
                var $tooltip;
                $tooltip = self.$e.find('> .' + larch.markup.CONTROL + ' > .' + larch.markup.TOOLTIP);
                if (!$tooltip.length) {
                    $tooltip = $();
                }
                self.tooltip = new FieldTooltip({
                    $e: $tooltip
                });
            },

            update_validation_action_handlers: function(state) {
                var event_types;
                self.$e.off(internal.validation_namespace, handlers.validation_action);
                if (o.auto_validate_events && o.auto_validate_events[state]) {
                    event_types = $.map(o.auto_validate_events[state].split(' '), function(event_type, i) {
                        return event_type + internal.validation_namespace;
                    }).join(' ');
                    self.$e.on(event_types, handlers.validation_action);
                }
            },
            add_validator: function(name, validator) {
                if (validator && typeof validator === 'object') {
                    internal.validators[name] = validator;
                } else {
                    validator = validation.get_or_create_fv(name);
                    internal.validators[validator.name] = validator;
                }
                return self;
            },
            remove_validator: function(name) {
                var validator = internal.validators[name];
                if (validator) {
                    delete internal.validators[name];
                    return validator;
                }
            },
            set_validation_aux_data: function(aux_data) {
                internal.validation_aux_data = aux_data;
                return self;
            },
            run_validators: function() {
                var is_valid, errors;
                is_valid = true;
                errors = [];
                $.each(internal.validators, function(name, validator) {
                    if (validator.validate(self, internal.validation_aux_data) === false) {
                        is_valid = false;
                        errors.push(validator.error_message ? validator.error_message : validation.ANONYMOUS_ERROR_MESSAGE);
                    }
                });
                return {
                    is_valid: is_valid,
                    errors: errors
                };
            },
            validate: function(silent) {
                var report;
                // only run the full validation if there are validators
                if ($.isEmptyObject(internal.validators)) {
                    return true;
                }
                report = self.run_validators();
                internal.previous_errors = internal.errors;
                internal.errors = report.errors;
                fn.set_valid((report.is_valid ? validation.states.VALID : validation.states.INVALID), silent);
                return report.is_valid;
            },
            set_valid: function(state, silent) {
                var has_changed, previous_state;
                previous_state = fn.get_validation_state();
                if (state === validation.states.VALID) {
                    internal.errors = [];
                    self.$e.addClass(larch.markup.VALID).removeClass(larch.markup.INVALID);
                } else if (state === validation.states.INVALID) {
                    self.$e.addClass(larch.markup.INVALID).removeClass(larch.markup.VALID);
                } else {
                    internal.errors = [];
                    self.$e.removeClass(larch.markup.VALID + ' ' + larch.markup.INVALID);
                }
                fn.update_validation_action_handlers(state);

                self.tooltip.render_validation_errors(internal.errors);
                if (state == validation.states.INVALID && internal.errors.length) {
                    self.tooltip.show_errors();
                } else {
                    self.tooltip.show_default();
                }

                if (silent !== true) {
                    has_changed = false;
                    if (previous_state === state) {
                        // If the field is in the same state as before, its validation
                        // status may still have changed if it has a different number
                        // of errors than it did previously (for example, if it goes
                        // from having two errors to having just one)
                        if (internal.previous_errors.length !== internal.errors.length) {
                            has_changed = true;
                        }
                    } else {
                        has_changed = true;
                    }
                    if (has_changed) {
                        self.trigger(larch.event_types.VALIDATION_CHANGE, {
                            field: self,
                            state: state,
                            errors: internal.errors
                        });
                    }
                }
                return self;
            },
            apply_errors: function(errors, silent) {
                internal.previous_errors = internal.errors;
                internal.errors = internal.previous_errors.slice(0);
                $.each(errors, function(i, error) {
                    internal.errors.push(error);
                });
                fn.set_valid(validation.states.INVALID, silent);
            },
            /*
             * Checks to see if the field is currently in a valid state or not
             * This does not actually 'validate' the field.
             */
            is_valid: function() {
                return self.$e.hasClass(larch.markup.INVALID) ? false : true;
            },
            get_validation_state: function() {
                if (self.$e.hasClass(larch.markup.VALID)) {
                    return validation.states.VALID;
                } else if (self.$e.hasClass(larch.markup.INVALID)) {
                    return validation.states.INVALID;
                }
                return validation.states.UNDETERMINED;
            },

            _handle_focus: function(e, d) {
                self.$e.addClass(larch.markup.FOCUS);
            },
            _handle_blur: function(e, d) {
                self.$e.removeClass(larch.markup.FOCUS);
            }
        };

        handlers = {
            focus: function(e, d) {
                self._handle_focus(e, d);
            },
            blur: function(e, d) {
                self._handle_blur(e, d);
            },
            reset: function(e, d) {
                // reset events shouldn't bubble
                e.stopPropagation();
            },
            validation_action: function(e, d) {
                self.validate();
            }
        };

        self.$e = (o.$e ? o.$e : $(o.selector));
        self.destroy = fn.destroy;
        self.augment = fn.augment;
        self.set_val = fn.set_val;
        self.get_val = fn.get_val;
        self.set_enabled = fn.set_enabled;
        self.is_enabled = fn.is_enabled;
        self.reset = fn.reset;
        self.focus = fn.focus;
        self.has_focus = fn.has_focus;
        self.is_blank = fn.is_blank;
        self.requires_formdata = fn.requires_formdata;

        self.add_validator = fn.add_validator;
        self.remove_validator = fn.remove_validator;
        self.set_validation_aux_data = fn.set_validation_aux_data;

        self.run_validators = fn.run_validators;
        self.validate = fn.validate;
        self.set_valid = fn.set_valid;
        self.apply_errors = fn.apply_errors;
        self.is_valid = fn.is_valid;

        self._handle_focus = fn._handle_focus;
        self._handle_blur = fn._handle_blur;

        self.on = $.proxy(self.$e.on, self.$e);
        self.off = $.proxy(self.$e.off, self.$e);
        self.trigger = $.proxy(self.$e.trigger, self.$e);

        fn.init();

        return self;
    };

    return BaseField;
});