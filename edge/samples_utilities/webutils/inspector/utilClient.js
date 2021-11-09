var xmlhttp;
var authtoken;
var baseurl;
var inspections
const persist = ['warn', 'error'];

document.addEventListener('DOMContentLoaded', function () {
	init();
});

/*
*
*	Session Management functions
*
*/
var sessionUrl;

function login() {
	user = document.getElementById("userid").value;
	password = document.getElementById("pwd").value;
	url = baseurl + "users/sessions"
	body = {
		"grant_type": "password",
		"username": user,
		"password": password
	}
	sendRequest(url, "POST", body, null, null, function () {
		if (xmlhttp.readyState == 4) {
			if (xmlhttp.status == 200) {
				resp = JSON.parse(xmlhttp.responseText);
				authtoken = resp.token;
				UX_setLoggedIn();
				subscribeEvents();
				UX_flashsuccess("Logged In");
				getInspections()
			} else {
				UX_flasherror("Login Failed");
			}
		}
	});
}


function logout() {
	url = baseurl + "users/sessions"
	sendRequest(url, "DELETE", null, null, null, function () {
		if (xmlhttp.readyState == 4) {
			if (xmlhttp.status == 200) {
				UX_setLoggedOut();
				unsubscribeEvents();
				UX_flashsuccess("Logged Out")
			} else {
				UX_flasherror("Logout Failed")
			}
		}
	}, null, null);
}

/*
*
* Status
*
*/

function subscribeEvents() {
	if (!window.EventSource) {
		alert("EventSource is not enabled in this browser");
		return;
	}
	//source = new EventSource('/api/v1/system/events', { authorizationHeader: "Bearer ..." });
	source = new EventSourcePolyfill('/api/v1/system/events', {
		headers: {
			'mvie-controller': authtoken
		}
	});
	source.addEventListener("message", function (e) {
		message = JSON.parse(e.data)
		statusmsg = message.source + ":" + message.category + ":" + message.id + ":" + message.message
		if (persist.includes(message.severity)) {
			UX_flash(statusmsg, message.severity)
		} else {
			UX_flash(statusmsg, message.severity, 5000)
		}
		if (message.category.startsWith("batch")) {
			if (message.severity == "success") {
				finishedJobs.push(message.id);
			}
		}
	});
	source.addEventListener("ping", function (e) {
		pingwaslast = true;
	});
}

function unsubscribeEvents() {
	source.close();
}

/*
*
*	Inspections
*
*/
function getInspections() {
	insptab = document.getElementById("inspectiontable");
	rowcount = insptab.rows.length
	for (i = 1; i < rowcount; i++) {
		insptab.deleteRow(1);
	}
	url = "https://" + location.host + "/api/v1/inspections/summary"
	sendRequest(url, "GET", null, null, null, function () {
		if (xmlhttp.readyState == 4) {
			if (xmlhttp.status == 200) {
				inspections = JSON.parse(xmlhttp.responseText)
				UX_updateInspections()
			} else {
				result = JSON.parse(xmlhttp.responseText);
				UX_flasherror(result.fault);
			}
		}
	});
}

function getImageUrl(inspUuid, callback) {
	url = "https://" + location.host + "/api/v1/inspections/imageURL?uuid=" + inspUuid
	sendRequest(url, "GET", null, null, null, function () {
		if (xmlhttp.readyState == 4) {
			if (xmlhttp.status == 200) {
				var imageObj = JSON.parse(xmlhttp.responseText);
				var imageUrl =  "https://" + location.host + imageObj.imageURL;
				callback(imageUrl);
			} else {
				result = JSON.parse(xmlhttp.responseText);
				UX_flasherror(result.fault);
			}
		}
	});
}

function getFilterData(inspUuid) {
	url = "https://" + location.host + "/api/v1/inspections/images/filterdata?uuid=" + inspUuid;
	sendRequest(url, "GET", null, null, null, function () {
		if (xmlhttp.readyState == 4) {
			if (xmlhttp.status == 200) {
				var filterdata = JSON.parse(xmlhttp.responseText);
				UX_rebuildTable(inspUuid, filterdata)
			} else {
				result = JSON.parse(xmlhttp.responseText);
				UX_flasherror(result.fault);
				UX_hidespin();
			}
		}
	});
}

function getImageDetail(inspUuid, filename) {
	url = "https://" + location.host + "/api/v1/inspections/images/detail?uuid=" + inspUuid + "&name=" + filename;
	sendRequest(url, "GET", null, null, null, function () {
		if (xmlhttp.readyState == 4) {
			if (xmlhttp.status == 200) {
				var imageData = JSON.parse(xmlhttp.responseText);
				UX_renderImage(imageData)
			} else {
				result = JSON.parse(xmlhttp.responseText);
				UX_flasherror(result.fault);
			}
		}
	});
}

/*
*
*	Service Routines
*
*/
function init() {
	UX_init();
}

function sendRequest(url, method, body, custheader, headerval, callback) {
	xmlhttp = new XMLHttpRequest();

	xmlhttp.onreadystatechange = callback;
	xmlhttp.open(method, url, true);
	xmlhttp.setRequestHeader("Content-Type", "application/json");
	xmlhttp.setRequestHeader("mvie-controller", authtoken);
	if (custheader != null) {
		xmlhttp.setRequestHeader(custheader, headerval);
	}
	if (method != "GET" && method != "DELETE") {
		if (body != null) {
			xmlhttp.send(JSON.stringify(body));
		} else {
			xmlhttp.send();
		}
	} else {
		xmlhttp.send();
	}
}

function sendFormData(url, method, formData, callback) {
	xmlhttp = new XMLHttpRequest();

	xmlhttp.onreadystatechange = callback;
	xmlhttp.open(method, url, true);
	//xmlhttp.setRequestHeader("Content-Type", "multipart/form-data");
	xmlhttp.setRequestHeader("mvie-controller", authtoken);
	if (method != "GET" && method != "DELETE") {
		xmlhttp.send(formData);
	} else {
		xmlhttp.send();
	}
}

function parseParamsToObject(aQueryStr, delimiter) {
	var nvps = aQueryStr.split(delimiter);
	var nvs = {}
	for (i in nvps) {
		nv = nvps[i].split("=");
		nvs[nv[0].trim()] = nv[1].trim();
	}
	return nvs;
}

