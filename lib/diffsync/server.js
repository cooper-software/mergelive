var SyncHandler = require('./handler').SyncHandler


var SyncServer = function (options)
{
	this.get_object = options.get_object
	this.onchange = options.onchange
	this.socket = options.socket
	
	this.last_connection_id = 0
	this.handlers = {}
	
	this.socket.on('connection', this.onconnection.bind(this))
}

SyncServer.prototype.onconnection = function (socket)
{
	var id = this.last_connection_id,
		handler = new SyncHandler(
		{
			socket: socket,
			get_object: this.get_object,
			onchange: function (object)
			{
				this.onchange(object)
				this.broadcast_change(id, object)
			}.bind(this)
		})
		
	this.handlers[id] = handler
	socket.on("close", function ()
	{
		delete this.handlers[id]
	}.bind(this))
}

SyncServer.prototype.broadcast_change = function (sender_id)
{
	Object.keys(this.handlers, function (handler_id)
	{
		if (handler_id != sender_id)
		{
			var handler = this.handlers[handler_id]
			
			if (handler)
			{
				handler.push()
			}
		}
	}.bind(this))
}


module.exports = 
{
	SyncServer: SyncServer
}
