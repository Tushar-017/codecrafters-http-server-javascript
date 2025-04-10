const net = require("net")

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!")

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    let responseStatus = "404 Not Found"
    let contentType = ""
    let contentLength = ""
    let body = ""
    const request = data.toString()
    const [method, path, _] = request.split(" ")

    if (method === "GET") {
      if (path === "/") {
        responseStatus = "200 OK"
      } else if (path.startsWith("/echo/")) {
        const param = path.split("/")[2]
        responseStatus = "200 OK"
        contentType = "Content-Type: text/plain"
        contentLength = `Content-Length: ${param.length}`
        body = param + "\r\n"
      }
    }

    const headers = [contentType, contentLength].filter(Boolean).join("\r\n")
    const response = [`HTTP/1.1 ${responseStatus}`, headers, " ", body]
      .filter(Boolean)
      .join("\r\n")

    socket.write(response)
    socket.end()
  })
  socket.on("close", () => {
    socket.end()
  })
})

server.listen(4221, "localhost")
