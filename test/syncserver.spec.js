var SyncServer = require('../lib').SyncServer

var create_fake_socket = function ()
{
    return {
        on: createSpy("on"),
        send: createSpy("send")
    }
}

describe('SyncServer', function ()
{
    it("throws an error if not initialized with a socket", function ()
    {
        var make_server_bad = function () { var server = new SyncServer({ get_object: function () {} }) }
        expect(make_server_bad).toThrow()
    })
    
    it("throws an error if not initialized with a get_object function", function ()
    {
        var make_server_bad = function () { var server = new SyncServer({socket:create_fake_socket()}) }
        expect(make_server_bad).toThrow()
    })
    
    it("has default event handlers", function ()
    {
        var server = new SyncServer({ socket: create_fake_socket(), get_object: function () {} })
        expect(typeof(server.onchange)).toEqual("function")
    })
    
    it("sets up a connection handler when initialized", function ()
    {
        var socket = create_fake_socket(),
            server = new SyncServer({ socket: socket, get_object: function () {} })
        
        expect(socket.on).toHaveBeenCalled()
        expect(socket.on.calls[0].args[0]).toEqual('connection')
    })
    
    it("creates a handler for each new connection", function ()
    {
        var get_object = function () {},
            client_socket = create_fake_socket(),
            server_socket = create_fake_socket(),
            server = new SyncServer({ socket: server_socket, get_object: get_object})
        
        server.onconnection(client_socket)
        var handler = server.handlers[server.last_connection_id]
        expect(handler).toBeDefined()
        expect(handler.socket).toBe(client_socket)
        expect(handler.get_object).toBe(get_object)
    })
    
    it("deletes a handler when its connection is closed", function ()
    {
        var client_socket = create_fake_socket(),
            server = new SyncServer({ socket: create_fake_socket(), get_object: function () {}})
        
        server.onconnection(client_socket)
        var handler = server.handlers[server.last_connection_id]
        expect(handler).toBeDefined()
        expect(client_socket.on).toHaveBeenCalled()
        var close_handler_call = client_socket.on.calls[0]
        expect(close_handler_call.args[0]).toEqual('close')
        expect(close_handler_call.args[1].constructor).toBe(Function)
        close_handler_call.args[1]()
        expect(server.handlers[server.last_connection_id]).not.toBeDefined()
    })
    
    it("fires its change event and broadcasts the change when a handler has a change event", function ()
    {
        var get_object = function () {},
            client_socket = create_fake_socket(),
            server_socket = create_fake_socket(),
            server = new SyncServer({ socket: server_socket, get_object: get_object})
        
        server.onconnection(client_socket)
        
    })
})