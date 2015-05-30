var WebSocketServer = require('ws').Server,
	SyncServer = require('../lib').SyncServer,
	docs = {},
	PORT = 3030

console.log('Starting sync server on port '+PORT)

var syncserver = new SyncServer(
{
	socket: new WebSocketServer({port: PORT}),
	get_object: function (id)
	{
		if (!docs[id])
		{
			docs[id] = { id: id }
		}
		return docs[id]
	},
	onchange: function (doc)
	{
		docs[doc.id] = doc
	},
	onerror: function (e)
	{
		console.error(e)
	}
})