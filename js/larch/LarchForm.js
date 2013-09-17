define([
    'jquery',
    'larch',
    'larch/library',
    'larch/validation',
    'larch/buttons',
    'larch/FieldTooltip'
], function(
    $,
    larch,
    _library,
    validation,
    buttons,
    FieldTooltip) {
    'use strict';

    /*
     * DOM
     *
     * <form action='form/submit/url'>
     *     <div class='larch' data-name='field_name'>...</div>
     *     <div class='larch' data-name='field_name'>...</div>
     *     ...
     *     <a href='#' class='larch-form-submit'>...</a>
     *     <span class='tooltip'>...</span>
     * </form>
     */
    var LarchForm = function(options) {

        var o, self, internal, elements, fn, handlers;

        o = $.extend({
            app: null,
            $e: null,
            selector: '',
            warn_missing_csrf_token: true,
            enter_key_submit: false,
            validators: {
                '__all__': {}
            },
            post_url: null,
            handle_fields: function(fields) {},
            broker_post_data: null, // function(data, fields) {} or [function, function, ...]
            on_success: function(d) {},
            on_error: function(xhr, ts, err) {},
            on_complete: function() {}
        }, options);

        self = this;

        internal = {
            name: 'mod.LarchForm',
            $e: (o.$e ? o.$e : $(o.selector)),
            fields: {},
            data_brokers: [],
            xhrobject: null,
            response_data: null,
            group_validators: o.validators['__all__'] ? o.validators['__all__'] : {},
            group_errors: [],
            tooltip: null
        };

        elements = {
            submit_btn: internal.$e.find('.' + larch.markup.FORM_SUBMIT)
        };

        fn = {
            init: function() {
                var fv_aux_data;

                if ($.isFunction(o.broker_post_data)) {
                    internal.data_brokers = [o.broker_post_data];
                } else if ($.isArray(o.broker_post_data)) {
                    internal.data_brokers = o.broker_post_data.slice(0);
                }

                fn.init_tooltip();

                // Discover fields
                self.$e.find('.' + larch.markup.LARCH + '[data-name]').each(function() {
                    var $field;
                    $field = $(this);
                    internal.fields[$field.attr('data-name')] = larch.new_instance({
                        $e: $field
                    });
                });

                // Add field validators to the fields
                $.each(o.validators, function(field_name, field_validators) {
                    var field;
                    if (field_name == '__all__') {
                        return true;
                    }
                    field = internal.fields[field_name];
                    if (!field) {
                        return true;
                    }
                    $.each(field_validators, function(i, validator) {
                        if (typeof validator === 'string') {
                            field.add_validator(validator);
                        } else {
                            field.add_validator(validator.name, validator);
                        }
                    });
                });

                fv_aux_data = {
                    fields: internal.fields
                };
                $.each(internal.fields, function(name, field) {
                    var validators_str, extensions_str;

                    field.set_validation_aux_data(fv_aux_data);

                    // Instatiate field validators from [data-validation]
                    validators_str = field.$e.data('validation');
                    if (validators_str) {
                        $.each(validation.deserialize_field_validators(validators_str), function(i, validator) {
                            field.add_validator(validator.name, validator);
                        });
                    }

                    // Inastatiate extensions from [data-extensions]
                    extensions_str = field.$e.data('extensions');
                    if (extensions_str) {
                        $.each(extensions_str.split('|'), function(i, s) {
                            var parts, module_id, ext_options;
                            parts = s.split('=');
                            module_id = parts[0];
                            if (parts[1]) {
                                ext_options = $.parseJSON(parts[1]);
                            } else {
                                ext_options = {};
                            }
                            require([module_id], function(Ext) {
                                field.augment(new Ext(ext_options));
                            });
                        });
                    }
                });

                self.handle_fields();
                self.validate(true);

                self.$e.on('submit', handlers.native_form_submit);
                self.$e.on(larch.event_types.VALIDATION_CHANGE, handlers.field_validation_change);
                self.$e.on('change', handlers.change);
                self.$e.on('keyup', handlers.keyup);
            },
            destroy: function() {
                $.each(internal.fields, function(name, field) {
                    field.destroy();
                });
                $.each(internal.group_validators, function(name, validator) {
                    if ($.isFunction(validator.destroy)) {
                        validator.destroy();
                    }
                });

                internal.tooltip.destroy();

                self.$e.on('submit', handlers.native_form_submit);
                self.$e.off(larch.event_types.VALIDATION_CHANGE, handlers.field_validation_change);
                self.$e.off('change', handlers.change);
                self.$e.off('keyup', handlers.keyup);
            },

            init_tooltip: function() {
                var $tooltip;
                $tooltip = elements.submit_btn.parent().find('.' + larch.markup.TOOLTIP);
                if (!$tooltip.length) {
                    $tooltip = $();
                }
                internal.tooltip = new FieldTooltip({
                    $e: $tooltip
                });
            },

            reset: function(silent) {
                if (internal.xhrobject) {
                    internal.xhrobject.abort();
                    internal.xhrobject = null;
                }
                internal.group_errors = [];
                internal.response_data = null;
                $.each(internal.fields, function(name, field) {
                    field.reset(silent);
                });
                self.handle_fields();
                self.validate(silent);
                self.$e.trigger(larch.event_types.RESET);
                return self;
            },

            validate: function(quiet) {
                var is_valid, errors;
                is_valid = true;
                errors = [];

                $.each(internal.fields, function(name, field) {
                    if (quiet) {
                        if (field.run_validators().is_valid === false) {
                            is_valid = false;
                        }
                    } else {
                        if (field.validate(true) === false) {
                            is_valid = false;
                        }
                    }
                });

                $.each(internal.group_validators, function(name, validator) {
                    if (validator.validate(internal.fields) === false) {
                        is_valid = false;
                        errors.push(validator.error_message ? validator.error_message : validation.ANONYMOUS_ERROR_MESSAGE);
                    }
                });

                internal.group_errors = errors;
                fn.set_valid(is_valid ? validation.states.VALID : validation.states.INVALID);
                return is_valid;
            },
            set_valid: function(state) {
                if (state === validation.states.VALID) {
                    self.$e.addClass(larch.markup.VALID).removeClass(larch.markup.INVALID);
                    buttons.set_enabled(elements.submit_btn, true);
                } else if (state === validation.states.INVALID) {
                    self.$e.addClass(larch.markup.INVALID).removeClass(larch.markup.VALID);
                    buttons.set_enabled(elements.submit_btn, false);
                } else {
                    self.$e.removeClass(larch.markup.VALID + ' ' + larch.markup.INVALID);
                    buttons.set_enabled(elements.submit_btn, true);
                }

                fn.update_submit_btn_action_state();

                internal.tooltip.render_validation_errors(internal.group_errors);
                if (internal.group_errors.length) {
                    internal.tooltip.show_errors();
                } else {
                    internal.tooltip.show_default();
                }
            },
            apply_errors: function(errors) {
                var t;
                // TODO -- this approach is questionable.
                // it's being assumed that the server will return an errors object
                // with keys corresponding either to field names for field-specific
                // error messages, or '__all__' for errors that are not field-specific.
                // Right now, this is actually not always the case, sometimes
                // the server returns an errors object that does not follow that format,
                // such as jsut a string representing an exception message.
                t = typeof errors;
                if (t == 'object') {

                    if (errors['__all__']) {
                        $.each(errors['__all__'], function(i, error) {
                            internal.group_errors.push(error);
                        });
                    }

                    $.each(errors, function(field_name, errs) {
                        var field;
                        if (field_name == '__all__') {
                            return true;
                        }
                        field = internal.fields[field_name];
                        if (field) {
                            field.apply_errors(errs, true);
                        }
                    });
                } else if (t == 'string') {
                    internal.group_errors.push(errors);
                }

                fn.set_valid(validation.states.INVALID);
            },
            is_valid: function() {
                return self.$e.hasClass(larch.markup.INVALID) ? false : true;
            },
            focus_first_field: function() {
                var $f, field;
                $f = self.$e.find('.' + larch.markup.LARCH + '.' + larch.markup.INSTATIATED + '[data-name]').first();
                if ($f.length == 1) {
                    field = internal.fields[$f.attr('data-name')];
                    if (field) {
                        field.focus();
                    }
                }
                return self;
            },
            focus_first_invalid_field: function() {
                var invalid_fields = [];
                $.each(internal.fields, function(name, field) {
                    if (!field.is_valid()) {
                        invalid_fields.push(field);
                    }
                });
                if (invalid_fields.length) {
                    invalid_fields[0].focus();
                }
                return self;
            },

            update_submit_btn_action_state: function() {
                var is_ca = true;
                is_ca = self.is_valid();
                buttons.set_call_to_action(elements.submit_btn, is_ca);
            },
            set_submit_btn_text: function(text) {
                var $icon;
                if (elements.submit_btn.length !== 1) {
                    return;
                }
                $icon = elements.submit_btn.find('.' + larch.markup.ICON);
                if ($icon.length == 1) {
                    $icon = $icon.detach();
                    elements.submit_btn.text(' ' + text);
                    elements.submit_btn.prepend($icon);
                } else {
                    elements.submit_btn.text(text);
                }
                return self;
            },

            get_field: function(name) {
                return internal.fields[name];
            },
            get_fields: function() {
                return internal.fields;
            },
            handle_fields: function() {
                o.handle_fields.apply(self, [internal.fields]);
                return self;
            },

            get_data_brokers: function() {
                return internal.data_brokers;
            },
            get_post_data: function() {
                var data;
                data = {};
                $.each(internal.fields, function(name, field) {
                    data[name] = field.get_val();
                });
                if (internal.data_brokers.length > 0) {
                    $.each(internal.data_brokers, function(i, broker) {
                        data = broker.apply(self, [data, internal.fields]);
                    });
                }
                if (o.warn_missing_csrf_token && !data[LarchForm.CSRF_TOKEN_NAME]) {
                    console.warn('LarchForm: missing csrf token. Form URL: ' + self.get_post_url());
                }
                return data;
            },
            get_post_url: function () {
                if (typeof o.post_url === 'string') {
                    return o.post_url;
                }
                return self.$e.attr('action');
            },
            post: function() {
                var post_data;

                if (internal.xhrobject) {
                    internal.xhrobject.abort();
                    internal.xhrobject = null;
                }

                internal.response_data = null;
                post_data = self.get_post_data();
                console.log('LarchForm: saving form');
                console.log(post_data);

                internal.xhrobject = $.ajax({
                    type: 'POST',
                    url: self.get_post_url(),
                    data: post_data,
                    dataType: 'json',
                    success: function(d, ts, xhr) {
                        internal.response_data = d;

                        console.log('LarchForm: received response data');
                        console.log(d);

                        $.each(internal.fields, function(name, field) {
                            field.set_valid(validation.states.UNDETERMINED, true);
                        });

                        if (d.errors) {
                            self.apply_errors(d.errors);
                        }

                        o.on_success.apply(self, arguments);
                    },
                    error: function(xhr, ts, err) {
                        o.on_error.apply(self, arguments);
                    },
                    complete: function(xhr, ts) {
                        internal.xhrobject = null;
                        o.on_complete.apply(self, arguments);
                    }
                });

                return self;
            },
            get_response_data: function() {
                return internal.response_data;
            }
        };

        handlers = {
            native_form_submit: function(e, d) {
                e.preventDefault();
            },
            field_validation_change: function(e, d) {
                if (d && d.field) {
                    self.validate(true);
                }
            },
            change: function(e, d) {
                self.handle_fields();
            },
            keyup: function(e, d) {
                self.validate(true);
                if ((o.enter_key_submit || e.ctrlKey) && e.which == larch.key_codes.ENTER) {
                    elements.submit_btn.trigger('click');
                }
            }
        };

        self.$e = internal.$e;
        self.destroy = fn.destroy;
        self.reset = fn.reset;
        self.validate = fn.validate;
        self.apply_errors = fn.apply_errors;
        self.is_valid = fn.is_valid;
        self.focus_first_field = fn.focus_first_field;
        self.focus_first_invalid_field = fn.focus_first_invalid_field;
        self.set_submit_btn_text = fn.set_submit_btn_text;

        self.get_field = fn.get_field;
        self.get_fields = fn.get_fields;
        self.handle_fields = fn.handle_fields;
        self.get_data_brokers = fn.get_data_brokers;
        self.get_post_data = fn.get_post_data;
        self.get_post_url = fn.get_post_url;
        self.post = fn.post;
        self.get_response_data = fn.get_response_data;

        fn.init();
        console.log(internal);

        return self;
    };

    /*
     * Name of the data value used to represent a CSRF token
     * in a form POST
     */
    LarchForm.CSRF_TOKEN_NAME = 'csrfmiddlewaretoken';

    /*
     * Creates a data broker function that remaps form data into an
     * object with a "json" property containig the stringified json
     * representation of the data. The CSRF token is excluded.
     */
    LarchForm.json_data_broker = function() {
        return function(data, fields) {
            var data_for_json = {};
            $.each(data, function(name, value) {
                if (name != LarchForm.CSRF_TOKEN_NAME) {
                    data_for_json[name] = value;
                    delete data[name];
                }
            });
            data.json = JSON.stringify(data_for_json);
            return data;
        };
    };

    return LarchForm;

});