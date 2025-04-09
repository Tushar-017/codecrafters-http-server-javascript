const net = require("net")

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!")

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const request = data.toString()
    let responseStatus
    const [method, path, _] = request.split(" ")
    if (method === "GET") {
      responseStatus = path === "/" ? "200 OK" : "404 Not Found"
    }
    socket.write(`HTTP/1.1 ${responseStatus}\r\n\r\n`)

    socket.on("close", () => {
      socket.end()
    })
  })
})

server.listen(4221, "localhost")
