const Me = imports.misc.extensionUtils.getCurrentExtension();
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Helper = Me.imports.src.helper;
const Gio = imports.gi.Gio;

function init() {
}

function buildPrefsWidget() {
    let widget = new MyPrefsWidget();
    widget.show_all();
    return widget;
}

const MyPrefsWidget = GObject.registerClass(
    class MyPrefsWidget extends Gtk.Box {

        buildPage() {
            let result = new Gtk.Box({
                orientation: Gtk.Orientation.VERTICAL,
                margin: 20,
                margin_top: 10,
                expand: true,
            });
            let scrollWindow = new Gtk.ScrolledWindow({shadow_type: Gtk.ShadowType.IN});
            scrollWindow.set_border_width(10);
            scrollWindow.set_policy(Gtk.PolicyType.AUTOMATIC, Gtk.PolicyType.ALWAYS);

            return result;
        }

        getPageDisplay(settings) {
            const prefs = this.buildPage();
            prefs.add(this.addCryptocoin(settings));
            prefs.add(this.addNumberOfDecimals(settings));
            prefs.add(this.addCurrency(settings));
            prefs.add(this.addDisplayType(settings));
            prefs.add(this.addBalance(settings));

            return prefs;
        }

        getPageAlerts(settings) {
            const prefs = this.buildPage();
            prefs.add(this.addAlertsEnabled(settings));
            prefs.add(this.addAboveAlert(settings));
            prefs.add(this.addBelowAlert(settings));
            prefs.add(this.alertInterval(settings));

            return prefs;
        }

        getPageAPI(settings) {
            const prefs = this.buildPage();
            prefs.add(this.addTimeout(settings));

            return prefs;
        }

        _init(params) {
            super._init(params);
            this.margin = 20;
            this.set_spacing(15);
            this.set_orientation(Gtk.Orientation.VERTICAL);
            this.width = 600;

            let settings = Helper.getSettings();

            const notebook = new Gtk.Notebook();

            function addPage(label, page) {
                notebook.append_page(page, new Gtk.Label({label}));
            }

            //Tabs
            addPage('Display', this.getPageDisplay(settings));
            addPage('Alerts', this.getPageAlerts(settings));
            addPage('API', this.getPageAPI(settings));

            this.add(notebook);
            this.connect('destroy', Gtk.main_quit);
        }


        addTimeout(settings) {
            let spinButton = new Gtk.SpinButton();
            spinButton.set_sensitive(true);
            spinButton.set_range(10, 3600);
            spinButton.set_value(settings.get_int('timeout'));
            spinButton.set_increments(5, 10);

            spinButton.connect("value-changed", function (w) {
                settings.set_int('timeout', w.get_value_as_int());
            });

            return this.buildConfigRow('API Calls interval / seconds', spinButton);
        }


        addNumberOfDecimals(settings) {
            let spinButton = new Gtk.SpinButton();
            spinButton.set_sensitive(true);
            spinButton.set_range(0, 6);
            spinButton.set_value(settings.get_int('number-of-decimals'));
            spinButton.set_increments(1, 2);

            spinButton.connect("value-changed", function (w) {
                settings.set_int('number-of-decimals', w.get_value_as_int());
            });

            return this.buildConfigRow('Number Of Decimals', spinButton);
        }

        addCryptocoin(settings) {
            let clickActionOptions = [];
            for (let i = 0; i < Helper.crypto.length; i++) {
                clickActionOptions.push([Helper.crypto[i], i]);
            }
            const currentClickAction = settings.get_enum('cryptocoin');
            const comboBoxDefaultClickAction = this.getComboBox(
                clickActionOptions,
                GObject.TYPE_INT,
                currentClickAction,
                (value) => settings.set_enum('cryptocoin', value)
            );

            return this.buildConfigRow('Cryptocoin', comboBoxDefaultClickAction);
        }

        addCurrency(settings) {
            let clickActionOptions = [];
            for (let i = 0; i < Helper.currencies.length; i++) {
                clickActionOptions.push([Helper.currencies[i].name, i]);
            }
            const currentClickAction = settings.get_enum('curency');
            const comboBoxDefaultClickAction = this.getComboBox(
                clickActionOptions,
                GObject.TYPE_INT,
                currentClickAction,
                (value) => settings.set_enum('curency', value)
            );

            return this.buildConfigRow('Currency', comboBoxDefaultClickAction);
        }

        addDisplayType(settings) {
            let clickActionOptions = [
                ['Crypto price', 0],
                ['How much I own', 1],
                ['Crypto price and How much I own', 2]
            ];

            const currentClickAction = settings.get_enum('display-type');
            const comboBoxDefaultClickAction = this.getComboBox(
                clickActionOptions,
                GObject.TYPE_INT,
                currentClickAction,
                (value) => {
                    settings.set_enum('display-type', value);
                    this.displayWallet = value === 1;
                }
            );

            return this.buildConfigRow('Display type', comboBoxDefaultClickAction);
        }

        addBalance(settings) {
            let textField = new Gtk.Entry({hexpand: true, margin_left: 20});
            textField.set_text(settings.get_string('wallet'));
            textField.connect('changed', (entry) => {
                settings.set_string('wallet', entry.get_text());
            });

            return this.buildConfigRow('Amount of crypto that you own', textField);
        }

        /**
         * ALERTS
         */

        addAlertsEnabled(settings) {
            let toggle = new Gtk.Switch({
                active: true,
                halign: Gtk.Align.END,
                visible: true
            });
            // Bind the switch to the `show-indicator` key
            settings.bind(
                'alerts-enabled',
                toggle,
                'active',
                Gio.SettingsBindFlags.DEFAULT
            );

            return this.buildConfigRow('Alerts Enabled', toggle);
        }

        addAboveAlert(settings) {
            let textfield = new Gtk.Entry({hexpand: true, margin_left: 20});
            textfield.set_text(settings.get_string('alert-above-1'));
            textfield.connect('changed', (entry) => {
                settings.set_string('alert-above-1', entry.get_text());
            });

            return this.buildConfigRow('Alert when price is above value', textfield);
        }

        addBelowAlert(settings) {
            let textfield = new Gtk.Entry({hexpand: true, margin_left: 20});
            textfield.set_text(settings.get_string('alert-below-1'));
            textfield.connect('changed', (entry) => {
                settings.set_string('alert-below-1', entry.get_text());
            });

            return this.buildConfigRow('Alert when price is below value', textfield);
        }

        alertInterval(settings) {
            let spinButton = new Gtk.SpinButton();
            spinButton.set_sensitive(true);
            spinButton.set_range(10, 7200);
            spinButton.set_value(settings.get_int('alert-interval'));
            spinButton.set_increments(10, 10);

            spinButton.connect("value-changed", function (w) {
                settings.set_int('alert-interval', w.get_value_as_int());
            });

            return this.buildConfigRow('Alert trigger interval (seconds )', spinButton);
        }

        /**
         HELPERS
         **/
        getComboBox(options, valueType, defaultValue, callback) {
            const model = new Gtk.ListStore();
            const Columns = {LABEL: 0, VALUE: 1};
            model.set_column_types([GObject.TYPE_STRING, valueType]);
            const comboBox = new Gtk.ComboBox({model});
            const renderer = new Gtk.CellRendererText();
            comboBox.pack_start(renderer, true);
            comboBox.add_attribute(renderer, 'text', 0);
            for (const [label, value] of options) {
                let iter;
                model.set((iter = model.append()), [Columns.LABEL, Columns.VALUE], [label, value]);
                if (value === defaultValue) {
                    comboBox.set_active_iter(iter);
                }
            }
            comboBox.connect('changed', (_entry) => {
                const [success, iter] = comboBox.get_active_iter();
                if (!success) {
                    return;
                }
                const value = model.get_value(iter, Columns.VALUE);
                callback(value);
            });

            return comboBox;
        }

        buildConfigRow(label, widget) {
            if (typeof label === 'string') {
                label = new Gtk.Label({
                    label,
                    xalign: 0,
                    expand: true,
                });
            }

            const hbox = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL,
                margin_top: 5,
                expand: false,
                hexpand: false,
                vexpand: false,
                margin_bottom: 10,
            });

            hbox.add(label);
            hbox.add(widget);

            return hbox;
        }
    });
