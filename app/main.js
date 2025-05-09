const fs = require("fs")
const net = require("net")
const zlib = require("zlib")

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log("Logs from your program will appear here!")

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    let responseStatus = "404 Not Found"
    let contentType = ""
    let contentLength = ""
    let encodingResponse = ""
    let connectionResponse = ""
    let body = ""
    let encoded = 0
    const request = data.toString()
    const reqHeaders = request.split("\r\n")
    const connectionHeader = reqHeaders.find((header) =>
      header.startsWith("Connection: ")
    )

    const connectionStatus = connectionHeader
      ? connectionHeader.split(" ")[1]
      : null
    const connectionClose =
      connectionStatus && connectionStatus.toLowerCase() === "close"
    const supportedEncoding = ["gzip"]

    const [method, path, _] = request.split(" ")

    if (connectionClose) {
      connectionResponse = "Connection: Close"
    }

    if (path === "/") {
      responseStatus = "200 OK"
    } else if (path.startsWith("/files/")) {
      const filename = path.split("/files/")[1]
      const directoryArgIndex = process.argv.indexOf("--directory")
      const directory =
        directoryArgIndex !== -1 ? process.argv[directoryArgIndex + 1] : null

      // Remove trailing slash from directory if it exists
      const cleanDirectory = directory?.endsWith("/")
        ? directory.slice(0, -1)
        : directory

      console.log("Directory:", cleanDirectory)
      console.log("Filename:", filename)
      console.log("Full path:", `${cleanDirectory}/${filename}`)
      if (method === "GET") {
        if (!cleanDirectory) {
          responseStatus = "500 Internal Server Error"
          body = "Directory not specified"
        } else {
          try {
            const fileContent = fs.readFileSync(
              `${cleanDirectory}/${filename}`,
              "binary"
            )
            responseStatus = "200 OK"
            contentType = "Content-Type: application/octet-stream"
            contentLength = `Content-Length: ${Buffer.byteLength(fileContent)}`
            body = fileContent
          } catch (error) {
            console.log("Error details:", error)
            if (error.code === "ENOENT") {
              responseStatus = "404 Not Found"
            } else {
              responseStatus = "500 Internal Server Error"
            }
          }
        }
      } else if (method === "POST") {
        if (!cleanDirectory) {
          responseStatus = "500 Internal Server Error"
          body = "Directory not specified"
        } else {
          reqBody = reqHeaders[reqHeaders.length - 1]
          try {
            fs.writeFileSync(`${cleanDirectory}/${filename}`, reqBody)
            responseStatus = "201 Created"
          } catch (error) {
            responseStatus = "404 Not Found"
          }
        }
      }
    } else if (path.startsWith("/echo/")) {
      const param = path.split("/")[2]
      const acceptEncodingHeader = reqHeaders.find((header) =>
        header.startsWith("Accept-Encoding: ")
      )
      const acceptEncoding = acceptEncodingHeader
        ? acceptEncodingHeader.split("Accept-Encoding: ")[1].split(",")
        : []
      console.log("acceptEncoding :->", acceptEncoding)
      const matchedEncoding = acceptEncoding.filter((encoding) =>
        supportedEncoding.includes(encoding.trim())
      )
      console.log("matchedEncoding :", matchedEncoding)
      responseStatus = "200 OK"
      contentType = "Content-Type: text/plain"

      if (matchedEncoding.length > 0) {
        encodingResponse = `Content-Encoding: ${matchedEncoding.join(", ")}`
        encoded = 1
        const bodyEncoded = zlib.gzipSync(Buffer.from(param))
        const bodyEncodedLength = bodyEncoded.length

        contentLength = `Content-Length: ${bodyEncodedLength}`
        body = bodyEncoded
      } else {
        body = param
        contentLength = `Content-Length: ${Buffer.byteLength(body)}`
      }
    } else if (path === "/user-agent") {
      const userAgentHeader = reqHeaders.find((header) =>
        header.startsWith("User-Agent: ")
      )
      const userAgent = userAgentHeader
        ? userAgentHeader.split("User-Agent: ")[1]
        : ""
      responseStatus = "200 OK"
      contentType = "Content-Type: text/plain"
      contentLength = `Content-Length: ${userAgent.length}`
      body = userAgent
    }

    if (encoded) {
      const headers = [
        contentType,
        contentLength,
        encodingResponse,
        connectionResponse,
      ].filter(Boolean)

      const responseLines = [`HTTP/1.1 ${responseStatus}`, ...headers, "", ""]
      const headerString = responseLines.join("\r\n")
      socket.write(headerString) // write headers as string
      socket.write(body) // write gzipped body as binary
    } else {
      const headers = [contentType, contentLength, connectionResponse].filter(
        Boolean
      )
      const responseLines = [`HTTP/1.1 ${responseStatus}`, ...headers, "", body]
      const response = responseLines.join("\r\n")
      socket.write(response) // full response is plain string
    }
    if (connectionStatus && connectionStatus.toLowerCase() === "close") {
      socket.end()
    }
  })
  socket.on("close", () => {
    socket.end()
  })
})

server.listen(4221, "localhost")
