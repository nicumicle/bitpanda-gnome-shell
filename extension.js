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
const TIMEOUT = 60; //seconds

let _httpSession;
let bpMenu;


const BipandaAssetsIndicator = new Lang.Class({
		Name: 'BipandaAssetsIndicator',
		Extends: PanelMenu.Button,

		_init: function () {
			this.parent(0.0, "Bitpanda Currency indicator", false);
			this.buttonText = new St.Label({
				text: _("Loading Bitpanda ..."),
				y_align: Clutter.ActorAlign.CENTER,
				style_class: "red"
			});
			this.price = 0;

			//add icon
  			const hbox = new St.BoxLayout({ style_class: "panel-status-menu-box" });
        	const gicon = Gio.icon_new_for_string(Me.path + "/bitpanda.png");
        	const bitpandaIcon = new St.Icon({ gicon: gicon, icon_size: "16" });
        	hbox.add_child(bitpandaIcon);
        	hbox.add_child(this.buttonText);
			//endof icon

			this.actor.add_actor(hbox);
				
			//Open url on click
			//this.actor.connect('button-press-event', Lang.bind(this, this._openBrowser))
			
			this.actor.connect("button_press_event", Lang.bind(this, this._openSettings));	

			this._refresh();

		},


		_refreshMenu(){
			this.menu.addMenuItem(new PopupMenu.PopupMenuItem('Anaaaaa'));
			this.actor.show();
		},
		
		_refresh: function () {
			this._loadData(this._refreshUI);
			this._removeTimeout();
			this._timeout = Mainloop.timeout_add_seconds(TIMEOUT, Lang.bind(this, this._refresh));
			return true;
		},

		_loadData: function () {
			
			_httpSession = new Soup.Session();
			let settings = Helper.getSettings();

			let url = BP_API_URL 
					+ Helper.getCryptoFromInt( settings.get_enum('cryptocoin') ) 
					+ '/' 
					+ Helper.getCurrencyPropertyFromInt(settings.get_enum('curency'), 'name') 
					+ '/' 
					+ 'hour';

			let message = Soup.form_request_new_from_hash('GET', url, []);

			_httpSession.queue_message(message, Lang.bind(this, function (_httpSession, message) {
						if (message.status_code !== 200)
							return;

						let jsonObject = JSON.parse(message.response_body.data);
						this._refreshUI(jsonObject);
					}
				)
			);
		},
		
		_refreshUI: function (jsonObject) {
			 let settings = Helper.getSettings();
			
			if(typeof jsonObject.data === 'undefined' || jsonObject.data.length  === 0){
				log('Wrong data received from API.');
				return false;
			}

			let lastItem = jsonObject.data[jsonObject.data.length - 1];

			let numberOfDecimals = settings.get_int('number-of-decimals');

			if(typeof lastItem.attributes !== 'undefined' && typeof lastItem.attributes.close !== 'undefined'){	

				let oldPrice = this.price;
				this.price = parseFloat(lastItem.attributes.close).toFixed(numberOfDecimals).toString();
				
				let txt = Helper.getCryptoFromInt( settings.get_enum('cryptocoin')) + ': '  
						+ this.price + ' ' 
						+  Helper.getCurrencyPropertyFromInt(settings.get_enum('curency'), 'symbol');
				

				
				this.buttonText.style_class = this.price >= oldPrice ? 'green' : 'red';
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
		 _openBrowser: function() {
		 
			let url = BP_API_URL;
			Util.spawnCommandLine("xdg-open " + url)
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
}

function enable() {
	bpMenu = new BipandaAssetsIndicator;
	Main.panel.addToStatusArea('bitpanda-indicator', bpMenu);
}

function disable() {
	bpMenu.stop();
	bpMenu.destroy();
}
