class Router {
	#ip;
	#neighbors = new Map; // neighborIP -> [neighborRouter, distance]
	#routingTable = new RoutingTable;

	constructor(ip) {
		this.#ip = ip;
	}

	get ip() {
		return this.#ip;
	}

	updateNeighbors() {
		if(!this.hasChanges)
			return;
		const changes = this.#routingTable.popChanges();
		for(const [neighbor, distance] of this.#neighbors.values())
			neighbor.#routingTable.update(changes, this.#ip, distance);
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

	static deleteRouterAndResetRoutingTables(routerIP, routers) {
		if(!routers.delete(routerIP))
			return;
		routers.forEach(router => {
			router.#neighbors.delete(routerIP);
			router.#routingTable = new RoutingTable;
		});
	}

	static setConnection(router1, router2, distance) {
		router1.#neighbors.set(router2.#ip, [router2, distance]);
		router2.#neighbors.set(router1.#ip, [router1, distance]);
	}

	static deleteConnection(router1, router2) {
		router1.#neighbors.delete(router2.#ip);
		router2.#neighbors.delete(router1.#ip);
		router1.#routingTable.deleteDirectConnection(router2.#ip);
		router2.#routingTable.deleteDirectConnection(router1.#ip);
	}
}

class RoutingTable {
	#routes = new Map; // targetIP -> [nextHopIP, distance]
	#changes = new Map; // targetIP -> distance

	get hasChanges() {
		return this.#changes.size !== 0;
	}

	popChanges() {
		const c = this.#changes;
		this.#changes = new Map;
		return c;
	}

	getNextHopIP(targetIP) {
		return this.#routes.get(targetIP)?.[0];
	}

	deleteDirectConnection(targetIP) {
		if(this.getNextHopIP(targetIP) !== targetIP) 
			return;
		this.#changes.set(targetIP, Infinity);
		this.#routes.delete(targetIP);
	}

	#updateIfNecessary(targetIP, nextHopIP, distanceToTarget) {
		const routeToTarget = this.#routes.get(targetIP);
		if(routeToTarget && routeToTarget[0] !== nextHopIP && routeToTarget[1] <= distanceToTarget) // other worse route
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
		for(const [targetIP, distanceFromOtherToTarget] of distancesOfOther.entries())
			this.#updateIfNecessary(targetIP, nextHopToOtherIP, distanceFromOtherToTarget + distanceToOther);
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
}
