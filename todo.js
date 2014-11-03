'use strict'

function TodoList() {
	this.db = new Promise(function (resolve, reject) {
		var req = indexedDB.open('todo')
		req.onupgradeneeded = function (e) {
			var db = e.target.result
			if (!db.objectStoreNames.contains('items')) db.createObjectStore('items', {keyPath: 'index'})
		}
		req.onsuccess = function (e) {
			resolve(e.target.result)
		}
		req.onerror = reject
	})
}
TodoList.prototype.load = function () {
	var _this = this
	return this.data = this.db.then(function (db) {
		return new Promise(function (resolve, reject) {
			var a = []
			var req = db.transaction(['items']).objectStore('items').openCursor()
			req.onsuccess = function (e) {
				var cursor = e.target.result
				if (cursor) {
					a.push(cursor.value)
					cursor.continue()
				} else {
					resolve(a)
				}
			}
			req.onerror = reject
		})
	}).then(function (data) {
		if (data.length === 0) {
			_this.add('Task 1')
			_this.add('Task 2')
		}
		return data
	})
}
TodoList.prototype.save = function (item) {
	return this.db.then(function (db) {
		return new Promise(function (resolve, reject) {
			var req = db.transaction(['items'], 'readwrite').objectStore('items').put(item)
			req.onsuccess = function (e) {
				resolve(item)
			}
			req.onerror = reject
		})
	})
}
TodoList.prototype.add = function (content) {
	var _this = this
	return this.data.then(function (data) {
		var index = data.push({content: content, done: false}) - 1
		return _this.save({content: content, done: false, index: index})
	})
}
TodoList.prototype.update = function (index, done) {
	var _this = this
	return this.data.then(function (data) {
		data[index].done = done
		return _this.save({content: data[index].content, done: done, index: parseInt(index, 10)})
	})
}

var todo = new TodoList
todo.load().then(function (list) {
	console.log('list:', list)
}, function (e) {
	console.error(e)
})

var allPorts = []
onconnect = function (e) {
	var port = e.ports[0]
	allPorts.push(port)
	port.postMessage('Shared worker connected ' + e.ports.length + ', ' + allPorts.length)
	todo.data.then(function (data) {
		port.postMessage({command: 'load', list: data})
	})
	port.onmessage = function (e) {
		port.postMessage('recieved command: ' + e.data.command + JSON.stringify(e.data))
		switch (e.data.command) {
			case 'add':
				todo.add(e.data.content).then(function (item) {
					broadcast('add', item, item.index)
				}, reportError)
				break
			case 'update':
				todo.update(e.data.index, e.data.done).then(function (item) {
					broadcast('update', item, item.index)
				}, reportError)
				break
			default:
				port.postMessage('Unknown command: ' + e.data.command)
		}
	}
	function reportError(e) {
		port.postMessage('Error: ' + JSON.stringify(e))
	}
}

function broadcast(command, item, index) {
	allPorts.forEach(function (port) {
		port.postMessage('broadcast: ' + command + JSON.stringify(item) + index)
		port.postMessage({command: command, item: item, index: index})
	})
}