/**
 * Console OUT
 * Help function for debug
 */
console.out = function(...args) {
	let out = document.getElementById('output');
	if(!out) {
		if(typeof args[0] === 'object' && args[0] instanceof Date)
			args.shift();
		console.log(...args);
		return;
	}
	const scrollDown = (out.scrollTopMax == out.scrollTop);
	let i = 0;
	args.forEach((a) => {
		if(i++ == 0 && typeof a === 'object' && a instanceof Date) {
			out.innerHTML += a.toLocaleTimeString() + ((args.length > 1) ? ' - ' : '<br/>');
			return;
		}
		if(typeof a === 'object')
			out.innerHTML += JSON.stringify(a);
		else
			out.innerHTML += a;
		out.innerHTML += '<br/>';
	});
	if(scrollDown && out.scrollTopMax > 0)
		out.scrollTop = out.scrollTopMax;
};

/**
 * Clipboard management
 */
const isClipboard = (navigator && navigator.clipboard && navigator.clipboard.writeText);
function copyClipboard(el, name) {
	if(!isClipboard) return false;
	try {
		navigator.clipboard.writeText(el.value);
		if(name)
			console.out(new Date(), "Field '" + name + "' copied");
		else
			console.out(new Date(), "Field copied");
	} catch(e) {
		console.out(new Date(), "Cannot copy to clipboard");
	}
}
function handleClipboardData(el) {
	if(!el) return false;
	if(el.target) el = el.target;
	el.blur();
	let target = el.getAttribute('data-clipboard');
	let name = el.getAttribute('data-clipboard-name') || null;
	if(target.substring(0,1) == '#')
		target = document.getElementById(target.substring(1));
	else
		target = document.querySelector(target);
	if(target)
		copyClipboard(target, name);
	return false;
}

/**
 * Utils
 */
function wrapText(buffer, len) {
	if(buffer.length <= len)
		return buffer;
	let l = 0;
	let buf = buffer.substring(l, l+len);
	l += len;
	while(l < buffer.length) {
		buf += "\r\n" + buffer.substring(l, l+len);
		l += len;
	}
	return buf;
}
function unwrapText(buffer) {
	return buffer.replace(/[\n\r]+/g, "");
}

/**
 * Main variables and constants
 */
let g_profile = new Profile();
let g_modals = {};
//
const g_size_bigtextarea = 100;
const g_size_smalltextarea = 48;

/**
 * Generate Profile
 */
const fctGenerateProfile = async(el) => {
	if(el && el.target) el.target.blur();

	if(g_profile.isLoaded()) {
		if(!window.confirm("Profile already exist, create a new one?"))
			return false;
	}
	const tmpPassword = window.prompt("Enter password", "");
	if(!tmpPassword)
		return false;
	if(tmpPassword.length < 4) {
		alert('password too small');
		return false;
	}

	const confirmPassword = window.prompt("Confirm password", "");
	if(tmpPassword != confirmPassword) {
		console.out(new Date(), 'Invalid password confirmation.');
		return false;
	}

	let profileData = {};
	let input = document.getElementById('input_profile_name');
	if(input) profileData.name = input.value;
	input = document.getElementById('input_profile_email');
	if(input) profileData.email = input.value;
	input = document.getElementById('input_profile_url');
	if(input) profileData.url = input.value;

	console.out(new Date(), 'Generating...');
	
	g_profile = new Profile();
	let ret = await g_profile.createNew(tmpPassword, profileData);
	g_profile.saveStorage();
	
	console.out(new Date(), 'New profile generated');
	
	const area_profile = document.getElementById('area_profile');
	if(area_profile) {
		const profile_data = await g_profile.serialize();
		area_profile.value = wrapText(convertUint8arrayToBase64(profile_data), g_size_bigtextarea);
	}
	
	const area_public_key = document.getElementById('area_public_key');
	if(area_public_key) {
		const subProfile = await g_profile.getSubProfile();
		const exportPub = await window.crypto.subtle.exportKey("spki", g_profile.getPublicSignKey());
		area_public_key.value = '-----BEGIN PUBLIC KEY BLOCK-----' + "\r\n" +
			wrapText(convertArraybufferToBase64(exportPub), g_size_smalltextarea) + "\r\n" +
			'-----END PUBLIC KEY BLOCK-----';
	}
};
/**
 * Open loaded profile
 */
const _OpenProfile = async() => {
	// Check the profile
	if(!g_profile || g_profile === null || !g_profile.isLoaded()) {
		console.error('No loaded profile to open');
		return false;
	}
	// Get the password
	const tmpPassword = window.prompt("Enter password", "");
	if(!tmpPassword)
		return false;
	if(tmpPassword.length < 4) {
		alert('password too small');
		return false;
	}
	//
	ret = await g_profile.open(tmpPassword);
	if(!ret) {
		console.out(new Date(), "Error while opening profile");
		return false;
	}
	const subProfile = await g_profile.getSubProfile();

	console.out(new Date(), 'Profile loaded');
	const area_public_key = document.getElementById('area_public_key');
	if(area_public_key) {
		let exportPub = await window.crypto.subtle.exportKey("spki", g_profile.getPublicSignKey());
		area_public_key.value = '-----BEGIN PUBLIC KEY BLOCK-----' + "\r\n" +
			wrapText(convertArraybufferToBase64(exportPub), g_size_smalltextarea) + "\r\n" +
			'-----END PUBLIC KEY BLOCK-----';
	}
	const pendingList = g_profile.getPendings();
	if(pendingList) {
		const pendingrequests_list = document.getElementById('pendingrequests_list');
		if(pendingrequests_list) {
			Object.values(pendingList).forEach(req => {
				let opt = document.createElement('option');
				opt.value = req.request.uid;
				opt.text = req.receiver + ' (' + req.request.date + ')';
				pendingrequests_list.add(opt);
			});
		}
	}

	let input = document.getElementById('input_profile_name');
	if(input) input.value = subProfile.name ?? '';
	input = document.getElementById('input_profile_email');
	if(input) input.value = subProfile.email ?? '';
	input = document.getElementById('input_profile_url');
	if(input) input.value = subProfile.url ?? '';

	const indicator = document.getElementById('profile_loaded_indicator');
	if(indicator) indicator.style.display = '';

	g_profile.saveStorage();
	return g_profile;
};
/**
 * Load Profile
 */
const fctLoadProfile = async(el) => {
	if(el && el.target) el.target.blur();
	//
	const area_profile = document.getElementById('area_profile');
	if(!area_profile) {
		console.out(new Date(), 'Nothing to load');
		return false;
	}
	const areaProfile = unwrapText(area_profile.value);
	const payload = convertBase64ToUint8array(areaProfile);
	//
	g_profile = new Profile();
	let ret = await g_profile.load(payload);
	if(!ret)
		return false;
	return _OpenProfile();
};
/**
 * Download Profile
 */
const fctDownloadProfile = async(el) => {
	if(el && el.target) el.target.blur();

	if(!g_profile || g_profile === null)
		return false;
	
	const buffer = await g_profile.serialize();
	if(buffer === false)
		return false;

	const b = new Blob([buffer], {type: "application/octet-stream"});
	const tmpA = document.createElement('a');
	tmpA.href = window.URL.createObjectURL(b);
	tmpA.download = "profile.bin";
	tmpA.click();
	return false;
};
/**
 * Add Account - TODO
 */
const fctAddAccount = async(el) => {
	if(el && el.target) el.target.blur();
	
	if(!g_profile || g_profile === null)
		return false;

	const area_account_key = document.getElementById('area_account_key');
	if(!area_account_key)
		return false;
		
	const buffer = area_account_key.value;
	const public_key = extractBeginEnd(buffer);

	return false;
};
/**
 * Open Popup for Creation of new Relation Request
 */
const fctOpenCreateRelationRequest = async(el) => {
	if(el && el.target) el.target.blur();
	if(!g_profile.isLoaded())
		return false;
	/* Creation of the modal */
	if(!g_modals.createRequest) {
		const options = {};
		g_modals.createRequest = new bootstrap.Modal(document.getElementById('modal-create-request'), options);
	}
	/* Display of the modal */
	g_modals.createRequest.show();
	return false;
};
/**
 * Create Relation Request
 */
const fctCreateRelationRequest = async(el) => {
	if(el && el.target) el.target.blur();
	//
	if(!g_profile || g_profile === null)
		return false;

	const area_relation_request = document.getElementById('area_relation_request');
	const area_relation_private_request = document.getElementById('area_relation_private_request');
	if(!area_relation_request || !area_relation_private_request)
		return false;

	if(!g_profile.isLoaded()) {
		console.out(new Date(), "Can't create relation requestion ; Profile not loaded")
		return false;
	}

	// Empty old request
	area_relation_request.value = '';
	area_relation_private_request.value = '';

	//
	let input = document.getElementById('input_relation_request_receiver');
	const receiver = input ? input.value.trim() : '';
	//
	input = document.getElementById('input_relation_request_nickname');
	if(!input || input.value.trim() == '')
		input = document.getElementById('input_profile_name');
	const nickname = input ? input.value.trim() : '';
	//
	input = document.getElementById('input_profile_url');
	const url = input ? input.value.trim() : '';

	// Create Request
	const req = await g_profile.createRequest(receiver, nickname, url);
	if(req === false) {
		console.out(new Date(), "Error during creation of the request");
	}
	const signedMsg = await g_profile.signMessage(req.request);

	area_relation_request.value = '-----BEGIN SIGNED MESSAGE BLOCK-----' + "\r\n" +
		wrapText(convertArraybufferToBase64(signedMsg), g_size_smalltextarea) + "\r\n" +
		'-----END SIGNED MESSAGE BLOCK-----';
	const exportPending = protoPendingAccount.encodeObj(req.pending);
	area_relation_private_request.value = '-----BEGIN PENDING ACCOUNT-----'  + "\r\n" + 
		wrapText(convertArraybufferToBase64(exportPending), g_size_smalltextarea) + "\r\n" +
		'-----END PENDING ACCOUNT-----';
	return false;
};
/**
 * Utiliy function
 */
const addRelationRequestToProfile = async() => {
	//
	if(!g_profile || g_profile === null)
		return false;

	const area_received_relation_request = document.getElementById('area_received_relation_request');
	if(!area_received_relation_request)
		return false;

	const request = convertBase64ToUint8array(extractBeginEnd(area_received_relation_request.value));
	if(request === false) {
		console.out(new Date(), "Add request into profile - Invalid data");
		return false;
	}

	const signed_msg = await g_profile.openSignedMessage(request);
	if(signed_msg === false) {
		return false;
	}
	if(signed_msg.message_type != eSignedMessageTypes.relation_request) {
		return false;
	}

	// Work in progress
	console.log(signed_msg);
/*
	const pendingAccount = protoPendingAccount.decode(request);
console.log('pendingAccount', pendingAccount);

	const ret = g_profile.addPending(pendingAccount.request.uid, pendingAccount);
	console.out(new Date(), "Adding pending account '" + pendingAccount.receiver + "' - " + (ret?"Ok":"Error"));
	if(!ret)
		return false;
	
	const pendingrequests_list = document.getElementById('pendingrequests_list');
	if(pendingrequests_list) {
		let opt = document.createElement('option');
		opt.value = pendingAccount.request.uid;
		opt.text = pendingAccount.receiver + ' (' + pendingAccount.request.date + ')';
		pendingrequests_list.add(opt);
	}
	
	await g_profile.saveStorage();
	const profile_data = await g_profile.serialize();
	const area_profile = document.getElementById('area_profile');
	if(area_profile) area_profile.value = wrapText(convertArraybufferToBase64(profile_data), g_size_bigtextarea);
*/
	return true;
};
/**
 *
 */
const fctDeleteSelectedRequest = async(el) => {
	if(el && el.target) el.target.blur();
	if(!g_profile.isLoaded())
		return false;
	const pendingrequests_list = document.getElementById("pendingrequests_list");
	if(!pendingrequests_list || pendingrequests_list.selectedOptions.length != 1)
		return false;
	const selOpt = pendingrequests_list.selectedOptions[0];
	if(g_profile.removePending(selOpt.value) === false)
		return false;
	/* Removing the data and serialize */
	pendingrequests_list.removeChild(selOpt);
	await g_profile.saveStorage();
	const profile_data = await g_profile.serialize();
	const area_profile = document.getElementById('area_profile');
	if(area_profile) area_profile.value = wrapText(convertArraybufferToBase64(profile_data), g_size_bigtextarea);
	return true;
};
/**
 *
 */
const fctFinalizeCreateRelationRequest = async(el) => {
	if(el && el.target) el.target.blur();
	let ret = await addRelationRequestToProfile();
	if(g_modals.createRequest)
		g_modals.createRequest.hide();
	return false;
};
/**
 * Add Relation Request to Profile
 */
const fctAddRelationRequestToProfile = async(el) => {
	if(el && el.target) el.target.blur();
	await addRelationRequestToProfile();
	return false;
};
/**
 *
 */
const fctOpenReceiveRequest = async(el) => {
	if(el && el.target) el.target.blur();
	if(!g_profile.isLoaded())
		return false;
	/* Creation of the modal */
	if(!g_modals.acceptRequest) {
		const options = {};
		g_modals.acceptRequest = new bootstrap.Modal(document.getElementById('modal-accept-request'), options);
	}
	/* Display of the modal */
	g_modals.acceptRequest.show();
	return false;
};
/**
 *
 */
const fctDecodeReceivedRequest = async(el) => {
	if(el && el.target) el.target.blur();
	if(!g_profile.isLoaded())
		return false;

	const request_area = document.getElementById('area_received_relation_request');
	if(!request_area)
		return false;

	const request = convertBase64ToUint8array(extractBeginEnd(request_area.value));
	const signed_msg = await g_profile.openSignedMessage(request);
	if(signed_msg === false) {
		return false;
	}
	if(signed_msg.message_type != eSignedMessageTypes.relation_request) {
		return false;
	}

	const fields = document.querySelectorAll('#modal-accept-request dd[data-field]');
	fields.forEach((item) => {
		const attr = item.getAttribute('data-field');
		switch(attr) {
			case 'date':
				item.innerHTML = signed_msg.message.date;
				break;
			case 'uid':
				item.innerHTML = signed_msg.message.uid;
				break;
			case 'identity':
				item.innerHTML = signed_msg.message.nickname;
				break;
			case 'alg':
				item.innerHTML = signed_msg.message.public_dh_key.alg;
				break;
		}
	});
	// signed_msg.message

	return false;
};
/**
 * Update Profile
 */
const fctUpdateProfile = async(el) => {
	if(el && el.target) el.target.blur();
	if(!g_profile.isLoaded())
		return false;
	const inputs = document.querySelectorAll('input[data-profile]');
	if(inputs.length == 0)
		return false;
	const subProfile = await g_profile.getSubProfile();
	inputs.forEach((item) => {
		let attr = item.getAttribute('data-profile');
		subProfile[attr] = item.value.trim();
	});
	g_profile.updateSubProfile(subProfile);
	await g_profile.saveStorage();
	const buffer = await g_profile.serialize();
	const area_profile = document.getElementById('area_profile');
	if(area_profile) area_profile.value = wrapText(convertArraybufferToBase64(buffer), g_size_bigtextarea);
	fctInputProfileChange(false);
	console.out(new Date(), "Profile updated");
	return false;
};
/**
 * Import Storage
 */
const fctImportStorage = async(el) => {
	if(el && el.target) el.target.blur();

	if(g_profile.isLoaded()) {
		if(!window.confirm("Profile already exist, create a new one?"))
			return false;
	}
	await g_profile.importStorage();
	//
	const area_profile = document.getElementById('area_profile');
	const buffer = await g_profile.serialize();
	if(area_profile) {
		area_profile.value = wrapText(convertArraybufferToBase64(buffer), g_size_bigtextarea);
	}
	console.out(new Date(), "Profile imported (not loaded)");
	await _OpenProfile();
	return false;
};
/**
 *
 */
const _fctShowSelectedRequest = async(entry, full) => {
	if(!g_profile.isLoaded())
		return false;
	const selReq = g_profile.getPending(entry);
	
	const container = document.getElementById('selected_pending_request');
	if(!container)
		return false;
	container.innerHTML = '';
	
	const dt = '<dt class="col-sm-3">';
	const edt = '</dt>';
	const dd = '<dd class="col-sm-9">';
	const edd = '</dd>';
	let content = dt+'Date'+edt+
		dd + selReq.request.date + edd+
		dt+'Receiver'+edt+
		dd + (selReq.receiver || '<em>None</em>') + edd+
		dt+'UID'+edt+
		dd + selReq.request.uid + edd+
		dt+'Nickname'+edt+
		dd + (selReq.request.nickname || '<em>None</em>') + edd+
		dt+'Alg'+edt+
		dd + selReq.request.public_dh_key.alg + edd+
		dt+'UID Key'+edt+
		dd + selReq.request.public_dh_key.uid + edd;
	if(full) {
		const signedMsg = await g_profile.signMessage(selReq.request);
		content += dt+'Request'+edt+
			dd + '<textarea class="form-control" disabled="disabled" style="height:160px;">'+
				'-----BEGIN SIGNED MESSAGE BLOCK-----' + "\r\n" +
				wrapText(convertArraybufferToBase64(signedMsg), g_size_smalltextarea) + "\r\n" +
				'-----END SIGNED MESSAGE BLOCK-----' + '</textarea>' + edd;
	}
	container.innerHTML = content;
	return true;
};
/**
 * Show Selected Request
 */
const fctShowSelectedRequest = async(el) => {
	if(el && el.target) el.target.blur();
	if(!g_profile.isLoaded())
		return false;
	const pendingrequests_list = document.getElementById("pendingrequests_list");
	if(!pendingrequests_list || pendingrequests_list.selectedOptions.length != 1)
		return false;
	const selOpt = pendingrequests_list.selectedOptions[0];
	_fctShowSelectedRequest(selOpt.value, false);
	return false;
};
/**
 *
 */
const fctResendSelectedRequest = async(el) => {
	if(el && el.target) el.target.blur();
	if(!g_profile.isLoaded())
		return false;
	const pendingrequests_list = document.getElementById("pendingrequests_list");
	if(!pendingrequests_list || pendingrequests_list.selectedOptions.length != 1)
		return false;
	const selOpt = pendingrequests_list.selectedOptions[0];
	_fctShowSelectedRequest(selOpt.value, true);
	return false;
};
/**
 *
 */
const fctConfirmSelectedRequest = async(el) => {
	if(el && el.target) el.target.blur();
	if(!g_profile.isLoaded())
		return false;
	/* Creation of the modal */
	if(!g_modals.confirmRequest) {
		const options = {};
		g_modals.confirmRequest = new bootstrap.Modal(document.getElementById('modal-confirm-request'), options);
	}
	/* Display of the modal */
	g_modals.confirmRequest.show();
	return false;
};
/**
 *
 */
const fctFinalizeSelectedRequest = async(el) => {
	if(el && el.target) el.target.blur();
	if(!g_profile.isLoaded())
		return false;

	const finalizeArea = document.querySelector('[data-area="confirm-request-area"]');
	if(!finalizeArea)
		return false;

	if(!finalizeArea.value)
		return false;

	if(g_modals.confirmRequest)
		g_modals.confirmRequest.hide();
	return false;
};
/**
 *
 */
const fctPendingRequestChange = async(el) => {
	const container = document.getElementById('selected_pending_request');
	if(!container) return;
	container.innerHTML = '';
};
/**
 *
 */
const fctInputProfileChange = async(event) => {
	let attr = event ? event.target.getAttribute('data-profile') : null;
	if(event && !attr) return;
	const upd = document.getElementById('div_update_profile');
	if(!upd) return;
	const subProfile = await g_profile.getSubProfile();
	/* */
	if(event && event.target.value.trim() != (subProfile[attr] || '')) {
		upd.style.display='';
		return;
	} else if(event && upd.style.display=='none')
		return;
	/* */
	let s = 'none';
	const inputs = document.querySelectorAll('input[data-profile]');
	for(item of inputs) {
		if(event && item == event.target)
			continue;
		let attr = item.getAttribute('data-profile');
		if(item.value.trim() != (subProfile[attr] || '')) {
			s = '';
			break;
		}
	}
	upd.style.display = s;
};

/**
 * Init Buttons
 */
function initButtons() {
	/* Initialize Buttons */
	const buttonsFcts = {
		"generate": fctGenerateProfile,
		"load": fctLoadProfile,
		"download": fctDownloadProfile,
		"update-profile": fctUpdateProfile,
		"store": fctImportStorage,
		"add-account": fctAddAccount, // TODO
		"open-create-request": fctOpenCreateRelationRequest,
		"create-relation-request": fctCreateRelationRequest,
		"finalize-new-request": fctFinalizeCreateRelationRequest,
		// "add-relation-request": fctAddRelationRequestToProfile,
		"open-receive-request": fctOpenReceiveRequest,
		"decode-received-request": fctDecodeReceivedRequest,
		"show-sel-request": fctShowSelectedRequest,
		"resend-sel-request": fctResendSelectedRequest,
		"confirm-sel-request": fctConfirmSelectedRequest, // In Progress
		"finalize-sel-request": fctFinalizeSelectedRequest, // In Progress
		"delete-sel-request": fctDeleteSelectedRequest, // In Progress
		"profilecopy": null, // Nothing to do
	};
	const lstFcts = {
		"pendingrequests": fctPendingRequestChange
	};
	let buttons = document.querySelectorAll('button[data-btn], a[data-btn]');
	buttons.forEach((item) => {
		let attr = item.getAttribute("data-btn");
		if(!buttonsFcts[attr]) return;
		if(item.nodeName == 'A') {
			item.addEventListener('click', (evt) => { buttonsFcts[attr](evt); evt.preventDefault(); return false; });
		} else
			item.addEventListener('click', buttonsFcts[attr]);
	});
	let lsts = document.querySelectorAll('select[data-lst]');
	lsts.forEach((item) => {
		let attr = item.getAttribute('data-lst');
		if(!lstFcts[attr]) return;
		item.addEventListener('change', lstFcts[attr]);
	});
	/* Special case for LocalStorage */
	if(window.localStorage && localStorage.getItem('profile')) {
		buttons = document.querySelectorAll('button[data-btn="store"]');
		buttons.forEach((item) => { item.classList.remove('disabled'); });
	}
	/* Initialize TextAreas */
	let areas = document.querySelectorAll('textarea[data-area]');
	areas.forEach((item) => {
		item.value = "";
	});
	/* Initialize Inputs */
	let inputs = document.querySelectorAll('input[data-profile]');
	inputs.forEach((item) => {
		item.addEventListener('change', fctInputProfileChange);
		item.addEventListener('keyup', fctInputProfileChange);
	});
	/* Clipboard */
	buttons = document.querySelectorAll('button[data-clipboard]');
	if(isClipboard) {
		buttons.forEach((item) => { item.addEventListener('click', handleClipboardData); });
	} else {
		buttons.forEach((item) => { item.classList.add('disabled'); });
	}
}

/**
 * Main
 */
console.out(new Date(), "Initialization...");
initButtons();
console.out(new Date(), "Ready!");
