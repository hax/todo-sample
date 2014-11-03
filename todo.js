'use strict'

function TodoList() {
	var _this = this
	window.addEventListener('storage', function (e) {
		if (e.key === 'todo-list') {
			_this.load()
			if (typeof _this.onupdate === 'function') _this.onupdate()
		}
	})
}
TodoList.prototype.load = function () {
	var data = localStorage.getItem('todo-list')
	if (data) data = JSON.parse(data)
	else data = [{content: 'Task 1', done: true}, {content: 'Task 2', done: false}]
	this.data = data
}
TodoList.prototype.save = function () {
	localStorage.setItem('todo-list', JSON.stringify(this.data))
}
TodoList.prototype.add = function (content) {
	this.data.push({content: content, done: false})
	this.save()
}
TodoList.prototype.updateStatus = function (index, done) {
	this.data[index].done = done
	this.save()
}

//var todo = new TodoList

onconnect = function (e) {
	var port = e.ports[0]
	port.postMessage('connected')
	port.onmessage = function (e) {
		console.log(e.data)
	}
}


