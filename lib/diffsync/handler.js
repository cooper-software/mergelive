var SyncDocument = require('./syncdoc').SyncDocument


var SyncHandler = function (options)
{
    options = options || {}
    
    if (!options.socket)
    {
        throw new Error("You must provide a web socket.")
    }
    
    this.socket = options.socket
    this.get_object = options.get_object
    this.oninit = options.oninit || function (error) {}
    this.onchange = options.onchange || function (handler) {}
    this.onerror = options.onerror || function (error) { console.error(error) }
    this.document = null
    
    this.socket.on("message", this.onmessage.bind(this))
}

SyncHandler.prototype.require_document = function ()
{
    if (!this.document)
    {
        throw new Error("No document, you must load one first.")
    }
}

SyncHandler.prototype.load = function (query, callback)
{
    this.socket.send(JSON.stringify({type:'load', data:query}), callback)
}

SyncHandler.prototype.push = function (callback)
{
    this.require_document()
    this.document.push()
    
    if (this.document.edits.length > 0)
    {
        this.socket.send(JSON.stringify({type:'pull', data: this.document.edits}), callback)
    }
    else if (callback)
    {
        callback()
    }
}

SyncHandler.prototype.onmessage = function (message)
{
    var message_object = JSON.parse(message)
    if (!message_object.type)
    {
        throw new Error("Message is missing a type")
    }
    
    var handler = "handle_" + message_object.type
    if (!this[handler])
    {
        throw new Error("Unknown message type: " + message_object.type)
    }
    
    this[handler](message_object.data)
}

SyncHandler.prototype.handle_init = function (object)
{
    this.document = new SyncDocument(object)
    this.oninit()
}

SyncHandler.prototype.handle_acknowledge = function (version)
{
    this.require_document()
    this.document.acknowledge(version)
}

SyncHandler.prototype.handle_pull = function (edits)
{
    this.require_document()
    edits.forEach(function (edit)
    {
        this.document.pull(edit)
    }.bind(this))
    
    this.onchange(this.document.object)
}

SyncHandler.prototype.handle_load = function (query)
{
    if (!this.get_object)
    {
        this.socket.send(JSON.stringify({type:'error', data: 'No object loader available.'}))
        return
    }
    
    var object = this.get_object(query)
    
    if (!object)
    {
        this.socket.send(JSON.stringify({type:'error', data: 'Object could not be loaded.'}))
        return
    }
    
    this.document = new SyncDocument(object)
    this.socket.send(JSON.stringify({type: 'init', data: object}))
}

SyncHandler.prototype.handle_error = function (error)
{
    this.onerror(error)
}

module.exports = 
{
    SyncHandler: SyncHandler
}