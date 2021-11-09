var login;
var logout;
var status;
var backup;
var purge;
var user;
var flashcontainer;
var actionId;
var action;
var imageObj;
var metadata = {};


function UX_init() {
	flashcontainer = document.createElement("div");
	flashcontainer.className = "flash_container";
	document.body.append(flashcontainer);
	UX_setLoggedOut();
	baseurl = "https://" + location.host + "/api/v1/";
	document.getElementById("login").addEventListener("click", login);
	document.getElementById("logout").addEventListener("click", logout);
	document.body.addEventListener("unload", logout);
	UX_closeInspect();
	UX_setupImage();

}

function UX_flashsuccess(message) {
	var flash = document.createElement("div");
	flash.classList.add("success");
	flash.innerHTML = message;
	setTimeout(function () {
		flash.remove();
	}, 5000);
	UX_flashcommon(flash);
}

function UX_flasherror(message) {
	var flash = document.createElement("div");
	flash.classList.add("error");
	flash.innerHTML = message;
	UX_flashcommon(flash);
}

function UX_flashwarn(message) {
	var flash = document.createElement("div");
	flash.classList.add("warn");
	flash.innerHTML = message;
	UX_flashcommon(flash);
}

function UX_flashinfo(message) {
	var flash = document.createElement("div");
	flash.classList.add("info");
	flash.innerHTML = message;
	setTimeout(function () {
		flash.remove();
	}, 5000);
	UX_flashcommon(flash);
}

function UX_flashcommon(flash) {
	flash.classList.add("flash");
	flash.addEventListener("click", function () {
		flash.remove();
	});
	flashcontainer.append(flash)
}

function UX_flash(message, type, timeout) {
	var flash = document.createElement("div");
	flash.classList.add("flash");
	flash.classList.add(type);
	flash.innerHTML = message;
	if (timeout != null) {
		setTimeout(function () {
			flash.remove();
		}, timeout);
	}
	flash.addEventListener("click", function () {
		flash.remove();
	});
	flashcontainer.append(flash)
}

function UX_setLoggedIn() {
	document.getElementById("login").style.display = "none"
	document.getElementById("logout").style.display = "inline-block"
}

function UX_setLoggedOut() {
	document.getElementById("login").style.display = "inline-block"
	document.getElementById("logout").style.display = "none"
}

function UX_updateInspections() {
	insptab = document.getElementById("inspectiontable");
	rowcount = insptab.rows.length
	for (i = 1; i < rowcount; i++) {
		insptab.deleteRow(1);
	}
	devcount = 0;
	for (i = 0; i < inspections.length; i++) {
		devcount++;
		let row = insptab.insertRow(devcount);
		row.insertCell(0);
		let cell2 = row.insertCell(1);
		let cell3 = row.insertCell(2);
		let cell4 = row.insertCell(3);
		let cell5 = row.insertCell(4);
		let cell6 = row.insertCell(5);
		let cell7 = row.insertCell(6);
		let cell8 = row.insertCell(7);
		let cell9 = row.insertCell(8);
		var link = document.createElement('a');
		link.appendChild(document.createTextNode(inspections[i].name));
		link.setAttribute('href', "#");
		let inspUuid = inspections[i].inspection_uuid;
		link.onclick = function () { UX_inspect(`${inspUuid}`) };
		cell2.appendChild(link);
		cell3.innerHTML = inspections[i].mode;
		cell4.innerHTML = inspections[i].enabled ? "enabled" : "disabled";
		cell5.innerHTML = inspections[i].stats.imagecnt;
		cell6.innerHTML = inspections[i].stats.pass;
		cell7.innerHTML = inspections[i].stats.fail;
		cell8.innerHTML = inspections[i].stats.inconclusive;
		cell9.innerHTML = inspections[i].stats.alerts;
	}
	UX_populateRow(0);
}

function UX_populateRow(rowNum) {
	if (rowNum == inspections.length) {
		return;
	}
	getImageUrl(inspections[rowNum].inspection_uuid, function (url) {
		let img = document.createElement('img');
		img.src = url;
		img.style.width = "120px";
		img.style.height = "90px";
		let insptab = document.getElementById("inspectiontable");
		insptab.rows[rowNum + 1].cells[0].appendChild(img);
		UX_populateRow(rowNum + 1);
	});
}

function UX_inspect(inspUuid) {
	UX_showspin();
	UX_clearImage();
	UX_clearTable();
	document.getElementById("inspectionsdiv").style.display = "none";
	document.getElementById("inspectdiv").style.display = "block";
	getFilterData(inspUuid);
}

function UX_clearTable() {
	var imageTable = document.getElementById("inspecttable")
	var rowcount = imageTable.rows.length
	for (i = 1; i <= rowcount; i++) {
		imageTable.deleteRow(0);
	}
}

function UX_rebuildTable(inspUuid, filterData) {
	UX_clearTable();
	var imageTable = document.getElementById("inspecttable")
	var images = filterData.i;
	var currrow = 0;
	var currcell = 0;
	for (i = 0; i < images.length; i++) {
		if ((i % 5) == 0) {
			var row = imageTable.insertRow(currrow);
			currrow++;
			currcell = 0;
		}
		let filename = images[i].f;
		let imageUrl = "https://" + location.host + "/opt/ibm/vision-edge/images/" + inspUuid + "/" + filename;
		let img = document.createElement('img');
		img.src = imageUrl;
		img.style.width = "120px";
		img.style.height = "90px";
		img.onclick = function () { getImageDetail(`${inspUuid}`, `${filename}`) };
		
		if (images[i].d != null) {
			UX_styleImage(images[i].d, img)
		} else {
			img.classList.add("noresult");
		}
		
		let cell = row.insertCell(currcell);
		cell.appendChild(img);
		currcell++;
	}
	UX_hidespin();
}

function UX_setupImage() {
	canvas = document.getElementById("thecanvas");
	context = canvas.getContext('2d');
	imageObj = new Image();
	imageObj.src = "default.png";
	imageObj.onload = function () {
		context.drawImage(imageObj, 0, 0, 400, 300);
		imgwidth = this.width;
		imgheight = this.height;
		xscale = 400 / imgwidth
		yscale = 300 / imgheight
		if (metadata.hasOwnProperty("Image")) {
			if (metadata.Image.inferences != null) {
				for (var i = 0; i < metadata.Image.inferences.length; i++) {
					xpos = metadata.Image.inferences[i].rectangle.min.x * xscale;
					ypos = metadata.Image.inferences[i].rectangle.min.y * yscale;
					width = (metadata.Image.inferences[i].rectangle.max.x - metadata.Image.inferences[i].rectangle.min.x) * xscale;
					height = (metadata.Image.inferences[i].rectangle.max.y - metadata.Image.inferences[i].rectangle.min.y) * yscale;
	
					context.beginPath();
					context.rect(xpos, ypos, width, height);
					context.lineWidth = 4;
					context.strokeStyle = 'red';
					context.stroke();
				}
			}
		}
	};
}

function UX_renderImage(imageData) {
	canvas = document.getElementById("thecanvas");
	UX_unstyleImage(canvas)
	UX_styleImage(imageData.Image.results, canvas)
	metadata = imageData;
	imageObj.src = "/opt/ibm/vision-edge/images/" + imageData.inspection_uuid + "/" + imageData.filename + "?" + new Date().getTime();
	document.getElementById("metadata").innerHTML = JSON.stringify(imageData.Image, null, 2);
}

function UX_clearImage(imageData) {
	metadata = {};
	canvas = document.getElementById("thecanvas");  
	UX_unstyleImage(canvas)
	imageObj.src = "default.png";
	document.getElementById("metadata").innerHTML = "";
}

function UX_styleImage(data, img) {
	let result = "noresult";
	let radius = "0px";
	data.forEach(function(item) {
		if (item.hasOwnProperty("r")) {
			console.log("pre : " + result);
			result = UX_getResult(result, item.r);
			console.log("post : " + result);
			if (item.a) {
				radius = "20px";
			}
		} else if (item.hasOwnProperty("result")) {
			result = UX_getResult(result, item.result)
			if (item.hasOwnProperty("alert_type")) {
				radius = "40px";
			}
		}
	});
	img.classList.add(result);
	img.style.borderRadius = radius;
}

function UX_getResult(prevResult, result) {
	var newresult = prevResult;
	switch(result) {
		case "fail":
			newresult = "fail";
			break;
		case "inconclusive":
			if (prevResult == "pass" || prevResult == "noresult") {
				newresult = "inconclusive";
			}
			break;
		case "pass":
			if (prevResult == "noresult") {
				newresult = "pass";
			}
	}
	console.log(prevResult, result, newresult);
	return newresult;
}

function UX_unstyleImage(img) {
	img.classList.remove("pass", "fail", "inconclusive", "noresult");
	img.classList.remove("canvaspass", "canvasfail", "canvasinconclusive", "canvasnoresult");
	img.style.borderRadius = "0px";
}

function UX_closeInspect() {
	document.getElementById("inspectionsdiv").style.display = "block";
	document.getElementById("inspectdiv").style.display = "none";
}

function UX_showspin() {
	document.getElementById("spin").style.display = "block"
}

function UX_hidespin() {
	document.getElementById("spin").style.display = "none"
}
/*
window.onscroll = function() {
	var thediv = document.getElementById("canvasDiv");
	var scroll = window.pageYOffset;

	if (scroll <= 28) {
		thediv.style.top = "30px";
	} else {
		thediv.style.top = (scroll + 2) + "px";
	}
  };
*/