const Me = imports.misc.extensionUtils.getCurrentExtension();
const Gio = imports.gi.Gio;

const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Helper = Me.imports.src.helper;

function init () {}

function buildPrefsWidget () {
  let widget = new MyPrefsWidget();
  widget.show_all();
  return widget;
}

const MyPrefsWidget = GObject.registerClass(
class MyPrefsWidget extends Gtk.Box {

  _init (params) {

    super._init(params);

    this.margin = 20;
    this.set_spacing(15);
    this.set_orientation(Gtk.Orientation.VERTICAL);

    this.connect('destroy', Gtk.main_quit);
    let settings = Helper.getSettings();

    this.addNumberOfDecimals(settings);
    this.addCryptocoin(settings);
    this.addCurrency(settings);
  }

  addNumberOfDecimals(settings){
    let myLabel = new Gtk.Label({
      label : "Number Of Decimals:"    
    });

    let spinButton = new Gtk.SpinButton();
    spinButton.set_sensitive(true);
    spinButton.set_range(0, 6);
    spinButton.set_value(settings.get_int('number-of-decimals'));
    spinButton.set_increments(1, 2);

    spinButton.connect("value-changed", function (w) {
      settings.set_int('number-of-decimals', w.get_value_as_int());
    });

    const hBox = new Gtk.Box();
    hBox.set_orientation(Gtk.Orientation.HORIZONTAL);

    hBox.pack_start(myLabel, false, false, 0);
    hBox.pack_end(spinButton, false, false, 0);

    this.add(hBox);
  }

  addCryptocoin(settings){
        const labelDefaultClickAction = 'Cryptocoin';
        let clickActionOptions = [];
        for(let i=0; i < Helper.crypto.length; i++){
          clickActionOptions.push([Helper.crypto[i], i]);
        }
      
        const currentClickAction = settings.get_enum('cryptocoin');
        const comboBoxDefaultClickAction = this.getComboBox(
          clickActionOptions,
          GObject.TYPE_INT,
          currentClickAction,
          (value) => settings.set_enum('cryptocoin', value)
        );
        this.add(this.buildConfigRow(labelDefaultClickAction, comboBoxDefaultClickAction));
  }

    addCurrency(settings){
        const labelDefaultClickAction = 'Currency';
        let clickActionOptions = [];

        for(let i=0;i< Helper.currencies.length;i++){
          clickActionOptions.push([Helper.currencies[i].name, i]);
        }

        const currentClickAction = settings.get_enum('curency');
        const comboBoxDefaultClickAction = this.getComboBox(
          clickActionOptions,
          GObject.TYPE_INT,
          currentClickAction,
          (value) => settings.set_enum('curency', value)
        );
        this.add(this.buildConfigRow(labelDefaultClickAction, comboBoxDefaultClickAction));
  }

/**
   HELPERS
**/
  getComboBox(options, valueType, defaultValue, callback) {
        const model = new Gtk.ListStore();
        const Columns = { LABEL: 0, VALUE: 1 };
        model.set_column_types([GObject.TYPE_STRING, valueType]);
        const comboBox = new Gtk.ComboBox({ model });
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
            return this.buildConfigRow( new Gtk.Label({
            label,
            xalign: 0,
            expand: true,
        }), widget);
        }
        const hbox =  new Gtk.Box({
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
