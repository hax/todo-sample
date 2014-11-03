'use strict'

function TodoList() {
}
TodoList.prototype.load = function () {
	this.data = [{content: 'Task 1', done: true}, {content: 'Task 2', done: false}]
}
TodoList.prototype.save = function () {
}
TodoList.prototype.add = function (content) {
	this.data.push({content: content, done: false})
	this.save()
}
TodoList.prototype.update = function (index, done) {
	this.data[index].done = done
	this.save()
}

var todo = new TodoList
todo.load()

var allPorts = []
onconnect = function (e) {
	var port = e.ports[0]
	allPorts.push(port)
	port.postMessage('Shared worker connected ' + e.ports.length + ', ' + allPorts.length)
	port.postMessage({command: 'load', list: todo.data})
	port.onmessage = function (e) {
		port.postMessage('recieved command: ' + e.data.command)
		switch (e.data.command) {
			case 'add':
				todo.add(e.data.content)
				broadcast('add', todo.data[todo.data.length - 1], todo.data.length - 1)
				break
			case 'update':
				todo.update(e.data.index, e.data.done)
				broadcast('update', todo.data[e.data.index], e.data.index)
				break
			default:
				port.postMessage('Unknown command: ' + e.data.command)
		}
	}
}

function broadcast(command, item, index) {
	allPorts.forEach(function (port) {
		port.postMessage({command: command, item: item, index: index})
	})
}