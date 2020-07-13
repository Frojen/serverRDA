var MASK_ON_OFF = parseInt("0111111111111110", 2)
var RDA_ON = parseInt("1000000000000001", 2)
var RDA_OFF = 0

var MASK_MUTE = parseInt("1011111111111111", 2)
var RDA_MUTE_ON = 0
var RDA_MUTE_OFF = parseInt("0100000000000000", 2)

var MASK_MONO = parseInt("1101111111111111", 2)
var RDA_MONO_ON = parseInt("0010000000000000", 2)
var RDA_MONO_OFF = 0

var MASK_BASS = parseInt("1110111111111111", 2)
var RDA_BASS_ON = parseInt("0001000000000000", 2)
var RDA_BASS_OFF = 0

var MASK_SEEK = parseInt("1111110111111111", 2)
var RDA_SEEK_UP = parseInt("0000001000000000", 2)
var RDA_SEEK_DOWN = 0

var MASK_FIND = parseInt("1111111011111111", 2)
var RDA_FIND_ON = parseInt("0000000100000000", 2)
var RDA_FIND_OFF = 0

var MASK_RDS = parseInt("1111111111110111", 2)
var RDA_RDS_ON = parseInt("0000000000001000", 2)
var RDA_RDS_OFF = 0

var MASK_FEELS = parseInt("1111111111111011", 2)
var RDA_FEELS_ON = parseInt("0000000000000100", 2)
var RDA_FEELS_OFF = 0

var MASK_RESET = parseInt("1111111111111101", 2)
var RDA_RESET_ON = parseInt("0000000000000010", 2)
var RDA_RESET_OFF = 0

var MASK_FREQ = parseInt("0000000000011111", 2)

var MASK_SPACE = parseInt("1111111111111100", 2)

var MASK_BAND = parseInt("1111111111110011", 2)

var MASK_TUNE = parseInt("1111111111101111", 2)
var RDA_TUNE = parseInt("0000000000010000", 2)

var MASK_DE = parseInt("1111011111111111", 2)
var RDA_DE_75 = 0
var RDA_DE_50 = parseInt("0000100000000000", 2)

var MASK_SOFT_MUTE = parseInt("1111110111111111", 2)
var RDA_SOFT_MUTE_ON = parseInt("0000001000000000", 2)
var RDA_SOFT_MUTE_OFF = 0

var MASK_VOLUME = parseInt("1111111111110000", 2)

var MASK_RDS_READY = parseInt("0111111111111111", 2)

var MASK_TUNE_READY = parseInt("1011111111111111", 2)

var MASK_TUNE_ERROR = parseInt("1101111111111111", 2)

var MASK_RDS_SYNC = parseInt("1110111111111111", 2)

var MASK_STEREO_MONO = parseInt("1111101111111111", 2)

var MASK_RSSI = parseInt("0000000111111111", 2)

var MASK_SIGNAL = parseInt("1111111011111111", 2)

var MASK_ERROR_A = parseInt("1111111111110011", 2)
var MASK_ERROR_B = parseInt("1111111111111100", 2)
var MASK_ERROR_C = parseInt("0011111111111111", 2)
var MASK_ERROR_D = parseInt("1100111111111111", 2)

// window.onload = function () {
	// rdaReset(true)
	// rdaReset(false)
// }

var requestAnswer

var mut=false
function execute(params, adr) {
	function getXmlHttp() {
	  var xmlhttp
	  try {
		xmlhttp = new ActiveXObject('Msxml2.XMLHTTP')
	  } catch (e) {
		try {
		  xmlhttp = new ActiveXObject('Microsoft.XMLHTTP')
		} catch (E) {
		  xmlhttp = false
		}
	  }
	  if (!xmlhttp && typeof XMLHttpRequest != 'undefined') {
		xmlhttp = new XMLHttpRequest()
	  }
	  return xmlhttp
	}

	var xhr = getXmlHttp()
	xhr.open('POST', adr, true)
	
	if (adr == '/getRegisters'){
		xhr.onreadystatechange = function() {
			if (xhr.readyState != 4) return
			
			//clearTimeout(xhrTimeout)
			
			if (xhr.status == 200) {
				
				var answer=xhr.responseText.split(",")
				var answerMas = new Map()
				for (var i=0; i<answer.length; i++){
					answerMas.set(answer[i].split("=")[0],answer[i].split("=")[1])
				}
				callBack.shift()
				callBack[0](answerMas)
			} else {
				handleError(xhr.statusText)
			}
			callBack.shift()
			if (callBack.length != 0) {
				callBack[0]()
			}	
		}	
	
	} else {
		
		xhr.onreadystatechange = function() {
			if (xhr.readyState != 4) return
			
			//clearTimeout(xhrTimeout)
			
			if (xhr.status == 200) {
				//alert(xhr.responseText)
			} else {
				handleError(xhr.statusText)
			}
			callBack.shift()
			if (callBack.length != 0) {
				callBack[0]()
			}			
		}		
	}

	xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
	xhr.send(params)

/* 	var xhrTimeout = setTimeout(function() {
		xhr.abort
		handleError('Timeout')
	}, 10000) */

	function handleError(message) {
		alert('Ошибка: ' + message)
	}
}

function params(reg, comMask, com){
	return 'registers=1&' + reg + '=' + com + '&mask=' + comMask
}

function command(on, reg, maskName, comOn, comOff){
	if (on){
		callBack.push(function() {execute(params(reg, maskName, comOn), '/setRegisters')}) 
	} else {
		callBack.push(function() {execute(params(reg, maskName, comOff), '/setRegisters')}) 
	}
	if (callBack.length == 1){
		callBack[0]()
	}
	
/* 	if (on){
		execute(params(reg, maskName, comOn), '/setRegisters')
	} else {
		execute(params(reg, maskName, comOff), '/setRegisters')
	} */
}
function getCommand(paramsExec, func, first=false){
	if (first) {
		callBack.shift()
		callBack.unshift(func)			
		callBack.unshift(function() {execute(paramsExec, '/getRegisters')}) 
	} else {
	callBack.push(function() {execute(paramsExec, '/getRegisters')}) 
	callBack.push(func)
	if (callBack.length == 2){
		callBack[0]()
	}		
	}
}

function rdaPower(on){
	command(on, 2, MASK_ON_OFF, RDA_ON, RDA_OFF)
	getSpaceBand()
}

function mute(on){
	command(on, 2, MASK_MUTE, RDA_MUTE_ON, RDA_MUTE_OFF)
}

function monoSet(on){
	command(on, 2, MASK_MONO, RDA_MONO_ON, RDA_MONO_OFF)
}

function bassSet(on){
	command(on, 2, MASK_BASS, RDA_BASS_ON, RDA_BASS_OFF)
}

function seekUp(on){
	command(on, 2, MASK_SEEK, RDA_SEEK_UP, RDA_SEEK_DOWN)
}

function find(on){
	command(on, 2, MASK_FIND, RDA_FIND_ON, RDA_FIND_OFF)
}

function rds(on){
	command(on, 2, MASK_RDS, RDA_RDS_ON, RDA_RDS_OFF)
}

function newFeels(on){
	command(on, 2, MASK_FEELS, RDA_FEELS_ON, RDA_FEELS_OFF)
}

function rdaReset(on){
	command(on, 2, MASK_RESET, RDA_RESET_ON, RDA_RESET_OFF)
}

var space = 0.1
var band = 87
var callBack = []

function setFreq(freq){
	var rng=document.getElementById('freq')
	rng.innerHTML=freq
	command(true, 3, MASK_FREQ, (parseInt((freq-band)/space, 10) << 6) | RDA_TUNE)
	afterTuneFinish(getRSSI)
}

function getSpaceBand(){
	space = 0.1;
	band = 87;
}

function setDE(on){
	command(on, 4, MASK_DE, RDA_DE_50, RDA_DE_75)
}

function softMute(on){
	command(on, 4, MASK_SOFT_MUTE, RDA_SOFT_MUTE_ON, RDA_SOFT_MUTE_OFF)
}

function setVolume(valueVolume){
	if (valueVolume > 15) valueVolume = 15
	command(true, 5, MASK_VOLUME, parseInt(valueVolume, 10))
}

function getRdsReady(){
	getCommand('registers=1&rdsReady=10', function(valueReg){
		var result;
		result = (parseInt(valueReg.get('rdsReady'), 10) & (~MASK_RDS_READY))
		if (valueReg) {
			document.getElementById('cb11').value = true
		} else {
			document.getElementById('cb11').value = false
		}		
	})
}

function getFreq(){	
	getCommand('registers=1&freq=3', function(valueReg){
		var result;
		result = (parseInt(valueReg.get('freq'), 10) & (~MASK_FREQ))
		result = (result >> 6)*space + band
		var rng=document.getElementById('freq')
		rng.innerHTML=result
		getRSSI()
	})
}

var countTimer = 0
function afterTuneFinish(funcNex, first=false){
	getCommand('registers=1&tuneReady=10', function(valueReg){
		valueReg = (parseInt(valueReg.get('tuneReady'), 10) & (~MASK_TUNE_READY))
		if (valueReg) {
			countTimer = 0
			funcNex()
			//радио настроено
		} else {
			countTimer++
			if (countTimer == 3) {
				countTimer = 0
				alert("Ошибка настройки")
			} else {
				callBack.splice(1, 0, function () {	setTimeout(function (){	afterTuneFinish(funcNex, true)
																			
 																			/* callBack.unshift(callBack.splice(callBack.length-1,1))
																			callBack.unshift(callBack.splice(callBack.length-1,1)) */
																			callBack[0]()}, 500)})
			}
		}
	}, first)
}

function getTuneError(){
	getCommand('registers=1&tuneError=10', function(valueReg){
		valueReg &= (~MASK_TUNE_ERROR)
		if (valueReg) {
			alert('Ошибка настройки')
		} else {
			alert('Нет ошибки настройки')
		}
	})
}

function getRdsSync(){
	getCommand('registers=1&rdsSync=10', function(valueReg){
		valueReg = (parseInt(valueReg.get('rdsSync'), 10) & (~MASK_RDS_SYNC)
		if (valueReg) {
			document.getElementById('cb12').value = true
		} else {
			document.getElementById('cb12').value = false
		}
	})		
}

function getStereo(){
	getCommand('registers=1&reciveStereo=10', function(valueReg){
		valueReg = (parseInt(valueReg.get('reciveStereo'), 10) & (~MASK_STEREO_MONO)
		if (valueReg) {
			document.getElementById('cb10').value = true
		} else {
			document.getElementById('cb10').value = false
		}
	})	
}

function getRSSI(){
	getCommand('registers=1&rssi=11', function(valueReg){
		valueReg = (parseInt(valueReg.get('rssi'), 10) & (~MASK_RSSI)) >> 9
		var rng=document.getElementById('RSSI')
		rng.value = valueReg
	})
}

function getSinal(){
	getCommand('registers=1&signalYes=11', function(valueReg){
		valueReg = (parseInt(valueReg.get('signalYes'), 10) & (~MASK_SIGNAL)
		if (valueReg) {
			document.getElementById('cb9').value = true
		} else {
			document.getElementById('cb9').value = false
		}	
	})
}

function getRDS(){
	getCommand('registers=1&rdsLevelAB=11&A=12&B=13&C=14&D=15&rdsLevelCD=16', function(valueReg){
		alert('RDS прочитано')	
	})
}

function nextCom(){
	seekUp(true)
	find(true)
	afterTuneFinish(getFreq)
	getStereo()
	getRdsSync()
	getRdsReady()
}

function prevCom(){
	seekUp(false)
	find(true)
	afterTuneFinish(getFreq)
	getStereo()
	getRdsSync()
	getRdsReady()
}

function add1(){
	var rng=document.getElementById('freq')
	var fr = rng.innerHTML
	if (fr == 108) {
		fr = 87
	} else {
		fr += 0.1
	}
	setFreq(fr)
	rng.innerHTML = fr
	afterTuneFinish(getRSSI)
	getSignal()
	getRdsSync()
	getRdsReady()
}

function sub1(){
	var rng=document.getElementById('freq')
	var fr = rng.innerHTML
	if (fr == 87) {
		fr = 108
	} else {
		fr -= 0.1
	}
	setFreq(fr)
	rng.innerHTML = fr
	afterTuneFinish(getRSSI)
	getSignal()
	getRdsSync()
	getRdsReady()
}

function checkInput1(elem){
	var cb=document.getElementById(elem);
	if (cb.checked) {
		mute(true)
	} else {
		mute(false)
	}
}
function checkInput2(elem){
	var cb=document.getElementById(elem);
	if (cb.checked) {
		bassSet(true)
	} else {
		bassSet(false)
	}
}
function checkInput3(elem){
	var cb=document.getElementById(elem);
	if (cb.checked) {
		rds(true)
	} else {
		rds(false)
	}
}
function checkInput4(elem){
	var cb=document.getElementById(elem);
	if (cb.checked) {
		monoSet(false)
	} else {
		monoSet(true)
	}
}
function checkInput5(elem){
	var cb=document.getElementById(elem);
	if (cb.checked) {
		newFeels(true)
	} else {
		newFeels(false)
	}
}
function checkInput6(elem){
	var cb=document.getElementById(elem);
	if (cb.checked) {
		softMute(true)
	} else {
		softMute(false)
	}
}
function checkInput7(elem){
	var cb=document.getElementById(elem);
	var rng=document.getElementById('deSet')
	if (cb.checked) {
		setDE(true)
		rng.innerHTML="Постоянная времени 50 мск"
	} else {
		setDE(false)
		rng.innerHTML="Постоянная времени 75 мск"
	}
}
function checkInput8(elem){
	var cb=document.getElementById(elem);
	if (cb.checked) {
		rdaPower(true)
	} else {
		rdaPower(false)
	}
}

function setFrequency(){
	var cb=document.getElementById('valueFreq').value
	setFreq(cb)
}

function chVolume(){
	var rng=document.getElementById('r1').value
	var di=document.getElementById('vol').innerHTML=rng
	setVolume(rng)
}