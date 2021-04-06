const St = imports.gi.St;
const Main = imports.ui.main;
const Soup = imports.gi.Soup;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Clutter = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;
const Util = imports.misc.util;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Gio = imports.gi.Gio;
const ExtensionUtils = imports.misc.extensionUtils;
const Helper = Me.imports.src.helper;


const BP_API_URL = 'https://api.bitpanda.com/v1/ohlc/';

let _httpSession;
var bpMenu;

const BipandaAssetsIndicator = new Lang.Class({
        Name: 'BipandaAssetsIndicator',
        Extends: PanelMenu.Button,

        _init: function () {
            _httpSession = new Soup.Session();
            this._idle = false;
            this.parent(0.0, "Bitpanda Currency indicator", false);
            this.buttonText = new St.Label({
                text: "Loading Bitpanda ...",
                y_align: Clutter.ActorAlign.CENTER,
                style_class: "red"
            });
            this.price = 0;
            this.allertTriggered = Date.now();
            //add icon
            const hbox = new St.BoxLayout({style_class: "panel-status-menu-box"});
            const gicon = Gio.icon_new_for_string(Me.path + "/bitpanda.png");
            const bitpandaIcon = new St.Icon({gicon: gicon, icon_size: "16"});
            hbox.add_child(bitpandaIcon);
            hbox.add_child(this.buttonText);
            //endof icon

            this.actor.add_actor(hbox);
            this.actor.connect("button_press_event", Lang.bind(this, this._openSettings));

            this._refresh();
        },
        _refresh: function () {
            let settings = Helper.getSettings();
            this._loadData(this._refreshUI);
            this._removeTimeout();
            this._timeout = Mainloop.timeout_add_seconds(settings.get_int('timeout'), Lang.bind(this, this._refresh));
            return true;
        },
        _loadData: function () {
            let settings = Helper.getSettings();
            settingsTimeout = settings.get_int('timeout');
            let url = BP_API_URL
                + Helper.getCryptoFromInt(settings.get_enum('cryptocoin'))
                + '/'
                + Helper.getCurrencyPropertyFromInt(settings.get_enum('curency'), 'name')
                + '/'
                + 'hour';

            let message = Soup.form_request_new_from_hash('GET', url, []);

            _httpSession.queue_message(message, Lang.bind(this, function (_httpSession, message) {
                    if (message.status_code !== 200)
                        return;

                    let jsonObject = JSON.parse(message.response_body.data);
                    this._refreshUI(jsonObject, settings);
                }
                )
            );
        },

        _refreshUI: function (jsonObject, settings) {
            if(typeof jsonObject === 'undefined '){
                return false;
            }
            if (typeof jsonObject.data === 'undefined' || jsonObject.data.length === 0) {
                log('Wrong data received from API.');
                return false;
            }

            let lastItem = jsonObject.data[jsonObject.data.length - 1];

            let numberOfDecimals = settings.get_int('number-of-decimals');

            if (typeof lastItem.attributes !== 'undefined' && typeof lastItem.attributes.close !== 'undefined') {

                let txt;
                let oldPrice = this.price;
                this.price = parseFloat(lastItem.attributes.close).toFixed(numberOfDecimals).toString();

                let priceCompare = this.price;
                if (settings.get_enum('display-type') === 1) {
                    priceCompare = this.price * parseFloat(settings.get_string('wallet'));
                    txt = parseFloat(priceCompare).toFixed(numberOfDecimals);
                } else {
                    txt = Helper.getCryptoFromInt(settings.get_enum('cryptocoin')) + ': '
                        + this.price;
                }

                txt += ' ' + Helper.getCurrencyPropertyFromInt(settings.get_enum('curency'), 'symbol');

                let triggerAlert = false;
                if (parseFloat(settings.get_string('alert-above-1')) > 0
                    && priceCompare > parseFloat(settings.get_string('alert-above-1'))
                ) {
                    triggerAlert = true;
                } else if (parseFloat(settings.get_string('alert-below-1')) > 0
                    && priceCompare < parseFloat(settings.get_string('alert-below-1'))
                ) {
                    triggerAlert = true;
                }

                if (triggerAlert && ((Date.now() - this.allertTriggered) >= settings.get_int('alert-interval') * 1000)) {
                    this.allertTriggered = Date.now();
                    Main.notify('Bitpanda price alert',
                        'Your crypto current value: '
                        + priceCompare.toFixed(numberOfDecimals)
                        + ' '
                        + Helper.getCurrencyPropertyFromInt(settings.get_enum('curency'), 'symbol')
                    );
                }

                if (this.price > oldPrice) {
                    this.buttonText.style_class = 'green';
                } else if (this.price < oldPrice) {
                    this.buttonText.style_class = 'red';
                } else {
                    this.buttonText.style_class = 'gray';
                }
                this.buttonText.set_text(txt);
            }
        },

        _openSettings: function () {
            if (typeof ExtensionUtils.openPrefs === 'function') {
                ExtensionUtils.openPrefs();
            } else {
                Util.spawn([
                    "gnome-shell-extension-prefs",
                    Me.uuid
                ]);
            }
        },
        _removeTimeout: function () {
            if (this._timeout) {
                Mainloop.source_remove(this._timeout);
                this._timeout = null;
            }
        },

        stop: function () {
            if (_httpSession !== undefined)
                _httpSession.abort();
            _httpSession = undefined;

            if (this._timeout)
                Mainloop.source_remove(this._timeout);
            this._timeout = undefined;

            this.menu.removeAll();
        },
    }
);

function init() {
    //TODO: here we need some improvement
    let settings = Helper.getSettings();
    settings.connect('changed', () => {
        if(typeof bpMenu !== 'undefined') {
            bpMenu._refresh();
        }
    });
}

function enable() {
    bpMenu = new BipandaAssetsIndicator;
    Main.panel.addToStatusArea('bitpanda-indicator', bpMenu);
}

function disable() {
    bpMenu.stop();
    bpMenu.destroy();
}
