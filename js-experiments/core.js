/* ---------------------------------------------------------------------------------------
|
|	CRYPTO CORE
|
+-------------------------------------------------------------------------------------- */

/* Protobuf validation */
if(!protobuf) {
	console.error("Protobuf not available");
	throw "Protobuf not available";
}

/* ------------------------------------------------------------------------------------ */

const globals = {
	minIterations: 100000,
	aesLengths: [128,192,256],
	hashAlgs: ['SHA-256','SHA-384','SHA-512'],
};
const globalDefaults = {
	keysDaysLifetime : 182, // days
	iterations : 360000,
	aesLength : 256,
	hashLength : 256,
};

/* ------------------------------------------------------------------------------------ */

/**
 * AES-GCM => Wrapped(pwd + salt > PBKDF2 + SHA-256 + 100000 > AES-KW | raw)
 * ECDH => export(public + private) => encrypt(AES-GCM, key, data)
 */
/* AES-CTR | AES-CBC | AES-GCM */
/**
 * AES : 128 | 192 | 256
 * ECDH : P-256 | P-384 | P-521
 */
const cryptoHelper = {
	/* AES - KeyWrapping */
	getAesKw: async (pwd, salt, {iterations=330000, length=256, hashAlgorithm='SHA-256'}={}, extract=false) => {
		/* Validate parameters */
		if(!([128,192,256].includes(length))) {
			console.error('getAesKw Error: Unsupported length', length);
			return false;
		}
		if(!(['SHA-256','SHA-384','SHA-512'].includes(hashAlgorithm))) {
			console.error('getAesKw Error: Unsupported hashAlgorithm', hashAlgorithm);
			return false;
		}
		if(iterations<globals.minIterations) {
			console.error('getAesKw Error: Unsupported iterations', iterations);
			return false;
		}
		/* */
		const enc = new TextEncoder();
		const keyMaterial = await window.crypto.subtle.importKey(
			"raw", enc.encode(pwd),
			{name: "PBKDF2"},
			false,
			["deriveKey"]
		);
		return window.crypto.subtle.deriveKey(
			{"name": "PBKDF2", "salt": salt, "iterations": iterations, "hash": hashAlgorithm},
			keyMaterial, 
			{ "name": "AES-KW", "length": length},
			(extract===true) ? true : false,
			["wrapKey", "unwrapKey"]
		);
	},
	/* AES from Elliptic curve Diffie Hellman */
	getAesDH: async (pubKey, privKey, salt, {info='', length=256, hashAlgorithm='SHA-512'}={}, extract=false) => {
		/* Validate parameters */
		if(!([128,192,256].includes(length))) {
			console.error('getAesDH Error: Unsupported length', length);
			return false;
		}
		if(!(['SHA-256','SHA-384','SHA-512'].includes(hashAlgorithm))) {
			console.error('getAesDH Error: Unsupported hashAlgorithm', hashAlgorithm);
			return false;
		}
		/* */
		const keyMaterial = await window.crypto.subtle.deriveBits(
			{"name": "ECDH", "public": pubKey }, privKey, length
		);
		/* Ideally, the salt is a random or pseudo-random value with the same length as the output of the digest function.
		 * Unlike the input key material passed into deriveKey(), salt does not need to be kept secret */
		return window.crypto.subtle.deriveKey(
			{"name": "HKDF", "salt": salt, "info": info, "hash": hashAlgorithm},
			keyMaterial,
			{"name": "AES-GCM", "length": length},
			(extract===true) ? true : false,
			["encrypt", "decrypt"]
		);
	},
	/* Elliptic curve - DeriveKey */
	generateEcdh: async (extract, nameCurve="P-384") => {
		/* Validate parameters */
		if(!(['P-256','P-384','P-521'].includes(nameCurve))) {
			console.error('generateEcdh WARNING: Unsupported algorithm', nameCurve);
			return false;
		}
		/* */
		const keyPair = await window.crypto.subtle.generateKey(
			{"name": "ECDH","namedCurve": nameCurve },
			(extract===true) ? true : false,
			["deriveKey", "deriveBits"]
		);
		return keyPair;
	},
	/* Elliptic curve - Signature */
	generateEcdsa: async (extract, nameCurve="P-384") => {
		/* Validate parameters */
		if(!(['P-256','P-384','P-521'].includes(nameCurve))) {
			console.error('generateEcdsa WARNING: Unsupported algorithm', nameCurve);
			return false;
		}
		/* */
		return window.crypto.subtle.generateKey(
			{"name": "ECDSA", "namedCurve": nameCurve },
			(extract===true) ? true : false,
			["sign", "verify"]
		);
	},
	/* AES - Galois/Counter Mode */
	generateAesGcm: async (extract, length=256) => {
		/* Validate parameters */
		if(!([128,192,256].includes(length))) {
			console.error('generateAesGcm WARNING: Unsupported length', length);
			return false;
		}
		/* */
		return window.crypto.subtle.generateKey(
			{"name": "AES-GCM", "length": length },
			(extract===true) ? true : false,
			["encrypt", "decrypt"]
		);
	},
	/* Wrap a key with another key */
	wrapKey: async (key, alg, wrappingKey) => {
/*
algorithm: {…}
	length: 256
	name: "AES-GCM"
extractable: true
type: "secret"
usages: (2) […]
	0: "encrypt"
	1: "decrypt"
	length: 2
*/
		if(alg != 'AES-KW') {
			console.error('wrapKey WARNING: Unsupported algorithm', alg);
		}
		return window.crypto.subtle.wrapKey("raw", key, wrappingKey, alg);
	},
	/* Unwrap a key */
	unwrapKey: async (key, alg, wrappingKey) => {
		if(alg != 'AES-GCM') {
			console.error('unwrapKey WARNING: Unsupported algorithm', alg);
		}
		/* unwrap "alg - key" with AES-KW "wrappingKey", non extractable (false) for encrypt and decrypt. */
		return window.crypto.subtle.unwrapKey("raw", key, wrappingKey, "AES-KW", alg, false, ["encrypt", "decrypt"]);
/*
return window.crypto.subtle.unwrapKey("pkcs8", key, wrappingKey,
    { name: "AES-GCM", iv: ivBuffer },
    { name: "RSA-PSS", hash: "SHA-256" },
    false,
    ["sign"]
);
*/
	},
	/* Generate random data which can be used as IV */
	generateIV: (length) => {
		length = length || 12;
		if(length < 6 || length > 64) length = 12;
		return window.crypto.getRandomValues(new Uint8Array(length));
	},
	/* Generate random data which can be used as salt */
	generateSalt: (length) => {
		length = length || 24;
		if(length < 6 || length > 128) length = 24;
		return window.crypto.getRandomValues(new Uint8Array(length));
	},
	/* Generate a random UUID */
	randomUUID: () => {
		return window.crypto.randomUUID();
	},
	/* Export a public key (Raw by default) */
	exportPubKey: async (key, mode="raw") => {
		mode = ["raw","spki"].includes(mode) ? mode : "raw";
		const pubKey = key.publicKey ? key.publicKey : key;
		return await window.crypto.subtle.exportKey(mode, pubKey);
	},
	/* Export a private key (only PKCS8) */
	exportPrivKey: async (key, mode="pkcs8") => {
		// mode = ["pkcs8"].includes(mode) ? mode : "pkcs8";
		mode = "pkcs8";
		const privKey = key.privateKey ? key.privateKey : key;
		return await window.crypto.subtle.exportKey(mode, privKey);
	}
	/*
	,
	sign: async () => {
		// return window.crypto.subtle.sign();
	},
	decrypt => async () => {
	}
	*/
};


/* ------------------------------------------------------------------------------------ */

/**
 * Utils
 */
function convertUint8arrayToBase64(array) {
	try {
		return btoa(String.fromCharCode.apply(null, array));
	} catch(e) {
		console.error(e);
		if(console.out) console.out(e);
		return false;
	}
}
function convertArraybufferToBase64(buffer) {
	try {
		return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
	} catch(e) {
		console.error(e);
		if(console.out) console.out(e);
		return false;
	}
}
function convertBase64ToUint8array(buffer) {
	try {
		return Uint8Array.from(window.atob(buffer), (v) => v.charCodeAt(0));
	} catch(e) {
		console.error(e);
		if(console.out) console.out(e);
		return false;
	}
}

function extractBeginEnd(buffer) {
	// -+BEGIN [\w ]+-+\s*([\w+=/\s]+)-+END [\w ]+-+
	const ret = buffer.match(/-+BEGIN [\w ]+-+\s*([\w+=/\s]+)-+END [\w ]+-+/);
	return ret[1].replace(/[\n\r]+/g, "");
}

/* ------------------------------------------------------------------------------------ */

let _fullProtocolDefinitions = null;
function getFullProtocolDefs() {
	if(_fullProtocolDefinitions !== null)
		return _fullProtocolDefinitions;
	const def = `syntax="proto3";
/* Enumerations */
enum ePubKeyFormat {
	RAW = 0;
	SPKI = 1;
}
enum ePrivKeyFormat {
	PKCS8 = 0;
}
enum eSymKeyFormat {
	RAW = 0;
}
/* Public and Private Key */
message keyPair {
	string uid = 1;							// Identifier of the key
    string alg = 2;							// Key Algorithm / mechanism
	optional bytes params = 4;				// Key params => migrate to Protobuf message
	optional int32 length = 5;				// Key length, if algorithm compatible
	//
	bytes publickey = 10;					// Encoded key data
	optional ePubKeyFormat publickey_format = 11 [default = RAW];
	//
	bytes privatekey = 15;					// Encoded key data
	optional ePrivKeyFormat privatekey_format = 16 [default = PKCS8];
	//
	string creation_date = 20;
	string expiration_date = 21;
}
/* Public Key */
message keyPub {
	string uid = 1;							// Identifier of the key
	string alg = 2;							// Key Algorithm / mechanism
	optional bytes params = 4;				// Key params => migrate to Protobuf message
	optional int32 length = 5;				// Key length, if algorithm compatible
	//
	bytes publickey = 10;					// Encoded key data
	optional ePubKeyFormat publickey_format = 11 [default = RAW];
	//
	string creation_date = 20;
	string expiration_date = 21;
}
/* Symetric Key */
message keySym {
	string uid = 1;							// Identifier of the key
	string alg = 2;							// Key Algorithm / mechanism
	optional bytes params = 4;				// Key params => migrate to Protobuf message
	optional int32 length = 5;				// Key length, if algorithm compatible
	//
	bytes key = 10;							// Encoded key data
	optional eSymKeyFormat key_format = 11 [default = RAW];
}
/* A Key (AsymPriv/Sym) wrapped by another key (can be password) */
message keyWrapped {
	optional string uid = 1;				// Identifier of the key
	string alg = 2;							// Key Algorithm / mechanism
	bytes key = 3;							// Wrapped key
	optional bytes params = 4;				// Key params => migrate to Protobuf message
	optional int32 length = 5;				// Key length, if algorithm compatible

	string derive_alg = 10;					// Algorithm used for wrapping
	optional int32 derive_length = 11;		// Length of the wrapping key, if compatible
	optional string derive_hash = 12;		// Hash algorithm, if compatible
	optional bytes salt = 15;				// Used salt, if compatible
	uint32 iterations = 16;					// Number of iterations
}
message keyDH {
	string uid = 1;
    string mech_keypair = 2;
	optional int32 length_derive = 4;
	//
	bytes publickey = 10;
	oneof private_data {
		string privatekey_uid = 15;
		bytes privatekey = 16;
	}
	//
	bytes salt = 20;
	optional bytes extradata = 21;
	int32 mech_hash = 25;
	int32 mech_keysym = 26;
	int32 length_keysym = 27;
}
message keySymEncrypted {
	string uid = 1;							// Identifier of the key
	string alg = 2;							// Key Algorithm / mechanism
	optional bytes params = 4;				// Key params => migrate to message
	optional int32 length = 5;				// Key length
	// User||Group > Encoded Key
	map<string, encodedData> keys = 10;
	optional int32 key_format = 11;			// Format of the key (raw, pkc8...)
}
message encodedData {
	oneof key {
		string key_uid = 1;
		bytes key_data = 2;					// TODO
		keyWrapped key_pwd = 3;
		// ECDH support ? Or via keyWrapped ?
	}
	optional bytes param_iv = 20;
	optional int32 param_len = 21;
	//
	bytes data = 30;
}
/* */
message Account {
	string account_name = 1;
	optional string account_url = 2;
	optional string account_email = 3;
	//--
 	keyPub public_sign_key = 4;
 	optional keyPub public_dh_key = 5;
	optional bytes hkdf_salt = 6;
	optional keyPair shared_dh_key = 7;
}
message relationRequest {
	string nickname = 1;				// Sender designation
	string url = 2;						// Sender entry point
	optional string email = 3;			// Sender contact
	optional string short_message = 4;	// Sender message
	//--
	string uid = 10;					// Unique identifier
	string date = 11;					// ISO String
	keyPub public_dh_key = 12;			// Public key for DH KeyEx
	bytes hkdf_salt = 13;				// Salt for DH KeyEx
}
message relationResponse {
	string uid = 1;						// Unique identifier
	keyPub public_dh_key = 2;			// Public key for DH KeyEx
	string date = 3;					// ISO String
	bytes encoded = 5;
}
message relationResponseData {
	string nickname = 1;				// Sender designation
	string url = 2;						// Sender entry point
	optional string email = 3;			// Sender contact
	optional string short_message = 4;	// Sender message
}
message pendingAccount {
	string receiver = 1;				// Local (human) indentifier
	relationRequest request = 2;		// Request object
	keyPair key = 3;					// Private key
}
message profileContent {
	optional string name = 1;
	optional string email = 3;
	optional string url = 2;
	//
	keyPair sign_key = 10;
	//
	map<string, Account> accounts = 30;
	map<string, pendingAccount> pendings = 31;
}
message mainProfile {
	keyWrapped main_key = 1;
	// Backup
	optional keyWrapped backup_key = 2;
	//
	bytes iv = 3;
	bytes encoded = 4; // profileContent
}
enum eSignedMessageTypes {
	relation_request = 1;
}
message signedMessage {
	bytes signature_data = 1;
	optional string uid = 2;
	optional string identity_ref = 3;			// URL (identity entrypoint)
	// Using a keyPub is better to get algorithms.
	optional keyPub public_key = 4;
	// The sub-message that we need to verify before decoding it.
	eSignedMessageTypes message_type = 10;
	bytes message = 11;
}
`;
/*
keyWrapped :
	* key data
	* mech derive (= "PBKDF2") / ECDH?
	* PBKDF2 - hash algo
	* PBKDF2 - iterations
	* PBKDF2 - salt
	* mech wrap
	* length wrap
	* params wrap
	--------------
	[> pwd] => algo (PBKDF2)
	[derivekey]
		^ previous key (pwd)
		* algo
		* salt
		* iterations
		* mech hash
		* derived Key Algorithm (= unwrapAlgo)
		* derived Key Length
		? derived Key Hash (for HMAC)
	[unwrapkey]
		* format, (raw)
		* wrappedKey
		* unwrappingKey (key from devicekey)
		* unwrapAlgo (= derivekey.derive algo)
		* unwrappedKeyAlgo
*/
/*
message SearchResponse {
	message Result {
		string url = 1;
		string title = 2;
		repeated string snippets = 3;
	}
	repeated Result results = 1;
}
//	reserved X,Y;

message SampleMessage {
	oneof test_oneof {
		string name = 4;
		SubMessage sub_message = 9;
	}
}

	string
	double | float
	int32 | int64 | uint32 | uint64 | sint32 | sint64 | fixed32 | fixed64 | sfixed32 | sfixed64
	bool
	bytes
	enum

	map<string, Project> projects = 3;
*/
	_fullProtocolDefinitions = protobuf.parse(def,{keepCase:true}).root;
	return _fullProtocolDefinitions;
}

class protocolDef {
	// Cache variable
	static _root = null;
	/**
	 * Initialization
	 */
	static initProto() {
		if(this._root === null)
			this._root = (this._definition) ? protobuf.parse(this._definition,{keepCase:true}).root : getFullProtocolDefs();
		if(this._camelCase)
			return this.addVirtualCamelcaseFields(this._root.lookup(this._key));
		return this._root.lookup(this._key);
	}
	/**
	 * Create Object
	 */
	static create(data) {
		const proto = this.initProto();
		return proto.create(data);
	}
	/**
	 * Create Object and return Encoded content
	 */
	static encode(data) {
		const proto = this.initProto();
		const obj = proto.create(data);
		return proto.encode(obj).finish();
	}
	/**
	 * Encode created object
	 */
	static encodeObj(obj) {
		const proto = this.initProto();
		return proto.encode(obj).finish();
	}
	/**
	 * Decode content
	 */
	static decode(data) {
		const proto = this.initProto();
		return proto.decode(data);
	}
	/**
	 * this function adds alternative getters and setters for the camel cased counterparts
	 * to the runtime message's prototype (i.e. without having to register a custom class):
	 */
	addVirtualCamelcaseFields(type) {
		// converts a string from underscore notation to camel case
		function toCamelCase(str) {
			return str.substring(0,1) + str.substring(1).replace(/_([a-z])(?=[a-z]|$)/g, function($0, $1) { return $1.toUpperCase(); });
		}
		// adds a virtual alias property
		function addAliasProperty(type, name, aliasName) {
			if (aliasName === name) return;
			Object.defineProperty(type.ctor.prototype, aliasName, {
				get: function() { return this[name]; },
				set: function(value) { this[name] = value; }
			});
		}
		type.fieldsArray.forEach(function(field) {
			addAliasProperty(type, field.name, toCamelCase(field.name));
		});
		type.oneofsArray.forEach(function(oneof) {
			addAliasProperty(type, oneof.name, toCamelCase(oneof.name));
		});
		return type;
	}
}

/**
 * Protocol Objects
 */
class protoKeyPair extends protocolDef {
	static _key = 'keyPair';
}
class protoKeyPub extends protocolDef {
	static _key = 'keyPub';
}
class protoKeyWrapped extends protocolDef {
	static _key = 'keyWrapped';
}
class protoProfileContent extends protocolDef {
	static _key = 'profileContent';
}
class protoProfile extends protocolDef {
	static _key = 'mainProfile';
}
class protoRelationRequest extends protocolDef {
	static _key = 'relationRequest';
}
class protoPendingAccount extends protocolDef {
	static _key = 'pendingAccount';
}
class protoSignedMessage extends protocolDef {
	static _key = 'signedMessage';
}
const eSignedMessageTypes = {
	'relation_request': 1
};

/* ------------------------------------------------------------------------------------ */

/**
 * Profile
 */
class Profile {
	#profile = null;
	/* */
	#keySym = null;
	#subProfile = null;
	#keys = null;
	/* */
	#updatedSubProfile = false;
	#updatedProfile = false;
	/**
	 *
	 */
	static getHeader() {
		return new Uint8Array([0x63, 0xAC, 0x50, 0xA0]);
	}
	/**
	 *
	 */
	create(object) {
		//
		this.#profile = object;
		//
		this.#keySym = null;
		this.#subProfile = null;
		this.#keys = null;
		this.#updatedSubProfile = false;
		this.#updatedProfile = false;
	}
	/**
	 *
	 */
	isLoaded() {
		return this.#profile !== null;
	}
	/**
	 * 
	 */
	async createNew(password, profileData=null, backuppwd=null) {
		// Generate main keys (AES + ECDSA.P-384), exportable
		const keySym = await cryptoHelper.generateAesGcm(true);
		const signKeyPair = await this.createKeyPair("sign");
		// Generate IV and Salt (96bits for AES-GCM)
		const iv = cryptoHelper.generateIV(12);
		// Wrapping the AES-GCM Sym Key
		const wrappedKey = await this.wrapKey(keySym, password);
		const wrappedBackupKey = backuppwd ? (await this.wrapKey(keySym, backuppwd)) : null;

		/* Storing data in our object */
		this.#subProfile = {
			sign_key: signKeyPair.proto,
			accounts: {},
			pendings: {},
		};
		if(profileData) {
			if(profileData.name)
				this.#subProfile.name = profileData.name;
			if(profileData.email)
				this.#subProfile.email = profileData.email;
			if(profileData.url)
				this.#subProfile.url = profileData.url;
		}
		this.#keys = {
			sign_key: {
				alg: signKeyPair.proto.alg,
				privatekey: signKeyPair.raw.privateKey,
				publickey: signKeyPair.raw.publicKey,
			},
			accounts: {}
		};
		// - duplication with [serializeSubProfile]
		const buffer = protoProfileContent.encode(this.#subProfile);
		const encodedKeys = await window.crypto.subtle.encrypt({
			name: "AES-GCM",
			iv: iv,
			tagLength: 128
		}, keySym, buffer);
		// Creation of our profile data
		this.#profile = {
			main_key: wrappedKey, // ArrayBuffer => Uint8Array
			backup_key: (wrappedBackupKey!==null) ? wrappedBackupKey : null,
			iv: iv,
			encoded: new Uint8Array(encodedKeys), // ArrayBuffer => Uint8Array
		};
		this.#updatedProfile = true;
		return true;
	}
	/**
	 *
	 */
	async wrapKey(keyToWrap, pwd) {
		/*
		algorithm: {…}
			length: 256
			name: "AES-GCM"
		extractable: true
		type: "secret"
		usages: (2) […]
			0: "encrypt"
			1: "decrypt"
			length: 2
		*/
		/* Prepare the output structure */
		let wrappedKey = {
			alg: keyToWrap.algorithm.name,
			key: null,
			derive_alg: 'AES-KW',
			derive_length: 256,
			derive_hash: 'SHA-256',
			salt: cryptoHelper.generateSalt(16),
			iterations: globalDefaults.iterations,
		};
		/* Create the AES KW Key */
		const wrappingKey = await cryptoHelper.getAesKw(pwd,
			wrappedKey.salt,
			{
				iterations: wrappedKey.iterations,
				length: wrappedKey.derive_length,
				hashAlgorithm: wrappedKey.derive_hash
			},
			false);
		/* Wrap the key */
		const key = await cryptoHelper.wrapKey(keyToWrap, wrappedKey.derive_alg, wrappingKey);
		wrappedKey.key = new Uint8Array(key);
		return wrappedKey;
	}
	/**
	 *
	 */
	async openWrappedKey(keyWrapped, pwd) {
		/* Validate parameters */
		if(!keyWrapped.alg) {
			console.error('openWrappedKey [No key algorithm]');
			return null;
		}
		if(!keyWrapped.salt) {
			console.error('openWrappedKey [Empty salt]');
			return null;
		}
		/* For the moment, only support AES KW */
		if(!keyWrapped.derive_alg || keyWrapped.derive_alg != 'AES-KW') {
			console.error('openWrappedKey [No wrapping algorithm or invalid value]', keyWrapped.derive_alg);
			return null;
		}
		if(!keyWrapped.iterations || keyWrapped.iterations < globals.minIterations) {
			console.error('openWrappedKey [No iteration or invalid value]', keyWrapped.iterations);
			return null;
		}
		if(!keyWrapped.derive_length || !(globals.aesLengths.includes(keyWrapped.derive_length))) {
			console.error('openWrappedKey [No derive key length or invalid value]', keyWrapped.derive_length);
			return null;
		}
		/* Create the AES KW (Key Wrapping) */
		const wrappingKey = await cryptoHelper.getAesKw(pwd,
			keyWrapped.salt,
			{
				iterations: keyWrapped.iterations,
				length: keyWrapped.derive_length,
				hashAlgorithm: keyWrapped.derive_hash
			},
			false);
		try {
			return cryptoHelper.unwrapKey(keyWrapped.key, keyWrapped.alg, wrappingKey);
		} catch(e) {
			console.error('openWrappedKey [unwrapKey]', e);
			return null;
		}
	}
	/**
	 * load a buffer into main _profile.
	 * After, need to open(password) to get the sub profile object.
	 */
	async load(buffer) {
		// checkHeader
		const header = Profile.getHeader();
		const bufferHeader = (buffer instanceof Blob) ? 
			new Uint8Array(await buffer.slice(0, 4).arrayBuffer()) :
			buffer.slice(0, header.byteLength);
		for(let i = 0; i < header.byteLength; i++) {
			if(header[i] !== bufferHeader[i]) {
				console.error("Incorrect header");
				return false;
			}
		}
		// Remove header from Buffer
		let content = buffer.slice(header.byteLength); // or subarray
		if(buffer instanceof  Blob) {
			content = new Uint8Array(await content.arrayBuffer());
		}
		// Decode the profile
		this.#profile = protoProfile.decode(content);
		return true;
	}
	/**
	 *
	 */
	async saveStorage() {
		if(!window.localStorage || !localStorage.setItem) {
			console.log('No localStorage available');
			return false;
		}
		const data = await this.serialize();
		if(data===false)
			return false;
		localStorage.setItem('profile', convertUint8arrayToBase64(data));
	}
	async importStorage() {
		if(!window.localStorage && !localStorage.getItem('profile')) {
			console.log('No localStorage available');
			return false;
		}
		const profileStorage = convertBase64ToUint8array(localStorage.getItem('profile'));
		return this.load(profileStorage);
	}
	/**
	 *
	 */
	async open(pwd) {
		if(this.#profile === null || this.#keySym !== null)
			return false;
		/* Dewrap the Symmetric key (AES-GCM by default) using the password*/
		this.#keySym = await this.openWrappedKey(this.#profile.main_key, pwd);
		return (this.#keySym !== null);
	}
	/**
	 *
	 */
	async getSubProfile() {
		if(this.#profile === null || this.#keySym === null)
			return false;
		if(this.#subProfile !== null)
			return this.#subProfile;
		/* decrypt SubProfile using the AES-GCM Sym Key (derived from PBKDF2) */
		/* TODO: Use structure variables for the Algorithm */
		const encodedKeys = await window.crypto.subtle.decrypt({
			name: "AES-GCM",
			iv: this.#profile.iv,
			tagLength: 128
		}, this.#keySym, this.#profile.encoded);
		/* */
		try {
			this.#subProfile = protoProfileContent.decode(new Uint8Array(encodedKeys));
		} catch(e) {
			console.error("Error decoding profile data", e);
			this.#subProfile = null;
			this.#keys = null;
			return false;
		}
		/* */
		this.#keys = {
			sign_key: {
				/* TODO: Use structure variables for the Algorithm */
				alg: "ECDSA.P-384",
				privatekey: null,
				publickey: null
			},
			accounts: {}
		};
		try {
			/* TODO: Use structure variables for the Algorithm */
			// Loading private key
			this.#keys.sign_key.privatekey = await window.crypto.subtle.importKey(
				"pkcs8", this.#subProfile.sign_key.privatekey,
				{ name: "ECDSA", namedCurve: "P-384" }, true, ["sign"]);
			// Loading public key
			this.#keys.sign_key.publickey = await window.crypto.subtle.importKey(
				"raw", this.#subProfile.sign_key.publickey,
				{ name: "ECDSA", namedCurve: "P-384" }, true, ["verify"]);
		} catch(e) {
			console.error("Error loading keys", e);
			this.#subProfile = null;
			this.#keys = null;
			return false;
		}
		/* */
		return this.#subProfile;
	}
	/**
	 *
	 */
	updateSubProfile(payload) {
		// Incorrect context
		if(this.#profile === null || this.#keySym === null || this.#subProfile === null)
			return false;
		this.#subProfile = payload;
		this.#updatedSubProfile = true;
		return true;
	}
	/**
	 *
	 */
	async #serializeSubProfile() {
		// Incorrect context
		if(this.#profile === null || this.#subProfile === null || this.#keySym === null)
			return false;
		// Nothing to do
		if(this.#updatedSubProfile == false)
			return false;
		/* */
		const buffer = protoProfileContent.encode(this.#subProfile);
		const iv = cryptoHelper.generateIV(12);
		let encodedKeys = null;
		try {
			/* TODO: Use structure variables for the Algorithm */
			encodedKeys = await window.crypto.subtle.encrypt({
				name: "AES-GCM",
				iv: iv
			}, this.#keySym, buffer);
		} catch(e) {
			console.error(e);
			return false;
		}
		if(!encodedKeys) {
			console.log('no encodedKeys', encodedKeys, this.#keySym, buffer);
		}
		/* */
		this.#profile.encoded = new Uint8Array(encodedKeys);
		this.#profile.iv = iv;
		this.#updatedSubProfile = false;
		this.#updatedProfile = true;
		return true;
	}
	/**
	 *
	 */
	async serialize() {
		// Incorrect context
		if(this.#profile === null)
			return false;
		// Nothing to do
		if(this.#updatedSubProfile !== false) {
			// Update the profile
			await this.#serializeSubProfile();
		}
		// Encode data
		const header = Profile.getHeader();
		const buffer = protoProfile.encode(this.#profile);
		return new Uint8Array([...header, ...buffer]);
	}
	/**
	 * Create a Proto KeyPair (ECDSA or ECDH), exportable (and exported) by design
	 */
	async createKeyPair(mode="sign") {
		let keyPair, alg;
		if(mode == "sign") {
			/* TODO: Use structure variables for the Algorithm */
			alg = "ECDSA.P-384";
			keyPair = await cryptoHelper.generateEcdsa(true);
		} else { // "dh"
			/* TODO: Use structure variables for the Algorithm */
			alg = "ECDH.P-384";
			keyPair = await cryptoHelper.generateEcdh(true);
		}
		const uuidKey = cryptoHelper.randomUUID();
		const exportPub = await window.crypto.subtle.exportKey("raw", keyPair.publicKey);
		const exportPriv = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
		//
		const creationDate = new Date();
		let expirationDate = creationDate;
		expirationDate.setDate(expirationDate.getDate() + Number(globalDefaults.keysDaysLifetime));

		const ret = protoKeyPair.create({
			uid: uuidKey,
			alg: alg,
			publickey: new Uint8Array(exportPub),
			publickey_format: 0,
			privatekey: new Uint8Array(exportPriv),
			privatekey_format: 0,
			creation_date: creationDate.toISOString(),
			expiration_date: expirationDate.toISOString()
		});
		return {
			proto: ret,
			raw: keyPair
		};
	}
	/**
	 *
	 */
	getKeyPubFromKeyPair(keyPair) {
		const protoKeyPair = keyPair.proto ? keyPair.proto : keyPair;
		const data = {
			uid: protoKeyPair.uid,
			alg: protoKeyPair.alg,
			publickey: protoKeyPair.publickey
		};
console.log('getKeyPubFromKeyPair data', data);
		if(keyPair.params)
			data.params = keyPair.params;
		if(keyPair.length)
			data.length = keyPair.length;
		if(keyPair.publickey_format)
			data.publickey_format = keyPair.publickey_format;
		const ret = protoKeyPub.create(data);
console.log('getKeyPubFromKeyPair ret', ret);
		return {
			proto: ret,
			raw: keyPair.raw.publicKey
		};
	}
	/**
	 *
	 */
	async createRequest(receiver, nickname, url, email=null, shortMessage=null) {
		const keyPair = await this.createKeyPair("dh");
		const keyPub = this.getKeyPubFromKeyPair(keyPair);
		//
		const uuid = cryptoHelper.randomUUID();
		const now = new Date().toISOString();
		const salt = cryptoHelper.generateSalt(24);
		//
		const data = {
			nickname: nickname,
			url: url,
			uid: uuid,
			date: now,
			public_dh_key: keyPub.proto,
			hkdf_salt: salt
		};
		if(email) data.email = email;
		if(shortMessage) data.short_message = shortMessage;
		const object = protoRelationRequest.create(data);
		//
console.log('createRequest object', object);
		const pendingAccountObject = protoPendingAccount.create({
			receiver: receiver,
			request: object,
			key: keyPair.proto
		});
console.log('createRequest pendingAccountObject', pendingAccountObject);
		return {
			request: object,
			pending: pendingAccountObject,
			privateKey: keyPair.raw.privateKey
		};
	}
	getPublicSignKey(mode=null) {
		if(!this.#keys || !this.#keys.sign_key || !this.#keys.sign_key.publickey)
			return false;
		return this.#keys.sign_key.publickey;
	}
	/**
	 *
	 */
	async signMessage(msg, keyPair=null) {
		let exportPub = null;
		if(!keyPair) {
			// Handle error
			if(!this.#keys || !this.#keys.sign_key || !this.#keys.sign_key.privatekey)
				return false;
			// Get profile signature keys
			keyPair = {
				alg: this.#keys.sign_key.alg,
				privatekey: this.#keys.sign_key.privatekey,
				publickey: this.#keys.sign_key.publickey
			};
			exportPub = this.#subProfile.sign_key.publickey;
		} else {
			exportPub = await window.crypto.subtle.exportKey("raw", keyPair.publicKey);
		}
console.log('SignMessage msg', msg);
		// Generate the Signature
		const encodedMsg = protoRelationRequest.encodeObj(msg);
		/* TODO: Use structure variables for the Algorithm */
		const signedMsg = await window.crypto.subtle.sign(
			{"name": "ECDSA", "hash": {"name": "SHA-512"}},
			keyPair.privatekey,
			encodedMsg
		);
		const pubKey = {
			uid: (keyPair) ? keyPair.uid : '',
			alg: (keyPair) ? keyPair.alg : this.#keys.sign_key.alg,
			publickey: new Uint8Array(exportPub),
			publickey_format: 'RAW'
		};
		// Create data
		const data = {
			/* relation: msg, */
			message_type: eSignedMessageTypes.relation_request,
			message: encodedMsg,
			//
			signature_data: new Uint8Array(signedMsg), // ArrayBuffer => Uint8Array
			public_key: pubKey,
			sign_alg: "ECDSA.P-384.SHA-512",
			// identity_ref
		};
console.log('SignMessage data', data);
		const signed = protoSignedMessage.encode(data);
		return signed;
	}
	/**
	 *
	 */
	async openSignedMessage(data, keyPub=null) {
		let ret;
		try {
			ret = protoSignedMessage.decode(new Uint8Array(data));
		} catch(e) {
			console.error("Error decoding signed message data", e);
			return false;
		}
		// Import the declared public key
		/* TODO: Use structure variables for the Algorithm
		 * ret.public_key.publickey_format
		 * ret.public_key.alg */
		const publicKey = await window.crypto.subtle.importKey(
			"raw", ret.public_key.publickey,
			{ name: "ECDSA", namedCurve: "P-384" }, false, ["verify"]);
/*
		// Re-encode the message, which was decoded by its parent
		const encodedMsg = protoRelationRequest.encodeObj(ret.message);
*/
		// Perfom the verification
		/* TODO: Use structure variables for the Algorithm */
		const verify = await window.crypto.subtle.verify(
			{"name": "ECDSA", "hash": {"name": "SHA-512"}},
			publicKey,
			ret.signature_data,
			ret.message /* encodedMsg */
		);
		if(!verify) {
			console.error("Invalid signature");
			return false;
		}
		ret.raw_message = ret.message;
		ret.message = null;
		switch(ret.message_type) {
			case eSignedMessageTypes.relation_request:
				ret.message = protoRelationRequest.decode(ret.raw_message);
				break;
			default:
				break;
		}
		return ret;
	}
	/**
	 *
	 */
	listAccounts() {
		if(this.#profile === null || this.#subProfile === null)
			return false;
		return Object.keys(this.#subProfile.accounts);
	}
	/**
	 *
	 */
	getAccounts() {
		if(this.#profile === null || this.#subProfile === null)
			return false;
		return this.#subProfile.accounts || {};
	}
	/**
	 *
	 */
	getAccount(id) {
		if(this.#profile === null || this.#subProfile === null)
			return false;
		return this.#subProfile.accounts[id] || false;
	}
	/**
	 *
	 */
	addAccount(id, payload) {
		// Incorrect context
		if(this.#profile === null || this.#subProfile === null)
			return false;
		// Nothing to do
		if(this.#subProfile.accounts[id] !== undefined)
			return false;
		/* */
		this.#subProfile.accounts[id] = payload;
		this.#updatedSubProfile = true;
		return true;
	}
	/**
	 *
	 */
	setAccount(id, payload) {
		// Incorrect context
		if(this.#profile === null || this.#subProfile === null)
			return false;
		// Nothing to do
		if(this.#subProfile.accounts[id] === undefined)
			return false;
		/* */
		this.#subProfile.accounts[id] = payload;
		this.#updatedSubProfile = true;
		return true;
	}
	/**
	 *
	 */
	listPendings() {
		if(this.#profile === null || this.#subProfile === null)
			return false;
		return Object.keys(this.#subProfile.pendings);
	}
	/**
	 *
	 */
	getPendings() {
		if(this.#profile === null || this.#subProfile === null)
			return false;
		return this.#subProfile.pendings || {};
	}
	/**
	 *
	 */
	getPending(id) {
		if(this.#profile === null || this.#subProfile === null)
			return false;
		return this.#subProfile.pendings[id] || false;
	}
	/**
	 *
	 */
	addPending(id, payload) {
		// Incorrect context
		if(this.#profile === null || this.#subProfile === null)
			return false;
		// Nothing to do
		if(this.#subProfile.pendings[id] !== undefined)
			return false;
		/* */
		this.#subProfile.pendings[id] = payload;
		this.#updatedSubProfile = true;
		return true;
	}
	/**
	 *
	 */
	removePending(id) {
		// Incorrect context
		if(this.#profile === null || this.#subProfile === null)
			return false;
		// Nothing to do
		if(this.#subProfile.pendings[id] === undefined)
			return false;
		/* */
		delete this.#subProfile.pendings[id];
		this.#updatedSubProfile = true;
		return true;
	}
	/**
	 *
	 */
	upgradePending(id, payload) {
		// Incorrect context
		if(this.#profile === null || this.#subProfile === null)
			return false;
		// No pending to upgrade
		if(this.#subProfile.pendings[id] === undefined)
			return false;
		// Account already there
		if(this.#subProfile.accounts[id] !== undefined) {
			// TODO : Should we remove the pending ?
			return false;
		}
		/* */
		this.#subProfile.accounts[id] = payload;
		delete this.#subProfile.pendings[id]
		this.#updatedSubProfile = true;
		return true;
	}
}

/* ------------------------------------------------------------------------------------ */
