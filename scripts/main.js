const AREA = document.getElementById("area");
const SVG = document.getElementById("svg");
const TABLES = document.getElementById("tables")

AREA.addEventListener("click", clickRouterAdd);
AREA.addEventListener("click", clickConnection);

const network = new Network;
const connections = new Map; // [ip1, ip2] -> [line, text]

function clickRouterAdd(event) {
	const x = event.offsetX;
	const y = event.offsetY;
	if(event.button !== 0 || event.target !== AREA || !isPositionValid(x, y))
		return;
	const element = createRouter();
	if(!element)
		return;
	element.addEventListener("click", propagate);
	element.addEventListener("mousedown", event => {
		if(!event.ctrlKey)
			return;
		const centerToCursorX = element.offsetWidth  / 2 - event.offsetX;
		const centerToCursorY = element.offsetHeight / 2 - event.offsetY;
		AREA.addEventListener("mousemove", move);
		AREA.addEventListener("mouseup", stop);
		element.removeEventListener("click", propagate);
		function move(event) {
			if(event.target !== AREA)
				return;
			const x = event.offsetX + centerToCursorX;
			const y = event.offsetY + centerToCursorY;
			if(!isPositionValid(x, y))
				return;
			toPosition(element, x, y);
			for(other of network.getNeighborsOf(element.id))
				moveLineBetween(element, document.getElementById(other));
		}
		function stop() {
			AREA.removeEventListener("mousemove", move);
			AREA.removeEventListener("mouseup", stop);
			element.addEventListener("click", propagate);
		}
	});
	AREA.appendChild(element);
	toPosition(element, x, y);
	function propagate(event) {
		if(event.shiftKey)
			return;
		network.propagate(element.id);
		updateRoutingTables();
	}
}

let selectedElement = null;
let deleteMode = false;
function clickConnection(event) {
	if(!event.shiftKey || event.target === AREA)
		return;
	if(!selectedElement) {
		selectedElement = event.target;
		selectedElement.classList.add("selected");
		return;
	}
	const element1 = selectedElement;
	const element2 = event.target;
	const ip1 = element1.id, ip2 = element2.id;
	if(element1 === element2) {
		if(!deleteMode) {
			selectedElement.classList.replace("selected", "selected-for-deletion");
			deleteMode = true;
		} else {
			selectedElement.classList.remove("selected-for-deletion");
			deleteMode = false;
			selectedElement = null;
		}
		return;
	}
	selectedElement.classList.remove("selected", "selected-for-deletion");
	selectedElement = null;
	deleteMode = false;
	const existingConnection = connections.get(getConnectionString(ip1, ip2));
	if(!existingConnection) {
		if(createLine(ip1, ip2))
			moveLineBetween(element1, element2);
	} else if(deleteMode) {
		network.deleteConnectionAndReset(ip1, ip2);
		updateRoutingTables();
		connections.delete(getConnectionString(ip1, ip2));
		connections.delete(getConnectionString(ip2, ip1));
		SVG.removeChild(existingConnection[0]);
		SVG.removeChild(existingConnection[1]);
	} else {
		const distance = promptDistance();
		if(distance !== null) {
			network.setConnection(ip1, ip2, distance);
			existingConnection[1].textContent = distance;
		}
	}
}

function createRouter() {
	let ip;
	do {
		ip = prompt("Enter IP");
		if(ip === null)
			return null;
	} while(!isValidIP(ip) || !network.addRouter(ip));
	network.fillWithRoutingTables(TABLES);
	const element = document.createElement("div");
	element.id = ip;
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

function promptDistance() {
	while(true) {
		const input = prompt("Enter distance");
		if(input === null || input === "")
			return null;
		const distance = +input;
		if(!isNaN(distance))
			return distance;
	}
}

function createLine(ip1, ip2) {
	const distance = promptDistance();
	if(distance === null)
		return false;
	network.setConnection(ip1, ip2, distance);
	const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
	const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
	text.textContent = distance;
	connections.set(getConnectionString(ip1, ip2), [line, text]);
	connections.set(getConnectionString(ip2, ip1), [line, text]);
	SVG.appendChild(line);
	SVG.appendChild(text);
	return true;
}

function moveLineBetween(element1, element2) {
	const [line, text] = connections.get(getConnectionString(element1.id, element2.id));
	const x1 = element1.offsetLeft + element1.offsetWidth / 2;
	const x2 = element2.offsetLeft + element2.offsetWidth / 2;
	const y1 = element1.offsetTop + element1.offsetHeight / 2;
	const y2 = element2.offsetTop + element2.offsetHeight / 2;
	line.setAttribute("x1", x1);
	line.setAttribute("y1", y1);
	line.setAttribute("x2", x2);
	line.setAttribute("y2", y2);
	text.setAttribute("x", (x1 + x2) / 2);
	text.setAttribute("y", (y1 + y2) / 2);
}

function getConnectionString(ip1, ip2) {
	return `${ip1}:${ip2}`;
}

function updateRoutingTables() {
	network.fillWithRoutingTables(TABLES);
	for(const [ip, hasChanges] of network.checkForChanges()) {
		const element = document.getElementById(ip);
		if(hasChanges)
			element.classList.add("hasChanges");
		else
			element.classList.remove("hasChanges");
	}
}
