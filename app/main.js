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
    const reqHeaders = request.split("\r\n")

    // console.log(reqHeaders, "reqHeaders")
    const [method, path, _] = request.split(" ")

    if (method === "GET") {
      if (path === "/") {
        responseStatus = "200 OK"
      } else if (path.startsWith("/echo/")) {
        const param = path.split("/")[2]
        responseStatus = "200 OK"
        contentType = "Content-Type: text/plain"
        contentLength = `Content-Length: ${param.length}`
        body = param
      } else if (path === "/user-agent") {
        const userAgent = reqHeaders[8].split("User-Agent: ")[1]
        // console.log(userAgent, "userAgent")
        // console.log(userAgent.length, "LENGTH")
        responseStatus = "200 OK"
        contentType = "Content-Type: text/plain"
        contentLength = `Content-Length: ${userAgent.length}`
        body = userAgent
      }
    }

    const headers = [contentType, contentLength].filter(Boolean)
    const responseLines = [`HTTP/1.1 ${responseStatus}`, ...headers, "", body]
    const response = responseLines.join("\r\n")

    socket.write(response)
    socket.end()
  })
  socket.on("close", () => {
    socket.end()
  })
})

server.listen(4221, "localhost")
