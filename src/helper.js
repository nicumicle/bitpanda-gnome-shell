const Me = imports.misc.extensionUtils.getCurrentExtension();
const Gio = imports.gi.Gio;

var currencies = [
	{
		'name' : 'EUR',
		'symbol' : '€',
	},
	{
		'name' : 'USD',
		'symbol' : '$',
	},
     {
		'name' : 'GBP',
		'symbol' : '£'
	},
	 {
		'name' : 'CHF',
		'symbol': 'Fr.',
	},
	 {
		'name' : 'TRY',
		'symbol' : '₺',
	}
];
var crypto = [
	'BTC',
	'ETH',
	'BEST',
	'CHZ',
	'ADA',
	'LTC', 
	'DOT', 
	'BTT', 
	'DASH', 
	'XRP', 
	'MIOTA', 
	'XLM', 
	'TRX', 
	'DOGE', 
	'DGB', 
	'AVAX', 
	'USDT', 
	'UNI', 
	'VET', 
	'LINK', 
	'PAN', 
	'AAVE', 
	'USDC', 
	'BCH', 
	'ZRX', 
	'UMA', 
	'REN', 
	'YFI', 
	'ATOM',
	'EOS',
	'OCEAN', 
	'XEM', 
	'SNX', 
	'NEO', 
	'LSK', 
	'BNB', 
	'FIL', 
	'BAT', 
	'BAND', 
	'XTZ', 
	'MKR', 
	'COMP', 
	'ANT', 
	'ETC', 
	'KMD', 
	'QTUM', 
	'ONT', 
	'OMG', 
	'ZEC', 
	'KNC', 
	'WAVES', 
	'REP', 
	'ALGO', 
	'BSV', 
	'XMR', 
	'THETA',
	'HT', 
	'ZIL', 
	'CRO', 
	'OKB',
];

var getCurrencyPropertyFromInt = function(index, propertyName) {
	if(typeof currencies[index] !== 'undefined' && typeof currencies[index][propertyName] !== 'undefined'){
		return currencies[index][propertyName]
	}

	return '';
}

var getCryptoFromInt =  function(index){
   	if(typeof crypto[index] !== 'undefined'){
   		return crypto[index];
   	} 

   	return 'BTC';
};


var getSettings = function(){
	let GioSSS = Gio.SettingsSchemaSource;
	let schemaSource = GioSSS.new_from_directory(
	    Me.dir.get_child("schemas").get_path(),
	    GioSSS.get_default(),
	    false
	  );
  	let schemaObj = schemaSource.lookup(
    		'org.gnome.shell.extensions.bitpanda', true);
  	if (!schemaObj) {
    		return false;
  	}
  	return new Gio.Settings({ settings_schema : schemaObj });

};