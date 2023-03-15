const NAME_TEXT = document.getElementById("name");
const IP_TEXT = document.getElementById("ip");
const ROUTER_CHECKBOX = document.getElementById("router");
const AREA_DIV = document.getElementById("area");
AREA_DIV.addEventListener("click", areaDivClick);

const network = new Network;

function areaDivClick(event) {
	const areaDiv = event.currentTarget;
	const x = event.offsetX;
	const y = event.offsetY;
	if(event.target !== areaDiv || !isPositionValid(x, y))
		return;
	let ip;
	do {
		ip = prompt("Enter IP");
		if(ip === null)
			return;
	} while(!isValidIP(ip));
	if(!network.addRouter(ip))
		return;
	const element = createRouter(ip);
	element.addEventListener("mousedown", clickEvent => {
		const centerToCursorX = element.offsetWidth  / 2 - clickEvent.offsetX;
		const centerToCursorY = element.offsetHeight / 2 - clickEvent.offsetY;
		areaDiv.addEventListener("mousemove", move);
		areaDiv.addEventListener("mouseup", stop);
		function move(moveEvent) {
			if(moveEvent.target !== moveEvent.currentTarget)
				return;
			const x = moveEvent.offsetX + centerToCursorX;
			const y = moveEvent.offsetY + centerToCursorY;
			if(isPositionValid(x, y))
				toPosition(element, x, y);
		}
		function stop() {
			areaDiv.removeEventListener("mousemove", move);
			areaDiv.removeEventListener("mouseup", stop);
		}
	});
	element.addEventListener("mousedown", evt => {
		// TODO connection
	});
	event.currentTarget.appendChild(element);
	toPosition(element, x, y);
}

function createRouter(ip) {
	const element = document.createElement("div");
	element.className = "router";
	element.appendChild(document.createTextNode(ip));
	return element;
}

function isValidIP(string) {
	const digit = "([01]?\\d{1,2}|2([0-4]\\d|5[0-5]))";
	const regex = RegExp(`^${digit}\\.${digit}\\.${digit}\\.${digit}$`);
	return regex.test(string);
}

function isPositionValid(x, y) {
	// TODO
	return true;
}

function toPosition(element, x, y) {
	element.style.top = (y - element.offsetHeight / 2) + "px";
	element.style.left = (x - element.offsetWidth / 2) + "px";
}





















































// function inputAlert() {
// 	if(NAME_TEXT.value.length == 0)
// 		return "Name can't be empty";
// 	if(IP_TEXT.value.length === 0)
// 		return "IP can't be empty";
// 	const name = net.getEndpointNameByIP(IP_TEXT.value);
// 	if(name !== undefined)
// 		return `IP already assigned to ${name}`;
// 	return null;
// }
// 
// function clearedInputIfValid() {
// 	const msg = inputAlert();
// 	if(msg !== null) {
// 		alert(msg);
// 		return null;
// 	}
// 	const name = NAME_TEXT.value;
// 	const ip = IP_TEXT.value;
// 	NAME_TEXT.value = "";
// 	IP_TEXT.value = "";
// 	return [name, ip];
// }
// 
// const net = new Network;
// const nodes = new Map; // ip -> element
// 
// function createNode(name, ip, x, y) {
// 	const nameSpan = document.createElement("span");
// 	nameSpan.textContent = name;
// 	const ipSpan = document.createElement("span");
// 	ipSpan.textContent = ip;
// 	const div = document.createElement("div");
// 	nodes.set(ip, div);
// 	div.style.position = "absolute";
// 	div.style.left = x + "px";
// 	div.style.top = y + "px";
// 	div.appendChild(nameSpan);
// 	div.appendChild(document.createElement("br"));
// 	div.appendChild(ipSpan);
// 	AREA_DIV.appendChild(div);
// }
// 
// function areaDivClick(event) {
// 	const input = clearedInputIfValid();
// 	if(input === null)
// 		return;
// 	const [name, ip] = input;
// 	if(ROUTER_CHECKBOX.checked)
// 		net.addRouter(name, ip);
// 	else
// 		net.addEndpoint(name, ip);
// 	createNode(name, ip, event.x, event.y);
// }
