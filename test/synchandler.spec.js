var SyncHandler = require("../lib").SyncHandler

var create_fake_socket = function ()
{
    return {
        on: createSpy("on"),
        send: createSpy("send")
    }
}

describe("SyncHandler", function ()
{
    it("throws an error if not initialized with a socket", function ()
    {
        var make_handler_bad = function () { var handler = new SyncHandler() }
        expect(make_handler_bad).toThrow()
    })
    
    it("can be initialized with a `get_object` function", function ()
    {
        var foo = function () {}
        var handler = new SyncHandler({ socket: create_fake_socket(), get_object: foo })
        expect(handler.get_object).toBe(foo)
    })
    
    it("has default event handlers", function ()
    {
        var handler = new SyncHandler({ socket: create_fake_socket() })
        expect(typeof(handler.oninit)).toEqual("function")
        expect(typeof(handler.onchange)).toEqual("function")
        expect(typeof(handler.onerror)).toEqual("function")
    })
    
    it("can be initialized with event handlers", function ()
    {
        var oninit = function () {},
            onchange = function () {},
            onerror = function () {},
            handler = new SyncHandler({ 
                socket: create_fake_socket(),
                oninit: oninit,
                onerror: onerror,
                onchange: onchange
            })
        expect(handler.oninit).toBe(oninit)
        expect(handler.onchange).toBe(onchange)
        expect(handler.onerror).toBe(onerror)
    })
    
    it("starts out without a document", function ()
    {
        var handler = new SyncHandler({socket: create_fake_socket()})
        expect(handler.document).toBeNull()
    })
    
    it("starts listening to messages after initialization", function ()
    {
        var socket = create_fake_socket(),
            handler = new SyncHandler({socket: socket})
        
        expect(socket.on).toHaveBeenCalled()
        expect(socket.on.calls[0].args[0]).toEqual("message")
    })
    
    it("has a way to require a document or fail", function ()
    {
        var handler = new SyncHandler({socket: create_fake_socket()})
        expect(handler.require_document.bind(handler)).toThrow()
    })
    
    it("sends a load request", function ()
    {
        var socket = create_fake_socket(),
            handler = new SyncHandler({socket: socket})
        
        handler.load({foo:23}, {the: "callback"})
        expect(socket.send).toHaveBeenCalledWith(JSON.stringify({type:"load", data:{foo:23}}), {the: "callback"})
    })
    
    it("fails if trying to push without a document", function ()
    {
        var socket = create_fake_socket(),
            handler = new SyncHandler({socket: socket})
        
        expect(handler.push.bind(handler)).toThrow()
    })
    
    it("doesn't send anything when pushing without a change", function ()
    {
        var socket = create_fake_socket(),
            handler = new SyncHandler({socket: socket})
        
        handler.handle_init({})
        handler.push()
        expect(socket.send).not.toHaveBeenCalled()
    })
    
    it("sends edits when pushing with a change", function ()
    {
        var socket = create_fake_socket(),
            handler = new SyncHandler({socket: socket}),
            obj = {},
            callback = function () {}
        
        handler.handle_init(obj)
        obj.foo = 23
        handler.push(callback)
        expect(socket.send).toHaveBeenCalledWith(JSON.stringify({type:'pull', data: handler.document.edits}), callback)
    })
    
    it("fails when attempting to acknowledge without a document", function ()
    {
        var socket = create_fake_socket(),
            handler = new SyncHandler({socket: socket})
        
        expect(handler.handle_acknowledge.bind(handler)).toThrow()
    })
    
    it("can acknowledge", function ()
    {
        var socket = create_fake_socket(),
            handler = new SyncHandler({socket: socket})
        
        handler.handle_init({})
        spyOn(handler.document, "acknowledge")
        handler.handle_acknowledge(123)
        expect(handler.document.acknowledge).toHaveBeenCalledWith(123)
    })
    
    it("fails when attempting to pull edits without a document", function ()
    {
        var socket = create_fake_socket(),
            handler = new SyncHandler({socket: socket})
        
        expect(handler.handle_pull.bind(handler)).toThrow()
    })
    
    it("can pull edits", function ()
    {
        var socket = create_fake_socket(),
            handler = new SyncHandler({socket: socket})
            
        handler.handle_init({})
        spyOn(handler.document, 'pull')
        handler.handle_pull([1,2,3])
        expect(handler.document.pull.calls[0].args).toEqual([1])
        expect(handler.document.pull.calls[1].args).toEqual([2])
        expect(handler.document.pull.calls[2].args).toEqual([3])
    })
    
    it("sends an error if attempting to load without a loader", function ()
    {
        var socket = create_fake_socket(),
            handler = new SyncHandler({socket: socket})
        
        handler.handle_load()
        expect(socket.send).toHaveBeenCalledWith(JSON.stringify({type:'error', data: 'No object loader available.'}))
    })
    
    it("sends an error if the object loader returns nothing", function ()
    {
        var socket = create_fake_socket(),
            handler = new SyncHandler({socket: socket, get_object: function () {}})
        
        handler.handle_load()
        expect(socket.send).toHaveBeenCalledWith(JSON.stringify({type:'error', data: 'Object could not be loaded.'}))
    })
    
    it("initializes a document and sends the object if it can be loaded", function ()
    {
        var socket = create_fake_socket(),
            handler = new SyncHandler({socket: socket, get_object: createSpy("get_object")})
        handler.get_object.andReturn({foo:23})
        
        expect(handler.document).toBeNull()
        handler.handle_load({stuff:'things'})
        expect(handler.document).not.toBeNull()
        expect(handler.get_object).toHaveBeenCalledWith({stuff:'things'})
        expect(socket.send).toHaveBeenCalledWith(JSON.stringify({type: 'init', data: {foo:23}}))
    })
})