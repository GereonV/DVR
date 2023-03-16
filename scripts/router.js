class Router {
	#neighbors = new Map; // neighborIP -> [neighborRouter, distance]
	#routingTable;

	constructor(ip) {
		this.#routingTable = new RoutingTable(ip);
	}

	get ip() {
		return this.#routingTable.ip;
	}

	get hasChanges() {
		return this.#routingTable.hasChanges;
	}

	updateNeighbors() {
		const changes = this.#routingTable.popChanges();
		for(const [neighbor, distance] of this.#neighbors.values())
			neighbor.#routingTable.update(changes, this.ip, distance);
	}

	getConnection(otherRouterIP) {
		return this.#neighbors.get(otherRouterIP)?.[1];
	}

	getNeighborIPs() {
		const ips = [];
		for(const ip of this.#neighbors.keys())
			ips.push(ip);
		return ips;
	}

	createHtmlTable() {
		const table = document.createElement("table");
		table.id = `table-${this.ip}`;
		const caption = document.createElement("caption");
		caption.textContent = this.ip;
		table.appendChild(caption);
		const tbody = document.createElement("tbody");
		table.appendChild(tbody);
		const firstRow = document.createElement("tr");
		for(const colTitle of ["target", "next hop", "distance"]) {
			const th = document.createElement("th");
			th.textContent = colTitle;
			firstRow.appendChild(th);
		}
		tbody.appendChild(firstRow);
		for(const [target, [nextHop, distance]] of this.#routingTable.copyDistanceVector().entries()) {
			const row = document.createElement("tr");
			for(const colData of [target, nextHop, distance]) {
				const td = document.createElement("td");
				td.textContent = colData;
				row.appendChild(td);
			}
			tbody.appendChild(row);
		}
		return table;
	}

	static deleteRouterAndResetRoutingTables(routerIP, routers) {
		if(!routers.delete(routerIP))
			return;
		routers.forEach(router => {
			router.#neighbors.delete(routerIP);
			router.#routingTable = new RoutingTable(router.ip);
		});
	}

	static setConnection(router1, router2, distance) {
		router1.#neighbors.set(router2.ip, [router2, distance]);
		router2.#neighbors.set(router1.ip, [router1, distance]);
	}

	static deleteConnection(router1, router2) {
		router1.#neighbors.delete(router2.ip);
		router2.#neighbors.delete(router1.ip);
		router1.#routingTable.deleteDirectConnection(router2.ip);
		router2.#routingTable.deleteDirectConnection(router1.ip);
	}
}

class RoutingTable {
	#ip;
	#routes = new Map; // targetIP -> [nextHopIP, distance]
	#changes = new Map; // targetIP -> distance

	constructor(ip) {
		this.#ip = ip;
		this.#routes.set(ip, [null, 0]);
	}

	get ip() {
		return this.#ip;
	}

	get hasChanges() {
		return this.#changes.size !== 0;
	}

	popChanges() {
		const c = this.#changes;
		this.#changes = new Map;
		return c;
	}

	copyDistanceVector() {
		return new Map(this.#routes);
	}

	getNextHopIP(targetIP) {
		return this.#routes.get(targetIP)?.[0];
	}

	deleteDirectConnection(connectedIP) {
		for(const [targetIP, [nextHopIP, _distance]] of this.#routes) {
			if(nextHopIP !== connectedIP)
				continue;
			this.#changes.set(targetIP, Infinity);
			this.#routes.delete(targetIP);
		}
	}

	#updateIfNecessary(targetIP, nextHopIP, distanceToTarget) {
		const routeToTarget = this.#routes.get(targetIP);
		// if(routeToTarget && (routeToTarget[0] !== nextHopIP && routeToTarget[1] <= distanceToTarget || routeToTarget[1] === distanceToTarget)) // other worse route or same route
		if(routeToTarget && routeToTarget[1] <= distanceToTarget)
			return;
		this.#changes.set(targetIP, distanceToTarget);
		if(distanceToTarget === Infinity)
			this.#routes.delete(targetIP);
		else
			this.#routes.set(targetIP, [nextHopIP, distanceToTarget]);
	}

	update(distancesOfOther, otherIP, directDistanceToOther) {
		this.#updateIfNecessary(otherIP, otherIP, directDistanceToOther);
		const [nextHopToOtherIP, distanceToOther] = this.#routes.get(otherIP);
		for(const [targetIP, distanceFromOtherToTarget] of distancesOfOther.entries()) {
			if(targetIP === nextHopToOtherIP)
				continue;
			this.#updateIfNecessary(targetIP, nextHopToOtherIP, distanceFromOtherToTarget + distanceToOther);
		}
	}
}

class Network {
	#routers = new Map; // endpointIP -> endpoint

	addRouter(ip) {
		if(this.#routers.has(ip))
			return false;
		this.#routers.set(ip, new Router(ip));
		return true;
	}

	deleteRouterAndReset(routerIP) {
		Router.deleteRouterAndResetRoutingTables(routerIP, this.#routers);
	}

	setConnection(router1IP, router2IP, distance) {
		Router.setConnection(this.#routers.get(router1IP), this.#routers.get(router2IP), distance);
	}

	deleteConnectionAndReset(router1IP, router2IP) {
		Router.deleteConnection(this.#routers.get(router1IP), this.#routers.get(router2IP));
	}

	getConnection(router1IP, router2IP) {
		return this.#routers.get(router1IP).getConnection(router2IP);
	}

	getNeighborsOf(routerIP) {
		return this.#routers.get(routerIP).getNeighborIPs();
	}

	propagate(routerIP) {
		this.#routers.get(routerIP).updateNeighbors();
	}

	fillWithRoutingTables(element) {
		element.replaceChildren();
		for(const router of this.#routers.values())
			element.appendChild(router.createHtmlTable());
	}

	checkForChanges() {
		const changes = new Map;
		for(const [routerIP, router] of this.#routers.entries())
			changes.set(routerIP, router.hasChanges);
		return changes;
	}
}
